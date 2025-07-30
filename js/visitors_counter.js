console.log("visitors_counter.js loaded");

async function getPublicIP() {
  const res = await fetch("https://api64.ipify.org?format=json");
  const data = await res.json();
  return data.ip;
}

getPublicIP().then(ip => {
  console.log("Your IP is:", ip);
});
