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
