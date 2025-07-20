/************
 * Renders all themes on this forum
 */

// Helper function for double confirmation
function doubleConfirm(message1, message2) {
    if (confirm(message1)) {
        return confirm(message2);
    }
    return false;
}


async function renderThemes() {
    console.log("Loading themes")
    const {data: themesData, error:themesEror} = await client.rpc("get_themes");
    if (themesEror) {
        console.error("Error loading themes:", themesEror);
        return;
    }
    console.log("themesData = ", themesData)

    const themeBox = document.getElementById("forum_themes");
    themeBox.textContent = ""
    themeBox.innerHTML = "<div>Forum themes</div>"
  
    const create_theme_button = document.createElement("button")
    create_theme_button.classList.add("create-button")
    create_theme_button.textContent = "Create new theme"
    create_theme_button.addEventListener("click", () => {createNewTheme()})
    themeBox.appendChild(create_theme_button)
  
  
    const themes_table = document.createElement("table")
    themes_table.classList.add("bordered-table")
    const header = document.createElement("tr")
    header.innerHTML = `
        <th> Topic </th>
        <th "theme-list-num-rooms"> # RMS</th>
        <th class="theme-list-num-messages"> # MSG</th>
    `
    themes_table.appendChild(header)

    themesData.map( (item) => {
        const row = document.createElement("tr")
        row.innerHTML = `
        <td>
            <span class="theme-title">${item.topic}</span>
            <br>&nbsp;&nbsp;&nbsp;
            <span class="theme-descr">${item.description}</span>
        </td>
        <td class = "theme-list-num-rooms"> ${item.num_rooms}</td>
        <td class="theme-list-num-messages"> ${ item.num_messages ? item.num_messages : 0}</td>
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
    back_button.textContent = "Back to themes"
    back_button.classList.add("back-button")
    back_button.addEventListener("click", renderThemes)
    themeBox.appendChild(back_button)
    themeBox.appendChild(document.createElement("br"))

    const create_room_button = document.createElement("button")
    create_room_button.classList.add("create-button")
    create_room_button.textContent = "Create new room"
    create_room_button.addEventListener("click", async () => {createNewRoom(theme_id, theme_topic)})
    themeBox.appendChild(create_room_button)

    if(window.admin) {
        const delete_theme_button = document.createElement("button")
        delete_theme_button.classList.add("delete-button")
        delete_theme_button.textContent = "Delete theme"
        delete_theme_button.addEventListener("click", () => {
            if (doubleConfirm(
                "Are you sure you want to delete this theme? All rooms and messages will be deleted.",
                "Please, rethink, this action cannot be undone.")) {
                deleteTheme(theme_id)
                renderThemes()
            }
        })
        themeBox.appendChild(delete_theme_button)
    }

    // access rooms for this theme using RPC
    console.log("rpc: Loading rooms for theme ", theme_id)
    const { data: roomsData, error: roomsError } = await client.rpc("get_rooms_for_theme", { t_id: theme_id });
    console.log("roomsData = ", roomsData)
    if (roomsError) {
        console.error("Error loading rooms for theme:", roomsError);
        return;
    }


    const rooms_table = document.createElement("table")
    rooms_table.classList.add("bordered-table")
    const header = document.createElement("tr")
    header.innerHTML = `
        <th class="rooms-list-topic"> Topic </th>
        <th class="rooms-list-num-rooms"> # MSG</th>
    `
    rooms_table.appendChild(header)
    roomsData.map( (item) => {
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
/**************** End of renderRooms */




/************************
 * Renders messages from particular room off particular topic
 */
async function renderMessages(room_id, room_topic, theme_id, theme_topic) {
    console.log("renderMessages: ", room_id);
    const themeBox = document.getElementById("forum_themes");
    themeBox.innerHTML = `<div>Messages for room "${room_topic}"</div>`


    const back_button = document.createElement("button")
    back_button.textContent = "Back to rooms"
    back_button.classList.add("back-button")
    back_button.addEventListener("click", () => {
        console.log("!!!")
        renderRooms(theme_id, theme_topic)
    })
    themeBox.appendChild(back_button)
    themeBox.appendChild(document.createElement("br"))

    if(window.admin) {
        const delete_room_button = document.createElement("button")
        delete_room_button.classList.add("delete-button")
        delete_room_button.textContent = "Delete room"
        delete_room_button.addEventListener("click", () => {
            if (doubleConfirm(
                "Are you sure you want to delete this room? All messages will be deleted.",
                "Please, rethink, this action cannot be undone.")) {
                deleteRoom(room_id, theme_id, theme_topic)
                renderRooms(theme_id, theme_topic)
            }
        })
        themeBox.appendChild(delete_room_button)

        const move_room_button = document.createElement("button")
        move_room_button.classList.add("move-button")
        move_room_button.textContent = "Move room to another theme"
        move_room_button.addEventListener("click", async () => {
            console.log("Move room button clicked")
            const themes = await client
                .from("themes")
                .select("*")
                .order("theme_id");
            if (themes.error) {
                console.error("Error loading themes:", themes.error);
                return;
            }
            console.log("Themes loaded:", themes.data);
            const new_theme_index = prompt("Enter theme number to move room to (1 - " + themes.data.length + "):") - 1;
            if (new_theme_index < 0 || new_theme_index >= themes.data.length) {
                console.error("Invalid theme index:", new_theme_index);
                return;
            }
            console.log("Moving room ", room_id, " to theme ", themes.data[new_theme_index].theme_id, " with topic ", themes.data[new_theme_index].topic);
            if (doubleConfirm(
                `Are you sure you want to move room "${room_topic}" to theme "${themes.data[new_theme_index].topic}"?`,
                "Please, rethink, this action cannot be undone.")) {
                console.log("Moving room ", room_id, " to theme ", themes.data[new_theme_index].theme_id, " with topic ", themes.data[new_theme_index].topic);
            } else {
                console.log("Room move cancelled");
                return;
            }
            // Move the room to the new theme
            moveRoomToTheme(room_id, theme_id, themes.data[new_theme_index].theme_id, themes.data[new_theme_index].topic);
            renderThemes();
        })
        themeBox.appendChild(move_room_button)
    }

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
    if(window.admin) {
        header.innerHTML += `<th style="width: 20px; font-size: small;">Delete</th>`
    }
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
        if(window.admin) {
            row.innerHTML += `<td class="messages-list-delete"><button class="delete-button">Delete</button></td>`;
            row.querySelector(".delete-button").addEventListener("click", async (event) => {
                event.stopPropagation(); // Prevent row click event
                await deleteMessage(item.message_id).
                then(() => {
                    renderMessages(room_id, room_topic, theme_id, theme_topic);
                })
            });
        }
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
    messageAreaBox.style.width = "100%"
    messageAreaBox.style.height = "100px"
    messageAreaBox.placeholder = "Type your message here..."   
    messageAreaBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // prevent new line
        sendForumMessage(room_id, room_topic, theme_id, theme_topic, messageAreaBox.value)
    }
    });
    themeBox.appendChild(messageAreaBox)

}
/****************** End of  renderMessages*/




document.addEventListener("DOMContentLoaded", renderThemes);
