function doubleConfirm(message1, message2) {
  return confirm(message1) && confirm(message2);
}

function forumDate(value) {
  if (!value) return "No posts yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No posts yet";

  return `${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York"
  })}, ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York"
  })}`;
}

function firestoreRows(snapshot, idField) {
  return snapshot.docs.map((document) => ({
    ...document.data(),
    [idField]: document.id
  }));
}

function addDeleteIconButton(title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "delete-button";
  button.title = title;
  button.setAttribute("aria-label", title);
  button.textContent = "🗑️";
  button.addEventListener("click", onClick);
  return button;
}

async function renderRooms() {
  const forumBox = document.getElementById("forum_themes");
  if (!forumBox) return;

  if (!window.currentUid) {
    forumBox.textContent = "Please log in to see the forum rooms.";
    return;
  }
  if (!window.db) {
    forumBox.textContent = "Firebase is not configured.";
    return;
  }

  forumBox.textContent = "Checking forum setup...";
  try {
    const migration = await window.db.collection("forum_migrations")
      .doc(FORUM_MIGRATION_ID)
      .get();
    if (!migration.exists || migration.data().status !== "complete") {
      forumBox.replaceChildren();
      const title = document.createElement("div");
      title.textContent = "Forum rooms";
      const status = document.createElement("p");
      status.setAttribute("role", "status");
      status.textContent = window.admin
        ? "The forum needs a one-time migration to place themes inside rooms."
        : "The forum is waiting for an administrator to finish its one-time setup.";
      forumBox.append(title, status);

      if (window.admin) {
        const migrateButton = document.createElement("button");
        migrateButton.className = "create-button";
        migrateButton.textContent = migration.exists
          ? "Resume forum migration"
          : "Migrate existing forum data";
        migrateButton.addEventListener("click", async () => {
          migrateButton.disabled = true;
          await runForumMigration(status);
          if (migrateButton.isConnected) migrateButton.disabled = false;
        });
        forumBox.appendChild(migrateButton);
      }
      return;
    }

    const [roomSnapshot, themeSnapshot, postSnapshot] = await Promise.all([
      window.db.collection("forum_rooms").get(),
      window.db.collection("forum_themes").get(),
      window.db.collection("forum_posts").get()
    ]);
    const rooms = firestoreRows(roomSnapshot, "room_id");
    const themes = firestoreRows(themeSnapshot, "theme_id");
    const posts = firestoreRows(postSnapshot, "post_id");

    forumBox.replaceChildren();
    const title = document.createElement("div");
    title.textContent = "Forum rooms";
    const createButton = document.createElement("button");
    createButton.className = "create-button";
    createButton.textContent = "Create new room";
    createButton.addEventListener("click", createNewRoom);
    forumBox.append(title, createButton);

    const table = document.createElement("table");
    table.className = "bordered-table";
    const header = table.insertRow();
    ["Room", "# THEMES", "# MSG", "Last post"].forEach((label) => {
      const cell = document.createElement("th");
      cell.textContent = label;
      header.appendChild(cell);
    });
    if (window.admin) {
      const cell = document.createElement("th");
      cell.textContent = "Delete";
      header.appendChild(cell);
    }

    rooms.sort((left, right) => (left.topic || "").localeCompare(right.topic || ""));
    rooms.forEach((room) => {
      const roomThemes = themes.filter((theme) => theme.room_id === room.room_id);
      const roomPosts = posts.filter((post) => post.room_id === room.room_id);
      const latestPost = roomPosts.reduce((latest, post) => {
        return !latest || new Date(post.created_at) > new Date(latest.created_at)
          ? post
          : latest;
      }, null);
      const latestTheme = latestPost
        ? roomThemes.find((theme) => theme.theme_id === latestPost.theme_id)
        : null;

      const row = table.insertRow();
      const roomCell = row.insertCell();
      roomCell.className = "rooms-list-topic";
      const roomName = document.createElement("span");
      roomName.textContent = room.topic || "";
      roomCell.appendChild(roomName);
      if (room.description) {
        const description = document.createElement("div");
        description.className = "theme-descr";
        description.textContent = room.description;
        roomCell.appendChild(description);
      }
      roomCell.addEventListener("click", () => renderThemes(room.room_id, room.topic));

      const themeCount = row.insertCell();
      themeCount.className = "rooms-list-num-rooms";
      themeCount.textContent = String(roomThemes.length);
      const messageCount = row.insertCell();
      messageCount.className = "rooms-list-num-messages";
      messageCount.textContent = String(roomPosts.length);
      const lastPost = row.insertCell();
      lastPost.className = "rooms-list-last-post";
      lastPost.textContent = latestPost
        ? `${forumDate(latestPost.created_at)}\n${latestPost.author_id || "Member"}\n${latestTheme ? `theme "${latestTheme.topic}"` : ""}`
        : "No posts yet";

      if (window.admin) {
        const actions = row.insertCell();
        actions.className = "theme-list-delete";
        actions.appendChild(addDeleteIconButton("Delete room", async (event) => {
          event.stopPropagation();
          if (doubleConfirm(
            `Delete room "${room.topic}" and all its themes and messages?`,
            "This action cannot be undone."
          )) {
            await deleteRoom(room.room_id);
          }
        }));
      }
    });

    if (rooms.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No rooms yet.";
      forumBox.appendChild(empty);
    }
    if (rooms.length > 0) forumBox.appendChild(table);
  } catch (error) {
    console.error("Error loading forum rooms:", error);
    forumBox.textContent = "Could not load forum rooms. Check that the updated Firestore rules are published.";
  }
}

async function renderThemes(roomId, roomTopic) {
  const forumBox = document.getElementById("forum_themes");
  if (!forumBox || !window.currentUid) return;
  if (!window.db) {
    forumBox.textContent = "Firebase is not configured.";
    return;
  }

  forumBox.textContent = "Loading themes...";
  try {
    const [themeSnapshot, postSnapshot] = await Promise.all([
      window.db.collection("forum_themes").where("room_id", "==", roomId).get(),
      window.db.collection("forum_posts").where("room_id", "==", roomId).get()
    ]);
    const themes = firestoreRows(themeSnapshot, "theme_id");
    const posts = firestoreRows(postSnapshot, "post_id");

    forumBox.replaceChildren();
    const title = document.createElement("div");
    title.textContent = `Themes in room "${roomTopic}"`;
    forumBox.appendChild(title);

    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "Back to rooms";
    backButton.addEventListener("click", renderRooms);
    forumBox.append(backButton, document.createElement("br"));

    const createButton = document.createElement("button");
    createButton.className = "create-button";
    createButton.textContent = "Create new theme";
    createButton.addEventListener("click", () => createNewTheme(roomId, roomTopic));
    forumBox.appendChild(createButton);

    const table = document.createElement("table");
    table.className = "bordered-table";
    const header = table.insertRow();
    ["Theme", "# MSG", "Last post"].forEach((label) => {
      const cell = document.createElement("th");
      cell.textContent = label;
      header.appendChild(cell);
    });
    if (window.admin) {
      const cell = table.rows[0].insertCell();
      cell.textContent = "Actions";
    }

    themes.sort((left, right) => (left.topic || "").localeCompare(right.topic || ""));
    themes.forEach((theme) => {
      const themePosts = posts.filter((post) => post.theme_id === theme.theme_id);
      const latestPost = themePosts.reduce((latest, post) => {
        return !latest || new Date(post.created_at) > new Date(latest.created_at)
          ? post
          : latest;
      }, null);
      const row = table.insertRow();
      const topicCell = row.insertCell();
      const topic = document.createElement("div");
      topic.className = "theme-list-topic";
      const themeName = document.createElement("span");
      themeName.className = "theme-title";
      themeName.textContent = theme.topic || "";
      topic.appendChild(themeName);
      if (theme.description) {
        const description = document.createElement("div");
        description.className = "theme-descr";
        description.textContent = theme.description;
        topic.appendChild(description);
      }
      topicCell.appendChild(topic);
      topicCell.addEventListener("click", () =>
        renderMessages(roomId, roomTopic, theme.theme_id, theme.topic)
      );

      const messageCount = row.insertCell();
      messageCount.className = "theme-list-num-messages";
      messageCount.textContent = String(themePosts.length);
      const lastPost = row.insertCell();
      lastPost.className = "theme-list-last-post";
      lastPost.textContent = latestPost
        ? `${forumDate(latestPost.created_at)}\n${latestPost.author_id || "Member"}`
        : "No posts yet";

      if (window.admin) {
        const actions = row.insertCell();
        actions.className = "rooms-list-delete";

        const moveButton = document.createElement("button");
        moveButton.className = "move-button";
        moveButton.title = "Move theme";
        moveButton.setAttribute("aria-label", "Move theme");
        moveButton.textContent = "➡️";
        moveButton.addEventListener("click", (event) => {
          event.stopPropagation();
          moveThemePrompt(theme, roomId);
        });
        actions.appendChild(moveButton);
        actions.appendChild(addDeleteIconButton("Delete theme", async (event) => {
          event.stopPropagation();
          if (doubleConfirm(
            `Delete theme "${theme.topic}" and all its messages?`,
            "This action cannot be undone."
          )) {
            await deleteTheme(theme.theme_id, roomId, roomTopic);
          }
        }));
      }
    });

    if (themes.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No themes in this room yet.";
      forumBox.appendChild(empty);
    } else {
      forumBox.appendChild(table);
    }
  } catch (error) {
    console.error("Error loading themes:", error);
    forumBox.textContent = "Could not load themes. Check Firestore rules.";
  }
}

async function renderMessages(roomId, roomTopic, themeId, themeTopic) {
  const forumBox = document.getElementById("forum_themes");
  if (!forumBox || !window.currentUid) return;
  if (!window.db) {
    forumBox.textContent = "Firebase is not configured.";
    return;
  }

  forumBox.textContent = "Loading messages...";
  try {
    const snapshot = await window.db.collection("forum_posts")
      .where("theme_id", "==", themeId)
      .get();
    const posts = firestoreRows(snapshot, "post_id")
      .sort((left, right) => new Date(left.created_at) - new Date(right.created_at));

    forumBox.replaceChildren();
    const title = document.createElement("div");
    title.textContent = `Messages for theme "${themeTopic}" in room "${roomTopic}"`;
    forumBox.appendChild(title);

    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "Back to themes";
    backButton.addEventListener("click", () => renderThemes(roomId, roomTopic));
    forumBox.append(backButton, document.createElement("br"));

    const table = document.createElement("table");
    table.className = "bordered-table";
    const header = table.insertRow();
    ["Author", "Message"].forEach((label) => {
      const cell = document.createElement("th");
      cell.textContent = label;
      header.appendChild(cell);
    });
    if (window.admin) {
      const cell = table.rows[0].insertCell();
      cell.textContent = "Delete";
    }

    posts.forEach((post) => {
      const row = table.insertRow();
      const author = row.insertCell();
      author.className = "messages-list-info";
      const date = new Date(post.created_at);
      author.textContent = `${post.author_id || "Member"}\n${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York"
      })}\n${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/New_York"
      })}`;

      const text = row.insertCell();
      text.className = "messages-list-text";
      text.textContent = post.text || "";

      if (window.admin) {
        const actions = row.insertCell();
        actions.className = "messages-list-delete";
        actions.appendChild(addDeleteIconButton("Delete message", async () => {
          if (await deleteForumPost(post.post_id)) {
            await renderMessages(roomId, roomTopic, themeId, themeTopic);
          }
        }));
      }
    });

    if (posts.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No messages yet.";
      forumBox.appendChild(empty);
    }
    forumBox.appendChild(table);

    const messageArea = document.createElement("textarea");
    messageArea.style.width = "100%";
    messageArea.style.height = "100px";
    messageArea.placeholder = "Type your message here...";
    messageArea.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const sent = await sendForumMessage(roomId, themeId, messageArea.value);
        if (sent) {
          messageArea.value = "";
          await renderMessages(roomId, roomTopic, themeId, themeTopic);
        }
      }
    });
    forumBox.append(document.createElement("br"), document.createElement("hr"), messageArea);
  } catch (error) {
    console.error("Error loading forum messages:", error);
    forumBox.textContent = "Could not load messages. Check Firestore rules.";
  }
}

document.addEventListener("DOMContentLoaded", renderRooms);
