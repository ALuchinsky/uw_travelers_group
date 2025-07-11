
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
    });
    themeBox.appendChild(div);
  })
  themeBox.scrollTop = themeBox.scrollHeight;

}

document.addEventListener("DOMContentLoaded", renderThemes);
