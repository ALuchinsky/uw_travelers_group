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

/****
 * Moves room from one theme to another
 * Updates num_rooms and num_messages for both themes
 * @param {number} room_id - ID of the room to move
 * @param {number} old_theme_id - ID of the theme from which to move the room
 * @param {number} new_theme_id - ID of the theme to which to move
 * @param {string} new_theme_topic - Topic of the new theme (for display purposes
 */
async function moveRoomToTheme(room_id, old_theme_id, new_theme_id, new_theme_topic) {
    // Update the room's theme_id
    const { error: updateRoomError } = await client
        .from("rooms")
        .update({ theme_id: new_theme_id })
        .eq("room_id", room_id);
    if (updateRoomError) {
        console.error("Error updating room's theme_id:", updateRoomError);
        return;
    }

    // Update num_rooms and num_messages for old theme
    const { data: oldRooms, error: oldRoomsError } = await client
        .from("rooms")
        .select("room_id")
        .eq("theme_id", old_theme_id);
    const num_rooms_old = oldRoomsError ? 0 : oldRooms.length;

    const { data: oldMessages, error: oldMessagesError } = await client
        .from("forum_messages")
        .select("message_id")
        .in("room_id", oldRooms.map(r => r.room_id));
    const num_messages_old = oldMessagesError ? 0 : oldMessages.length;

    await client
        .from("themes")
        .update({ num_rooms: num_rooms_old, num_messages: num_messages_old })
        .eq("theme_id", old_theme_id);

    // Update num_rooms and num_messages for new theme
    const { data: newRooms, error: newRoomsError } = await client
        .from("rooms")
        .select("room_id")
        .eq("theme_id", new_theme_id);
    const num_rooms_new = newRoomsError ? 0 : newRooms.length;

    const { data: newMessages, error: newMessagesError } = await client
        .from("forum_messages")
        .select("message_id")
        .in("room_id", newRooms.map(r => r.room_id));
    const num_messages_new = newMessagesError ? 0 : newMessages.length;

    await client
        .from("themes")
        .update({ num_rooms: num_rooms_new, num_messages: num_messages_new })
        .eq("theme_id", new_theme_id);

    // Refresh rooms list for the new theme
    renderRooms(new_theme_id, new_theme_topic);
}

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

  data.map( (item) => {
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


async function createNewTheme() {

    console.log("Create new theme button clicked")
    const theme_title = prompt("Enter theme title")
    const theme_descr = prompt("Enter theme description")
    if(theme_title && theme_descr) {
      console.log("Creating new theme with title: ", theme_title, " and description: ", theme_descr)
      const to_insert = {
        topic: theme_title,
        description: theme_descr,
        creater_ID: window.currentUser,
        num_rooms: 0,
        num_messages: 0
      };
      client
        .from('themes')
        .insert([to_insert])
        .then(({ data, error }) => {
          if (error) {
            console.error("Error creating theme:", error);
          } else {
            console.log("Theme created successfully:", data);
            renderThemes(); // Refresh the themes list
          }
        });
    } else {
      console.log("Theme title or description is empty, not creating theme")
    }
}
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
/**************** End of renderRooms */

/*********
 * Deletes theme and all rooms/messages inside it
 */
async function deleteTheme(theme_id) {
    // Delete all rooms for this theme
    const { data: roomsData, error: roomsError } = await client
        .from("rooms")
        .select("room_id")
        .eq("theme_id", theme_id);

    if (roomsError) {
        console.error("Error loading rooms for theme:", roomsError);
        return;
    }

    // Delete all messages for each room
    if (roomsData && roomsData.length > 0) {
        const roomIds = roomsData.map(r => r.room_id);
        const { error: msgError } = await client
            .from("forum_messages")
            .delete()
            .in("room_id", roomIds);
        if (msgError) {
            console.error("Error deleting messages:", msgError);
        }
    }

    // Delete all rooms for this theme
    if (roomsData && roomsData.length > 0) {
        const roomIds = roomsData.map(r => r.room_id);
        const { error: roomDeleteError } = await client
            .from("rooms")
            .delete()
            .in("room_id", roomIds);
        if (roomDeleteError) {
            console.error("Error deleting rooms:", roomDeleteError);
        }
    }

    // Delete the theme itself
    const { error: themeDeleteError } = await client
        .from("themes")
        .delete()
        .eq("theme_id", theme_id);
    if (themeDeleteError) {
        console.error("Error deleting theme:", themeDeleteError);
    } else {
        console.log("Theme deleted:", theme_id);
    }

    // Refresh themes list
    renderThemes();
}

/*********
 * Deletes room and all messages from it, updates themes table
 */
async function deleteRoom(room_id, theme_id, theme_topic) {
    // Delete all messages from this room
    const { error: msgError } = await client
        .from("forum_messages")
        .delete()
        .eq("room_id", room_id);
    if (msgError) {
        console.error("Error deleting messages:", msgError);
    } else {
        console.log("All messages deleted for room", room_id);
    }

    // Delete the room itself
    const { error: roomError } = await client
        .from("rooms")
        .delete()
        .eq("room_id", room_id);
    if (roomError) {
        console.error("Error deleting room:", roomError);
        return;
    } else {
        console.log("Room deleted:", room_id);
    }

    // Update num_rooms and num_messages in themes table
    const { data: themeData, error: themeError } = await client
        .from("themes")
        .select("*")
        .eq("theme_id", theme_id)
        .single();
    if (themeError) {
        console.error("Error loading theme info:", themeError);
    } else {
        // Count remaining rooms for this theme
        const { data: roomsData, error: roomsError } = await client
            .from("rooms")
            .select("room_id")
            .eq("theme_id", theme_id);
        const num_rooms = roomsError ? 0 : roomsData.length;

        // Count remaining messages for this theme
        const { data: messagesData, error: messagesError } = await client
            .from("forum_messages")
            .select("message_id")
            .in("room_id", roomsData.map(r => r.room_id));
        const num_messages = messagesError ? 0 : messagesData.length;

        const { error: updateError } = await client
            .from("themes")
            .update({ num_rooms, num_messages })
            .eq("theme_id", theme_id);
        if (updateError) {
            console.error("Error updating theme counts:", updateError);
        } else {
            console.log("Theme counts updated for theme_id", theme_id);
        }
    }

    // Refresh rooms list
    renderRooms(theme_id, theme_topic);
}
/**************** End of deleteRoom */

/****  
 * Creates new room for the particular theme
 */
async function createNewRoom(theme_id, theme_topic){
        console.log("Create new room button clicked")
        const room_topic = prompt("Enter room topic")
        if(room_topic) {
            console.log("Creating new room with topic: ", room_topic)
            const to_insert = {
                theme_id: theme_id,
                topic: room_topic,
                num_messages: 0
            };
            client
                .from('rooms')
                .insert([to_insert])
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Error creating room:", error);
                    } else {
                        console.log("Room created successfully:", data);
                        renderRooms(theme_id, theme_topic); // Refresh the rooms list
                    }
                });

                // update num_rooms for "themes" table
                const { data: countData, error: countError } = await client
                    .from("themes")
                    .select("*")
                    .eq("theme_id", theme_id)
                    .single();
                if (countError) {       
                    console.log("Error loading themes info line:", countError)
                } else {
                    const currentCount = countData.num_rooms;
                    console.log("currentCount = ", currentCount)
                    const {error: updateError} = await client
                        .from("themes")
                        .update({num_rooms: currentCount + 1})
                        .eq("theme_id", theme_id);
                    if(updateError) {
                        console.log("Update error: ", updateError)
                    } else {
                        console.log("num_rooms incremented from theme_id", theme_id)
                    }
                }
        } else {
            console.log("Room topic is empty, not creating room")
        }
    }
/***   End of createNewRoom */

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
