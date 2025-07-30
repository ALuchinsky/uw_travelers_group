console.log("visitors_counter.js loaded");

async function getPublicIP() {
  const res = await fetch("https://api64.ipify.org?format=json");
  const data = await res.json();
  return data.ip;
}

async function logVisit() {
    ip = "unknown";
    getPublicIP().then(ip => {
        console.log("Your IP is:", ip);
        return ip;
    })
    .then(async (ip) => {
    await client
        .from("visits")
        .insert([{ ip_address: ip, timestamp: new Date().toISOString() }])
        .then(({ data, error }) => {
            if (error) {
                console.error("Error logging visit:", error);
            } else {
                console.log("Visit logged successfully:", data);
            }
        })        
    });

}

logVisit();

document.getElementById("visitors-counter").innerHTML = `
    <p>Visitors counter: <span id="visitors-count">Loading...</span></p>`

async function updateVisitorsCount() {
    const { data, error } = await client
        .from("visits")
        .select("id", { count: 'exact' });

    if (error) {
        console.error("Error fetching visitors count:", error);
        document.getElementById("visitors-count").innerText = "Error";
    } else {
        const count = data.length;
        document.getElementById("visitors-count").innerText = count;
    }

    const { data: visitsData, error:visitsError } = await client.rpc("get_ip_counts");

    if (visitsError) {
    console.error("❌ RPC error:", visitsError);
    } else {
    const result = visitsData[0];  // `rpc()` returns an array with one object
    console.log("📊 Total visits:", result.total_count);
    console.log("📅 Visits this week:", result.this_week_count);
    console.log("🧠 Unique IPs:", result.unique_count);
    console.log("🌐 Unique IPs this week:", result.unique_this_week_count);
    document.getElementById("visitors-count").innerText = 
        `Total: ${result.total_count}, This week: ${result.this_week_count}, Unique IPs: ${result.unique_count}, Unique this week: ${result.unique_this_week_count}`;
    }

}

updateVisitorsCount();

