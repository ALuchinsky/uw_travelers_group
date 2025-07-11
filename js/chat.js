async function sendMessage() {
  const author = window.currentUser;
  const content = document.getElementById("chat_text").value.trim();

  if (!author || !content) return;

  to_insert =     {
      author: author,
      content: content,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
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
    .order("time", { ascending: false });

  if (error) {
    console.error("Failed to load messages:", error);
    return;
  }

  const chatBox = document.getElementById("chat-box");
  const html = data.map(msg => {
    // console.log(msg)
    return(`<div><strong>${msg.author}</strong>:<small>${msg.time}</small><br>&nbsp;&nbsp;&nbsp; ${msg.content}</div>`)
  }
  ).join("");
  chatBox.innerHTML = html


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

