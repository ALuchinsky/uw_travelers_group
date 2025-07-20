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
  if (window.currentUser == "Guest") {
    chatBox.innerHTML = "<p>Please log in to see the chat messages.</p>";
    return;
  } else {
    const html = data.map(msg => {
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

      return(`<div><small>${localDate}, ${localTime}</small>: <strong>${msg.author}</strong><br>&nbsp;&nbsp;&nbsp; ${msg.content}</div>`)
    }
    ).join("");
    chatBox.innerHTML = html
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

