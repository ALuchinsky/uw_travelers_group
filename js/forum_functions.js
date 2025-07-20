console.log("Loading forum functions...");

/***  loads data from supabas
 ** This function retrieves data from a specified Supabase table.  
 ** @param {string} tableName - The name of the table to query.
 ** @param {Object} [query={}] - An optional query object to filter the results.
 * * * @returns {Promise<Array>} - A promise that resolves to an array of data from the table.
 */
 async function loadDataFromSupabase(tableName, query = {}, order= false) {
    if(order) {
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .match(query)
            .order(order);
        if (error) {
            console.error(`Error loading data from ${tableName}:`, error);
            return [];
        }
        return data;
    } else {
        const { data, error } = await client
            .from(tableName)
            .select('*')
            .match(query);
        if (error) {
            console.error(`Error loading data from ${tableName}:`, error);
            return [];
        }
        return data;
    }

}

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

        } else {
            console.log("Room topic is empty, not creating room")
        }
    }
/***   End of createNewRoom */

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
    // Refresh rooms list
    renderRooms(theme_id, theme_topic);
}
/**************** End of deleteRoom */

/****   
 * Creates new theme
 * This function prompts the user for a theme title and description, then inserts a new theme into the database.
 */
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
/********* End of createNewTheme */


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
/********* End of deleteTheme */

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

    renderRooms(new_theme_id, new_theme_topic);
}
/********* End of moveRoomToTheme */

/**
 * Sends a message to a specific forum room
 */
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


    renderMessages(room_id, room_topic, theme_id, theme_topic) 
  
}
/********* End of sendForumMessage */

/**
 * Deletes a message from the forum
 */
async function deleteMessage(message_id) 
{
        if (doubleConfirm(
        "Are you sure you want to delete this message?",
        "Please, rethink, this action cannot be undone.")) {
        const { error: deleteError } = await client
            .from("forum_messages")
            .delete()
            .eq("message_id", message_id);
        if (deleteError) {
            console.error("Error deleting message:", deleteError);
            return false; // Indicate failure
        } else {
            console.log("Message deleted:", message_id);
            return true; // Indicate successful deletion
            // Refresh messages list
        }
    }
}
/********* End of deleteMessage */