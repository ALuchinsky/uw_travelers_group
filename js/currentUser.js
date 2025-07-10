/************
 * global window variable where current user name is stored
 */
window.currentUser = null;


/**********
 * Loads stored username at the beginning
 */
window.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("currentUser");
  if (stored) {
    currentUser = stored;
    document.getElementById("login-status").textContent = `Logged in as ${currentUser}`;
    document.getElementById("username").value = stored;
  }
});

/******
 * Logs in with the requested user name
 */
function loginUser() {
  const input = document.getElementById("username");
  const name = input.value.trim();

  if (!name) {
    alert("Please enter your name.");
    return;
  }

  window.currentUser = name;
  localStorage.setItem("currentUser", name);
  document.getElementById("login-status").textContent = `Logged in as ${window.currentUser}`;
}

