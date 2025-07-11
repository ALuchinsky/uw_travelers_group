
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
  themeBox.classList.remove("block");
  themeBox.classList.add("active")
  data.map( (item) => {
    const div = document.createElement("div");
    div.innerHTML = "<hr>"
    div.innerHTML +=  `<span class="theme-title">${item.topic}</span>`;
    div.innerHTML += "<br>&nbsp;&nbsp;&nbsp; "
    div.innerHTML += `<span class="theme-descr">${item.description}</span>`
    div.addEventListener("click", () => {
        console.log("You have clicked item ", item.theme_id)
        renderRooms(item.theme_id)
    });
    themeBox.appendChild(div);
  })
  themeBox.scrollTop = themeBox.scrollHeight;
}

async function renderRooms(theme_id) {
    console.log("renderRooms: ", theme_id);
    const themeBox = document.getElementById("forum_themes");
    themeBox.textContent = ""

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
            renderMessages(item.room_id)
        });
        themeBox.appendChild(div)
    })
}

async function renderMessages(room_id) {
    console.log("renderMessages: ", room_id);
    const themeBox = document.getElementById("forum_themes");
    themeBox.textContent = ""

    const { data, error } = await client
        .from("forum_messages")
        .select("*")
        .eq("room_id", room_id)
    if(error) {
        console.log("Messages for room ", room_id, " loaded with error", error)
    }
    console.log("messages = ", data)
    data.map( (item) => {
        const div = document.createElement("div")
        div.innerHTML = "<hr>"
        div.innerHTML +=  `<span class="theme-title">${item.text}</span>`;
        div.addEventListener("click", () => {
            console.log("You have clicked message  ", item.message_id)
        });
        themeBox.appendChild(div)
    })

}



document.addEventListener("DOMContentLoaded", renderThemes);
