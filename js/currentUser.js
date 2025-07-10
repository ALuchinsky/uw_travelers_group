window.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("currentUser");
  if (stored) {
    currentUser = stored;
    document.getElementById("login-status").textContent = `Logged in as ${currentUser}`;
    document.getElementById("username").value = stored;
  }
});

  window.currentUser = null;

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
  // document.getElementById("username").disabled = true;
}

