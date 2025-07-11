
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

  const html = data.map(msg => {
    console.log(msg)
    return(`<div><a>${msg.topic}</a><br>&nbsp;&nbsp;&nbsp; <small>${msg.description}</small></div><tr>`)
  }
  ).join("");
  themeBox.innerHTML = html
  themeBox.scrollTop = themeBox.scrollHeight;

}

document.addEventListener("DOMContentLoaded", loadThemes);
