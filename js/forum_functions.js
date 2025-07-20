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
