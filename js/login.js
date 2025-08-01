/************
 * global window variable where current user name is stored
 */
window.currentUser = "Guest";




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
  console.log("currentUser", currentUser, "admin", window.admin);
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

    console.log("usersData", usersData, "usersError", usersError);

    if( usersError) {
        console.error("Failed to load user data:", usersError);
        alert("Failed to load user data. Please try again.");
        return;
    }

    if(usersData.length > 0) {
        console.log("User found:", usersData[0]);
        if (!usersData[0].password) {
          name = usersData[0].display_name || name; // use display name if available
          window.admin = false; // no password means not an admin
        } else {
          const password = prompt("Enter your password:");
          console.log("password", password, "usersData[0].password", usersData[0].password);
          if (!password) {
              alert("Password is required.");
              name = "Guest"; // reset name if no password provided
          } else if (usersData[0].password !== password) {
              alert("Incorrect password.");
              name = "Guest"; // reset name if password is incorrect
          } else {
              name = usersData[0].display_name; // use display name if available
              window.admin = usersData[0].admin; // set admin status
          }
        }
    } else {
        name = "Guest"; // reset name if user not found
    }
  
    console.log("usersData", usersData, "usersError", usersError);


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

