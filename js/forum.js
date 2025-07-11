
async function loadThemes() {
    console.log("Loading themes")
  const { data, error } = await client
    .from("themes")
    .select("*")

  if (error) {
    console.error("Failed to load messages:", error);
    return;
  }

  const themeBox = document.getElementById("forum_themes");

  const html = "<hr>" + data.map(msg => {
    console.log(msg)
    line = "<div>"
    line += `<span class="theme-title">${msg.topic}</span>`
    line += "<br>&nbsp;&nbsp;&nbsp; "
    line += `<span class="theme-descr">${msg.description}</span>`
    line += "</div><hr>"
    return(line)
  }
  ).join("");
  themeBox.innerHTML = html
  themeBox.scrollTop = themeBox.scrollHeight;

}

document.addEventListener("DOMContentLoaded", loadThemes);
