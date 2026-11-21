async function createNewRoom() {
  const topic = prompt("Enter room name")?.trim();
  if (!topic || !window.currentUid) return;
  const description = prompt("Enter room description (optional)")?.trim() || "";

  try {
    await window.db.collection("forum_rooms").add({
      topic,
      description,
      createdByUid: window.currentUid,
      created_at: new Date().toISOString()
    });
    await renderRooms();
  } catch (error) {
    console.error("Error creating room:", error);
    alert("The room could not be created.");
  }
}

async function deleteRoom(roomId) {
  if (!window.admin) return;

  try {
    await deleteFirestoreQuery(
      window.db.collection("forum_posts").where("room_id", "==", roomId)
    );
    await deleteFirestoreQuery(
      window.db.collection("forum_themes").where("room_id", "==", roomId)
    );
    await window.db.collection("forum_rooms").doc(roomId).delete();
    await renderRooms();
  } catch (error) {
    console.error("Error deleting room:", error);
    alert("The room and its themes could not be deleted.");
  }
}

async function createNewTheme(roomId, roomTopic) {
  const topic = prompt("Enter theme title")?.trim();
  if (!topic || !window.currentUid) return;
  const description = prompt("Enter theme description (optional)")?.trim() || "";

  try {
    await window.db.collection("forum_themes").add({
      room_id: roomId,
      topic,
      description,
      created_at: new Date().toISOString()
    });
    await renderThemes(roomId, roomTopic);
  } catch (error) {
    console.error("Error creating theme:", error);
    alert("The theme could not be created.");
  }
}

async function deleteTheme(themeId, roomId, roomTopic) {
  if (!window.admin) return;

  try {
    await deleteFirestoreQuery(
      window.db.collection("forum_posts").where("theme_id", "==", themeId)
    );
    await window.db.collection("forum_themes").doc(themeId).delete();
    await renderThemes(roomId, roomTopic);
  } catch (error) {
    console.error("Error deleting theme:", error);
    alert("The theme and its messages could not be deleted.");
  }
}

async function moveThemePrompt(theme, oldRoomId) {
  try {
    const snapshot = await window.db.collection("forum_rooms").get();
    const rooms = firestoreRows(snapshot, "room_id")
      .filter((room) => room.room_id !== oldRoomId);
    if (rooms.length === 0) {
      alert("There is no other room to move this theme to.");
      return;
    }

    const choices = rooms.map((room, index) => `${index + 1}. ${room.topic}`).join("\n");
    const selected = Number(prompt(`Choose a destination room:\n${choices}`)) - 1;
    if (!Number.isInteger(selected) || selected < 0 || selected >= rooms.length) return;

    const destination = rooms[selected];
    if (doubleConfirm(
      `Move "${theme.topic}" to "${destination.topic}"?`,
      "Confirm this theme move."
    )) {
      await moveThemeToRoom(
        theme.theme_id,
        oldRoomId,
        destination.room_id,
        destination.topic
      );
    }
  } catch (error) {
    console.error("Error loading rooms for theme move:", error);
    alert("The destination rooms could not be loaded.");
  }
}

async function moveThemeToRoom(themeId, oldRoomId, newRoomId, newRoomTopic) {
  if (!window.admin) return;

  try {
    const posts = await window.db.collection("forum_posts")
      .where("theme_id", "==", themeId)
      .get();
    const themeRef = window.db.collection("forum_themes").doc(themeId);
    const batchSize = 450;
    const firstBatch = window.db.batch();
    firstBatch.update(themeRef, { room_id: newRoomId });
    posts.docs.slice(0, batchSize).forEach((post) => {
      firstBatch.update(post.ref, { room_id: newRoomId });
    });
    await firstBatch.commit();

    for (let start = batchSize; start < posts.docs.length; start += batchSize) {
      const batch = window.db.batch();
      posts.docs.slice(start, start + batchSize).forEach((post) => {
        batch.update(post.ref, { room_id: newRoomId });
      });
      await batch.commit();
    }

    await renderThemes(newRoomId, newRoomTopic);
  } catch (error) {
    console.error(`Error moving theme from room ${oldRoomId}:`, error);
    alert("The theme could not be moved.");
  }
}

async function sendForumMessage(roomId, themeId, text) {
  const message = text.trim();
  if (!message || !window.currentUid) return false;

  try {
    await window.db.collection("forum_posts").add({
      room_id: roomId,
      theme_id: themeId,
      author_id: window.currentUser,
      author_uid: window.currentUid,
      created_at: new Date().toISOString(),
      text: message
    });
    return true;
  } catch (error) {
    console.error("Error sending forum message:", error);
    alert("Your message could not be sent.");
    return false;
  }
}

async function deleteForumPost(postId) {
  if (!window.admin || !doubleConfirm(
    "Are you sure you want to delete this forum message?",
    "This action cannot be undone."
  )) {
    return false;
  }

  try {
    await window.db.collection("forum_posts").doc(postId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting forum message:", error);
    alert("The message could not be deleted.");
    return false;
  }
}
