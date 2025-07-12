
async function renderThemes() {
    console.log("Loading themes")
  const { data, error } = await client
    .from("themes")
    .select("*")

  if (error) {
    console.error("Failed to load messages:", error);
    return;
  }

  const themeBox = document.getElementById("forum_themes");
  themeBox.textContent = ""
  themeBox.innerHTML = "<div>Forum themes</div>"
  data.map( (item) => {
    const div = document.createElement("div");
    div.innerHTML = "<hr>"
    div.innerHTML +=  `<span class="theme-title">${item.topic}</span>`;
    div.innerHTML += "<br>&nbsp;&nbsp;&nbsp; "
    div.innerHTML += `<span class="theme-descr">${item.description}</span>`
    div.addEventListener("click", () => {
        console.log("You have clicked item ", item.theme_id)
        renderRooms(item.theme_id, item.topic)
    });
    themeBox.appendChild(div);
  })
  themeBox.scrollTop = themeBox.scrollHeight;
}

async function renderRooms(theme_id, theme_topic) {
    console.log("renderRooms: ", theme_id);
    const themeBox = document.getElementById("forum_themes");
    themeBox.innerHTML = `<div>Rooms for theme "${theme_topic}"</div>`


    const back_button = document.createElement("button")
    back_button.textContent = "Back"
    back_button.addEventListener("click", renderThemes)
    themeBox.appendChild(back_button)

    const { data, error } = await client
        .from("rooms")
        .select("*")
        .eq("theme_id", theme_id)
    if(error) {
        console.log("Rooms for theme ", theme_id, " loaded with error", error)
    }
    console.log("rooms = ", data)
    data.map( (item) => {
        const div = document.createElement("div")
        div.innerHTML = "<hr>"
        div.innerHTML +=  `<span class="theme-title">${item.topic}</span>`;
        div.addEventListener("click", () => {
            console.log("You have clicked room  ", item.room_id)
            renderMessages(item.room_id, item.topic, theme_id, theme_topic)
        });
        themeBox.appendChild(div)
    })
}

async function renderMessages(room_id, room_topic, theme_id, theme_topic) {
    console.log("renderMessages: ", room_id);
    const themeBox = document.getElementById("forum_themes");
    themeBox.innerHTML = `<div>Messages for room "${room_topic}"</div>`


    const back_button = document.createElement("button")
    back_button.textContent = "Back to rooms"
    back_button.addEventListener("click", () => {
        console.log("!!!")
        renderRooms(theme_id, theme_topic)
    })
    themeBox.appendChild(back_button)


    const { data, error } = await client
        .from("forum_messages")
        .select("*")
        .eq("room_id", room_id)
        .order("created_at", { ascending: true });
    if(error) {
        console.log("Messages for room ", room_id, " loaded with error", error)
    }
    console.log("messages = ", data)
    data.map( (item) => {
        const div = document.createElement("div")
        const isoString = item.created_at;
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

        // Generate strings
        const localDate = date.toLocaleDateString("en-US", dateOptions); // e.g. "July 12, 2025"
        const localTime = date.toLocaleTimeString("en-US", timeOptions); // e.g. "11:30 AM"

        div.innerHTML = `
        <hr>
        <table>
            <tr>
            <td style="width: 100px; font-size: small;">
                <span style="color: green;">${item.author_id}</span>
                <br>
                ${localDate}
                <br>
                ${localTime}
            </td>
            <td>${item.text}</td>
            </tr>
        </table>
        `;
        div.addEventListener("click", () => {
            console.log("You have clicked message  ", item.message_id)
        });
        themeBox.appendChild(div)
    })

    // themeBox.innerHTML += "<br><hr>"
    themeBox.appendChild(document.createElement("br"))
    themeBox.appendChild(document.createElement("hr"))
    themeBox.appendChild(document.createElement("hr"))
    const messageAreaBox = document.createElement("textarea")
    messageAreaBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // prevent new line
        sendForumMessage(room_id, room_topic, theme_id, theme_topic, messageAreaBox.value)
    }
    });
    themeBox.appendChild(messageAreaBox)

}

async function sendForumMessage(room_id, room_topic, theme_id, theme_topic, text) {
    console.log(`Sending message "${text} to room ${room_id} from theme ${theme_id} for user ${window.currentUser}`)
  const to_insert = {
    room_id: room_id,
    author_id: window.currentUser,
    created_at: new Date().toISOString(),
    text: text
  };

  const { data, error } = await client
    .from('forum_messages')
    .insert([to_insert])
    .order("created_at", { ascending: true });

  if (error) console.error(error);
  else console.log('✅ Inserted:', data);    renderMessages(room_id, room_topic, theme_id, theme_topic)
}



document.addEventListener("DOMContentLoaded", renderThemes);
