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

