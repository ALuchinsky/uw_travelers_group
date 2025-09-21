function toggleForumAndChat(show) {
  const forum = document.getElementById("forumBtn");
  const chat = document.getElementById("chatBtn");

  if (show) {
    forum.style.display = "";  // reset to default
    chat.style.display = "";
  } else {
    forum.style.display = "none";  // hide
    chat.style.display = "none";
  }
}

toggleForumAndChat(window.currentUser && window.currentUser !== "Guest");

/***********
 * opens a specified tab
 */
function openPage(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }
  var tab = document.getElementById(tabName);
  if (tab) {
    tab.style.display = "block";
  }
  if (evt) {
    evt.currentTarget.classList.add("active");
  } else {
    // Automatically mark the correct button active if evt is null (on load)
    for (i = 0; i < tablinks.length; i++) {
      if (tablinks[i].textContent === tabName) {
        tablinks[i].classList.add("active");
      }
    }
  }
}

/********
 * Opens Presentations tab on the beginning
 */
window.onload = function() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") || "Presentations";
  openPage(null, tab);
};
