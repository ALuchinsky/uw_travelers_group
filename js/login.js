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

/******
 * Logs in with the requested user name
 */
async function loginUser() {
    const input = document.getElementById("username");
    let name = input.value.trim();

    window.admin = false; // reset admin status

    if (!name) {
        alert("Please enter your name.");
        return;
    }

    // read users data from supabase
    const {data: usersData, error: usersError} = await client
    .from("users")
    .select("*")
    .eq("login_name", name);

    debug_print("usersData", usersData, "usersError", usersError);

    if( usersError) {
        console.error("Failed to load user data:", usersError);
        alert("Failed to load user data. Please try again.");
        logVisit(name, "login_error_not_found");
        return;
    }

    if(usersData.length > 0) {
        debug_print("User found:", usersData[0]);
        if (!usersData[0].password) { 
          name = usersData[0].display_name || name; // use display name if available
          window.admin = false; // no password means not an admin
          logVisit(name, "login_user_success");
        } else {
          const password = prompt("Enter your password:");
          debug_print("password", password, "usersData[0].password", usersData[0].password);
          if (!password) {
              alert("Password is required.");
              name = "Guest"; // reset name if no password provided
              logVisit(name, "login_admin_failed");
          } else if (usersData[0].password !== password) {
              alert("Incorrect password.");
              name = "Guest"; // reset name if password is incorrect
              logVisit(name, "login_admin_failed");
          } else {
              name = usersData[0].display_name; // use display name if available
              window.admin = usersData[0].admin; // set admin status
              logVisit(name, "login_admin_success");
          }
        }
    } else {
        name = "Guest"; // reset name if user not found
    }
  
    debug_print("usersData", usersData, "usersError", usersError);


    window.currentUser = name;
    localStorage.setItem("currentUser", name);
    localStorage.setItem("admin", window.admin);
    document.getElementById("login-status").textContent = `Logged in as ${window.currentUser}`;

    let message = `Welcome to the Travel Club, ${name.split(" ")[0]}!`;
    if( name === "Guest") {
        message = "Welcome to the Travel Club! Your name and/or password was not recognized. Please log in again or contact the site administrator.";
        alert(message);
        renderThemes(); // refresh themes to show guest view
        return;
    }

    alert(message); // welcome message

    window.location.reload(); // reload to apply changes
}

/*********
* Login Dialog version
*/

document.body.insertAdjacentHTML("beforeend", `
<dialog id = "login-dialog">
    <form method="dialog">
        <p><label>Enter your name: <input type="text" id="login-name-input"></label></p>
        <p>Enter password: <input type="password" id="login-password-input"></p>
        <menu>
            <button id="login-submit-btn" value="submit">Submit</button>
            <button id="login-cancel-btn" value="cancel">Cancel</button>
        </menu>
    </form>
</dialog>
`);

async function login2() {
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

function doLogin(name, isAdmin) {
  window.currentUser = name;
  window.admin = isAdmin;
  localStorage.setItem("currentUser", name);
  localStorage.setItem("admin", window.admin);
  document.getElementById("login-status").textContent = `Logged in as ${window.currentUser}`;
  let message = `Welcome to the Travel Club, ${name.split(" ")[0]}!`;
  if( name === "Guest") {
      message = "Welcome to the Travel Club! Your name and/or password was not recognized. Please log in again or contact the site administrator.";
      alert(message);
      renderThemes(); // refresh themes to show guest view
      return;
  }
  alert(message); // welcome message
  window.location.reload(); // reload to apply changes
}
