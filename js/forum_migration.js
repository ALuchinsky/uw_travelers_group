const FORUM_MIGRATION_ID = "rooms_themes_v1";

function requireLegacyString(value, field, documentId) {
  if (typeof value !== "string") {
    throw new Error(`Legacy forum document ${documentId} has an invalid ${field}.`);
  }
  return value;
}

function forumMigrationRows(snapshot, transform) {
  return snapshot.docs.map((document) => ({
    id: document.id,
    data: transform(document.id, document.data())
  }));
}

function sameMigrationData(expected, actual) {
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  return expectedKeys.length === actualKeys.length &&
    expectedKeys.every((key, index) =>
      key === actualKeys[index] && expected[key] === actual[key]
    );
}

async function findMissingMigrationRows(collectionName, rows) {
  const snapshot = await window.db.collection(collectionName).get();
  const expectedById = new Map(rows.map((row) => [row.id, row.data]));
  const existingIds = new Set();

  snapshot.docs.forEach((document) => {
    const expected = expectedById.get(document.id);
    if (!expected || !sameMigrationData(expected, document.data())) {
      throw new Error(`The destination collection ${collectionName} contains conflicting data.`);
    }
    existingIds.add(document.id);
  });

  return rows.filter((row) => !existingIds.has(row.id));
}

async function copyForumMigrationRows(collectionName, rows) {
  const missingRows = await findMissingMigrationRows(collectionName, rows);
  const batchSize = 5; // Keep within Firestore Rules' per-batch document-access limit.

  for (let start = 0; start < missingRows.length; start += batchSize) {
    const batch = window.db.batch();
    missingRows.slice(start, start + batchSize).forEach((row) => {
      batch.set(window.db.collection(collectionName).doc(row.id), row.data);
    });
    await batch.commit();
  }
}

async function runForumMigration(statusElement) {
  if (!window.admin || !window.currentUid || !window.db) {
    statusElement.textContent = "Only a signed-in administrator can migrate the forum.";
    return;
  }
  if (!doubleConfirm(
    "Copy the existing forum into the new Rooms > Themes structure?",
    "The original collections will be kept as a backup. Continue?"
  )) {
    return;
  }

  const migrationRef = window.db.collection("forum_migrations").doc(FORUM_MIGRATION_ID);

  try {
    const migrationSnapshot = await migrationRef.get();
    if (migrationSnapshot.exists && migrationSnapshot.data().status === "complete") {
      statusElement.textContent = "The forum migration is already complete.";
      await renderRooms();
      return;
    }

    statusElement.textContent = "Checking existing forum data...";
    const [legacyThemes, legacyRooms, legacyMessages] = await Promise.all([
      window.db.collection("themes").get(),
      window.db.collection("rooms").get(),
      window.db.collection("forum_messages").get()
    ]);

    const legacyThemeIds = new Set(legacyThemes.docs.map((document) => document.id));
    const legacyRoomById = new Map(
      legacyRooms.docs.map((document) => [document.id, document.data()])
    );

    // The old top-level themes become rooms; their old child rooms become themes.
    const rooms = forumMigrationRows(legacyThemes, (id, data) => ({
      topic: requireLegacyString(data.topic, "topic", id),
      description: requireLegacyString(data.description, "description", id),
      createdByUid: requireLegacyString(data.createdByUid, "createdByUid", id),
      created_at: requireLegacyString(data.created_at, "created_at", id)
    }));
    const themes = forumMigrationRows(legacyRooms, (id, data) => {
      const oldParentId = requireLegacyString(data.theme_id, "theme_id", id);
      if (!legacyThemeIds.has(oldParentId)) {
        throw new Error(`Legacy room ${id} references a missing theme.`);
      }
      return {
        room_id: oldParentId,
        topic: requireLegacyString(data.topic, "topic", id),
        description: typeof data.description === "string" ? data.description : "",
        created_at: requireLegacyString(data.created_at, "created_at", id)
      };
    });
    const posts = forumMigrationRows(legacyMessages, (id, data) => {
      const oldRoomId = requireLegacyString(data.room_id, "room_id", id);
      const oldThemeId = requireLegacyString(data.theme_id, "theme_id", id);
      const oldRoom = legacyRoomById.get(oldRoomId);
      if (!oldRoom || oldRoom.theme_id !== oldThemeId) {
        throw new Error(`Legacy message ${id} has an invalid room/theme relationship.`);
      }
      return {
        room_id: oldThemeId,
        theme_id: oldRoomId,
        author_id: requireLegacyString(data.author_id, "author_id", id),
        author_uid: requireLegacyString(data.author_uid, "author_uid", id),
        created_at: requireLegacyString(data.created_at, "created_at", id),
        text: requireLegacyString(data.text, "text", id)
      };
    });

    await Promise.all([
      findMissingMigrationRows("forum_rooms", rooms),
      findMissingMigrationRows("forum_themes", themes),
      findMissingMigrationRows("forum_posts", posts)
    ]);

    await migrationRef.set({
      status: "in_progress",
      started_at: new Date().toISOString()
    }, { merge: true });

    statusElement.textContent = "Copying rooms...";
    await copyForumMigrationRows("forum_rooms", rooms);
    statusElement.textContent = "Copying themes...";
    await copyForumMigrationRows("forum_themes", themes);
    statusElement.textContent = "Copying forum messages...";
    await copyForumMigrationRows("forum_posts", posts);

    await migrationRef.set({
      status: "complete",
      room_count: rooms.length,
      theme_count: themes.length,
      post_count: posts.length,
      completed_at: new Date().toISOString()
    }, { merge: true });

    statusElement.textContent =
      `Migration complete: ${rooms.length} rooms, ${themes.length} themes, ${posts.length} messages copied.`;
    await renderRooms();
  } catch (error) {
    console.error("Could not migrate forum data:", error);
    statusElement.textContent =
      "Migration did not complete. The original data remains unchanged; fix the issue and resume the migration.";
    alert("The forum migration did not complete. Check the browser console and Firestore rules, then resume.");
  }
}
