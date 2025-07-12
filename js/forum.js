
/************
 * Renders all themes on this forum
 */
async function renderThemes() {
    console.log("Loading themes")
  const { data, error } = await client
    .from("themes")
    .select("*")
    .order("theme_id")

  if (error) {
    console.error("Failed to load messages:", error);
    return;
  } else {
    console.log("Themes loaded:", data)
  }

  const themeBox = document.getElementById("forum_themes");
  themeBox.textContent = ""
  themeBox.innerHTML = "<div>Forum themes</div>"
  const themes_table = document.createElement("table")
  themes_table.classList.add("bordered-table")
  const header = document.createElement("tr")
  header.innerHTML = `
    <th> Topic </th>
    <th "theme-list-num-rooms"> # RMS</th>
    <th class="theme-list-num-messages"> # MSG</th>
  `
  themes_table.appendChild(header)

  data.map( (item) => {
    const row = document.createElement("tr")
    row.innerHTML = `
    <td>
        <span class="theme-title">${item.topic}</span>
        <br>&nbsp;&nbsp;&nbsp;
        <span class="theme-descr">${item.description}</span>
    </td>
    <td class = "theme-list-num-rooms"> ${item.num_rooms}</td>
    <td class="theme-list-num-messages"> ${item.num_messages}</td>
    `
    row.addEventListener("click", () => {
        console.log("You have clicked item ", item.theme_id)
        renderRooms(item.theme_id, item.topic)
    });
    themes_table.appendChild(row);
  })
  themeBox.appendChild(themes_table);
  themeBox.scrollTop = themeBox.scrollHeight;
}
/****** End of  renderThemes */


/****************
 * Render rooms list of the particular theme
 */
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

    const rooms_table = document.createElement("table")
    rooms_table.classList.add("bordered-table")
    const header = document.createElement("tr")
    header.innerHTML = `
        <th class="rooms-list-topic"> Topic </th>
        <th class="rooms-list-num-rooms"> # MSG</th>
    `
    rooms_table.appendChild(header)
    data.map( (item) => {
        const row = document.createElement("tr")
        row.innerHTML = `
        <td class="rooms-list-topic">${item.topic}</td>
        <td class="rooms-list-num-rooms"> ${item.num_messages} </td>
        `
        row.addEventListener("click", () => {
            console.log("You have clicked room  ", item.room_id)
            renderMessages(item.room_id, item.topic, theme_id, theme_topic)
        });
        rooms_table.appendChild(row)
    })
    themeBox.appendChild(rooms_table)
}

/************************
 * Renders messages from particular room off particular topic
 */
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
    const messages_table = document.createElement("table")
    messages_table.classList.add("bordered-table")
    const header = document.createElement("tr")
    header.innerHTML = `
        <th style="width: 100px; font-size: small;"> Author</th>
        <th class="messages-list-text">Message</th>
    `
    messages_table.appendChild(header)
    // Loop through all messages and add them to table
    data.map( (item) => {
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

        const row = document.createElement("tr")
        row.innerHTML = `
            <td class="messages-list-info">
                <span class="messages-list-info-author">${item.author_id}</span>
                <br>
                <span class="message-list-info-date">${localDate}</span
                <br>
                <span class="messages-list-info-time">${localTime}</span>
            </td>
            <td class="messages-list-text">${item.text}</td>
        `;
        row.addEventListener("click", () => {
            console.log("You have clicked message  ", item.message_id)
        });
        messages_table.appendChild(row)
    })
    themeBox.appendChild(messages_table)

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
/****************** End of  renderMessages*/

async function sendForumMessage(room_id, room_topic, theme_id, theme_topic, text) {
    console.log(`Sending message "${text} to room ${room_id} from theme ${theme_id} for user ${window.currentUser}`)
  const to_insert = {
    room_id: room_id,
    author_id: window.currentUser,
    created_at: new Date().toISOString(),
    text: text
  };

    const { data: insertData, error: insertError } = await client
        .from('forum_messages')
        .insert([to_insert])
        .order("created_at", { ascending: true });


    // update num_messages for "rooms" table
    const { data: countData, error: countError } = await client
        .from("rooms")
        .select("*")
        .eq("room_id", room_id)
        .single();
    if (countError) {
        console.log("Error loading room info line:", countError)
    } else {
        const currentCount = countData.num_messages;
        console.log("currentCount = ", currentCount)
        const {error: updateError} = await client
            .from("rooms")
            .update({num_messages: currentCount + 1})
            .eq("room_id", room_id);
        if(updateError) {
            console.log("Update error: ", updateError)
        } else {
            console.log("num_messages incremented from room_id", room_id)
        }
    }

    // update num_messages for "themes" table
    const { data: countData_themes, error: countError_themes } = await client
        .from("themes")
        .select("*")
        .eq("theme_id", theme_id)
        .single();
    if (countError_themes) {
        console.log("Error loading themes info line:", countError_themes)
    } else {
        const currentCount = countData_themes.num_messages;
        console.log("currentCount = ", currentCount)
        const {error: updateError} = await client
            .from("themes")
            .update({num_messages: currentCount + 1})
            .eq("theme_id", theme_id);
        if(updateError) {
            console.log("Update error: ", updateError)
        } else {
            console.log("num_messages incremented from theme_id", theme_id)
        }
    }

    console.log("countData = ", countData)
    renderMessages(room_id, room_topic, theme_id, theme_topic) 
  
}



document.addEventListener("DOMContentLoaded", renderThemes);
