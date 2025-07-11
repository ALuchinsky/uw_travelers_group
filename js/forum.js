
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
  themeBox.textContent = ""
  themeBox.innerHTML = "<div>Forum themes</div>"
  data.map( (item) => {
    const div = document.createElement("div");
    div.innerHTML = "<hr>"
    div.innerHTML +=  `<span class="theme-title">${item.topic}</span>`;
    div.innerHTML += "<br>&nbsp;&nbsp;&nbsp; "
    div.innerHTML += `<span class="theme-descr">${item.description}</span>`
    div.addEventListener("click", () => {
        console.log("You have clicked item ", item.theme_id)
        renderRooms(item.theme_id, item.topic)
    });
    themeBox.appendChild(div);
  })
  themeBox.scrollTop = themeBox.scrollHeight;
}

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
    data.map( (item) => {
        const div = document.createElement("div")
        div.innerHTML = "<hr>"
        div.innerHTML +=  `<span class="theme-title">${item.topic}</span>`;
        div.addEventListener("click", () => {
            console.log("You have clicked room  ", item.room_id)
            renderMessages(item.room_id, item.topic, theme_id, theme_topic)
        });
        themeBox.appendChild(div)
    })
}

async function renderMessages(room_id, room_topic, theme_id, theme_topic) {
    console.log("renderMessages: ", room_id);
    const themeBox = document.getElementById("forum_themes");
    themeBox.innerHTML = `<div>Messages for room "${room_topic}"</div>`


    const back_button = document.createElement("button")
    back_button.textContent = "Back"
    back_button.addEventListener("click", () => {renderRooms(theme_id, theme_topic)})
    themeBox.appendChild(back_button)


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
