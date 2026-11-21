let unsubscribeChatMessages = null;

async function sendMessage() {
  const contentInput = document.getElementById("chat_text");
  const content = contentInput.value.trim();
  if (!content || !window.currentUid || !window.db) return;

  try {
    await window.db.collection("messages").add({
      author: window.currentUser,
      authorUid: window.currentUid,
      content,
      created_at: new Date().toISOString()
    });
    contentInput.value = "";
  } catch (error) {
    console.error("Could not send chat message:", error);
    alert("Your message could not be sent.");
  }
}

function renderChatMessages(snapshot) {
  const chatBox = document.getElementById("chat-box");
  chatBox.replaceChildren();

  if (window.admin) {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete All Messages";
    deleteButton.addEventListener("click", async () => {
      if (!doubleConfirm(
        "Are you sure you want to delete all messages?",
        "This action cannot be undone."
      )) {
        return;
      }

      try {
        await deleteFirestoreQuery(window.db.collection("messages"));
      } catch (error) {
        console.error("Could not delete chat messages:", error);
        alert("The chat messages could not be deleted.");
      }
    });
    chatBox.appendChild(deleteButton);
  }

  if (snapshot.empty) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No chat messages yet. Send the first one below.";
    chatBox.appendChild(emptyMessage);
  }

  snapshot.docs.forEach((messageDoc) => {
    const message = messageDoc.data();
    const date = new Date(message.created_at);
    const row = document.createElement("div");
    const timestamp = document.createElement("small");
    timestamp.textContent = Number.isNaN(date.getTime())
      ? ""
      : `${date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York"
      })}, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/New_York"
      })}`;
    const messageContent = document.createElement("span");
    messageContent.className = "chat-message-content";
    messageContent.appendChild(timestamp);
    messageContent.appendChild(document.createTextNode(": "));

    const author = document.createElement("strong");
    author.textContent = message.author || "Member";
    messageContent.appendChild(author);
    messageContent.appendChild(document.createTextNode(`  ${message.content || ""}`));
    row.appendChild(messageContent);

    if (window.admin) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.title = "Delete chat message";
      deleteButton.setAttribute("aria-label", "Delete chat message");
      deleteButton.textContent = "🗑️";
      deleteButton.addEventListener("click", async () => {
        if (!confirm("Delete this chat message?")) return;
        try {
          await deleteChatMessage(messageDoc.id);
        } catch (error) {
          console.error("Could not delete chat message:", error);
          alert("The message could not be deleted.");
        }
      });
      row.appendChild(deleteButton);
    }
    chatBox.appendChild(row);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
}

function loadChatMessages() {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return;

  if (unsubscribeChatMessages) {
    unsubscribeChatMessages();
    unsubscribeChatMessages = null;
  }

  chatBox.replaceChildren();
  if (!window.currentUid) {
    chatBox.textContent = "Please log in to see the chat messages.";
    return;
  }
  if (!window.db) {
    chatBox.textContent = "Firebase is not configured.";
    return;
  }

  chatBox.textContent = "Loading chat messages...";
  unsubscribeChatMessages = window.db.collection("messages")
    .orderBy("created_at", "desc")
    .limit(100)
    .onSnapshot(renderChatMessages, (error) => {
      console.error("Could not load chat messages:", error);
      chatBox.textContent = "Could not load chat messages. Check Firebase security rules.";
    });
}

async function deleteChatMessage(messageId) {
  if (!window.admin) return;
  await window.db.collection("messages").doc(messageId).delete();
}

document.addEventListener("DOMContentLoaded", () => {
  loadChatMessages();

  const contentInput = document.getElementById("chat_text");
  contentInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  document.getElementById("chat-send-btn").addEventListener("click", sendMessage);
});
