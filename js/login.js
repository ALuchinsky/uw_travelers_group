/************
 * global window variable where current user name is stored
 */
window.currentUser = "Guest";

function debug_print(...args) {
  if(window.admin) {
         console.log("DEBUG:", ...args);
  }
}


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
  const adminStored = localStorage.getItem("admin");
  if (adminStored) {
    window.admin = adminStored === "true"; // convert string to boolean
  } else {
    window.admin = false; // default to false if not set
  }
  debug_print("currentUser", currentUser, "admin", window.admin);
  logVisit(currentUser, "open"); // log visit on page load

})


/*********
* Login Dialog version
*/


async function loginUser() {
  const dialog = document.getElementById("login-dialog");
  const nameInput = dialog.querySelector("#login-name-input");
  const passwordInput = dialog.querySelector("#login-password-input");
  const submitBtn = dialog.querySelector("#login-submit-btn");
  const cancelBtn = dialog.querySelector("#login-cancel-btn");
  dialog.addEventListener("close", async () => {
    if (dialog.returnValue === "submit") {
      const name = nameInput.value.trim();
      console.log("Name input:|", name,"|");
      console.log("Password input:", passwordInput.value);
      const {data: usersData, error: usersError} = await client
        .from("users")
        .select("*")
        .eq("login_name", name);

      // debug_print("usersData", usersData, "usersError", usersError);

      if( usersError) {
          console.error("Failed to load user data:", usersError);
          alert("Failed to load user data. Please try again.");
          return;
      }

      if(usersData.length == 0) {
          alert("User not found.");
          logVisit(name, "login_error_not_found");
          doLogin("Guest", false);
          return;
      } else {
          const user = usersData[0];
          if (user.password) { 
              if (user.password !== passwordInput.value) {
                  alert("Incorrect password.");
                  logVisit(name, "login_admin_failed");
                  doLogin("Guest", false);
                  return;
              } else {
                  logVisit(name, "login_admin_success");
                  doLogin(user.display_name || name, user.admin);
                  return;
              }
          } else {
              logVisit(name, "login_user_success");
              doLogin(user.display_name || name, false);
              return;
            }
      }

    }
  });
  dialog.showModal();
  console.log("Dialog shown");
}


function doLogin(name, isAdmin, showAlert=true) {
  window.currentUser = name;
  toggleForumAndChat(window.currentUser && window.currentUser !== "Guest");
  window.admin = isAdmin;
  localStorage.setItem("currentUser", name);
  localStorage.setItem("admin", window.admin);
  document.getElementById("login-status").textContent = `Logged in as ${window.currentUser}`;
  let message = `Welcome to the Travel Club, ${name.split(" ")[0]}!`;
  if( name === "Guest") {
      message = "Welcome to the Travel Club! Your name and/or password was not recognized. Please log in again or contact the site administrator.";
  }
  if( showAlert) {
    alert(message); // welcome message
  }
  renderThemes(); // reload to apply changes
}

function logoutUser() {
  logVisit(window.currentUser, "logout");
  doLogin("Guest", false, false);
}