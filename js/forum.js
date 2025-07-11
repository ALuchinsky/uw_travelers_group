
async function loadThemes() {
    console.log("Loading themes")
    const { themes, error } = await client
        .from("themes")
        .select("*");
        
    console.log("Finished")
    console.log("error = ", error)
    if (error) {
        console.error("Failed to forum themes:", error);
        return;
    }
    const forumBox = document.getElementById("forum_themes")
    const html = themes.map(msg => {
        console.log(msg)
        return(`<div>Theme</div>`)
    })

}

