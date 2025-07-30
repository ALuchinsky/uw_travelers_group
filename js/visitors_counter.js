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
