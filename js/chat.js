async function sendMessage() {
  const author = window.currentUser;
  const content = document.getElementById("chat_text").value.trim();

  if (!author || !content) return;

  to_insert =     {
      author: author,
      content: content,
      created_at: new Date().toISOString()
    };
  console.log("inserting ", to_insert)

  await client.from("messages").insert([to_insert]);

  document.getElementById("chat_text").value = "";
  await loadChatMessages(); // refresh after send
}

async function loadChatMessages() {
  // console.log("Loading chat messages")
  const { data, error } = await client
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load messages:", error);
  }

  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = ""; // Clear previous messages
  if (window.currentUser == "Guest") {
    chatBox.innerHTML = "<p>Please log in to see the chat messages.</p>";
    return;
  } else {
    if(window.admin) {
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete All Messages";
      deleteButton.addEventListener("click", async () => {
        if (doubleConfirm("Are you sure you want to delete all messages? This action cannot be undone.", "Please, rethink.")) {
          const { error: deleteAllError } = await client.from("messages").delete().neq("id", -1); // Delete all messages
          if (deleteAllError) {
            console.error("Error deleting all messages:", deleteAllError);
          } else {
            console.log("All messages deleted successfully.");
            loadChatMessages(); // Refresh the chat box
          }
        }
      });
      chatBox.appendChild(deleteButton);
    }
    data.map(msg => {
          const isoString = msg.created_at;
          const date = new Date(isoString);
          const dateOptions = {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "America/New_York"
          };

          // Options for the time part
          const timeOptions = {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "America/New_York"
          };
          const localDate = date.toLocaleDateString("en-US", dateOptions); // e.g. "July 12, 2025"
          const localTime = date.toLocaleTimeString("en-US", timeOptions); // e.g. "11:30 AM"
          const row = document.createElement("tr");

          row.innerHTML = `<div>
            <small>${localDate}, ${localTime}</small>: <strong>${msg.author}</strong>`
          if(window.admin) {
            row.innerHTML += ` <button class="delete-button">Delete</button>`;
          }
          row.innerHTML += `&nbsp;&nbsp;&nbsp; ${msg.content}</div>`;
          if(window.admin) {
            row.querySelector(".delete-button").addEventListener("click", async (event) => {
                  event.stopPropagation(); // Prevent row click event
                  if(doubleConfirm(`Are you sure you want to delete  message? ${msg.id}?`)) {
                    await deleteChatMessage(msg.id).then(() => {
                      console.log("Message deleted successfully");
                      loadChatMessages();
                    });
                  }
                
            });
          }
          chatBox.appendChild(row);
    });
  };


  // auto-scroll to bottom
  chatBox.scrollTop = chatBox.scrollHeight;
}

// auto-refresh every 50 seconds
setInterval(loadChatMessages, 5000);
document.addEventListener("DOMContentLoaded", loadChatMessages);

document.getElementById("chat_text").addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault(); // prevent new line
    sendMessage();          // your function
  }
});

async function deleteChatMessage(messageId) {
  console.log("Deleting message with ID:", messageId);
  const { error } = await client.from("messages").delete().eq("id", messageId);
  if (error) {
    console.error("Failed to delete message:", error);
  }
}
