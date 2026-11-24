window.currentUser = "Guest";
window.currentUid = null;
window.admin = false;

function debug_print(...args) {
  if (window.admin) {
    console.log("DEBUG:", ...args);
  }
}

function updateLoginStatus(user, displayName, isAdmin) {
  window.currentUid = user ? user.uid : null;
  window.currentUser = user ? displayName : "Guest";
  window.admin = Boolean(user && isAdmin);

  const status = document.getElementById("login-status");
  document.getElementById("account-settings-btn").hidden = !user;
  document.getElementById("manage-users-btn").hidden = !window.admin;
  status.textContent = user
    ? `Logged in as ${displayName}${window.admin ? " (admin)" : ""}`
    : window.firebaseConfigured
      ? "Not logged in"
      : "Firebase setup required";

  toggleForumAndChat(Boolean(user));

  if (typeof renderRooms === "function") renderRooms();
  if (typeof loadSchedule === "function") loadSchedule();
  if (typeof loadChatMessages === "function") loadChatMessages();
  if (typeof updateVisitorsCount === "function") updateVisitorsCount();
}

function openAccountSettings() {
  const user = window.auth && window.auth.currentUser;
  if (!user) return;

  document.getElementById("account-display-name-input").value = window.currentUser;
  document.getElementById("password-form").reset();
  document.getElementById("account-settings-status").textContent = "";
  document.getElementById("account-settings-dialog").showModal();
}

function setAccountSettingsStatus(message, isError = false) {
  const status = document.getElementById("account-settings-status");
  status.textContent = message;
  status.style.color = isError ? "firebrick" : "inherit";
}

function setUserManagementStatus(message, isError = false) {
  const status = document.getElementById("user-management-status");
  status.textContent = message;
  status.style.color = isError ? "firebrick" : "inherit";
}

function renderManagedUsers(users) {
  const list = document.getElementById("managed-users-list");
  if (!users.length) {
    list.textContent = "No users found.";
    return;
  }

  list.innerHTML = `<table class="managed-users-table">
    <thead><tr><th>Email</th><th>Display name</th><th>Role</th><th>Actions</th></tr></thead>
    <tbody>${users.map((user) => `<tr>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.displayName)}</td>
      <td>${user.isAdmin ? "Admin" : "Member"}</td>
      <td>
        <button type="button" data-edit-user="${escapeHtml(user.uid)}">Edit</button>
        <button type="button" class="user-delete-button" data-delete-user="${escapeHtml(user.uid)}">Delete</button>
      </td>
    </tr>`).join("")}</tbody>
  </table>`;
}

async function loadManagedUsers(successMessage = "") {
  if (!window.admin || !window.functions) {
    setUserManagementStatus("Admin access and Firebase Functions are required.", true);
    return;
  }

  setUserManagementStatus("Loading users...");
  try {
    const result = await window.functions.httpsCallable("adminListUsers")();
    renderManagedUsers(result.data.users);
    setUserManagementStatus(successMessage);
  } catch (error) {
    console.error("Could not load users:", error);
    setUserManagementStatus("Could not load users. Check the Firebase Functions deployment and your admin access.", true);
  }
}

function openUserManagement() {
  if (!window.admin) return;

  document.getElementById("create-user-form").reset();
  document.getElementById("edit-user-form").hidden = true;
  document.getElementById("user-management-dialog").showModal();
  loadManagedUsers();
}

async function createManagedUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const email = document.getElementById("new-user-email-input").value.trim();
  const displayName = document.getElementById("new-user-display-name-input").value.trim();
  const password = document.getElementById("new-user-password-input").value;
  const confirmPassword = document.getElementById("new-user-confirm-password-input").value;
  const isAdmin = document.getElementById("new-user-admin-input").checked;

  if (!window.admin || !window.functions) return;
  if (!displayName || displayName.length > 80 || password.length < 6) {
    setUserManagementStatus("Enter a display name (up to 80 characters) and a password of at least 6 characters.", true);
    return;
  }
  if (password !== confirmPassword) {
    setUserManagementStatus("The passwords do not match.", true);
    return;
  }

  try {
    await window.functions.httpsCallable("adminCreateUser")({ email, displayName, password, isAdmin });
    form.reset();
    await loadManagedUsers("User added.");
  } catch (error) {
    console.error("Could not create user:", error);
    setUserManagementStatus(error.code === "functions/already-exists"
      ? "An account with that email already exists."
      : error.code === "functions/invalid-argument"
        ? "Check the email, display name, and password and try again."
        : "Could not add user. Check the Firebase Functions deployment and your admin access.", true);
  }
}

function beginEditManagedUser(user) {
  document.getElementById("edit-user-form").hidden = false;
  document.getElementById("edit-user-form").dataset.userId = user.uid;
  document.getElementById("edit-user-heading").textContent = `Edit ${user.displayName || user.email}`;
  document.getElementById("edit-user-email").textContent = user.email;
  document.getElementById("edit-user-display-name-input").value = user.displayName;
  document.getElementById("edit-user-password-input").value = "";
  document.getElementById("edit-user-confirm-password-input").value = "";
  const adminInput = document.getElementById("edit-user-admin-input");
  adminInput.checked = user.isAdmin;
  adminInput.disabled = user.uid === window.currentUid;
  document.getElementById("edit-user-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function saveManagedUser(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const uid = form.dataset.userId;
  const displayName = document.getElementById("edit-user-display-name-input").value.trim();
  const password = document.getElementById("edit-user-password-input").value;
  const confirmPassword = document.getElementById("edit-user-confirm-password-input").value;
  const isAdmin = document.getElementById("edit-user-admin-input").checked;

  if (!window.admin || !window.functions) return;
  if (!uid || !displayName || displayName.length > 80 || (password && password.length < 6)) {
    setUserManagementStatus("Enter a display name (up to 80 characters) and, if changing it, a password of at least 6 characters.", true);
    return;
  }
  if (password !== confirmPassword) {
    setUserManagementStatus("The new passwords do not match.", true);
    return;
  }

  try {
    await window.functions.httpsCallable("adminUpdateUser")({ uid, displayName, password, isAdmin });
    form.hidden = true;
    await loadManagedUsers("User updated.");
  } catch (error) {
    console.error("Could not update user:", error);
    setUserManagementStatus(error.code === "functions/not-found"
      ? "That user no longer exists."
      : error.code === "functions/failed-precondition"
        ? error.message.includes("own")
          ? "You cannot remove your own administrator access."
          : "At least one administrator must remain."
      : error.code === "functions/invalid-argument"
        ? "Check the display name and password and try again."
        : "Could not update user. Check the Firebase Functions deployment and your admin access.", true);
  }
}

async function deleteManagedUser(uid) {
  const confirmed = window.confirm("Delete this user? This permanently removes their account and profile.");
  if (!confirmed) return;

  try {
    await window.functions.httpsCallable("adminDeleteUser")({ uid });
    document.getElementById("edit-user-form").hidden = true;
    await loadManagedUsers("User deleted.");
  } catch (error) {
    console.error("Could not delete user:", error);
    setUserManagementStatus(error.code === "functions/failed-precondition"
      ? "You cannot delete the account you are currently using."
      : error.code === "functions/not-found"
        ? "That user no longer exists."
        : "Could not delete user. Check the Firebase Functions deployment and your admin access.", true);
  }
}

async function saveDisplayName(event) {
  event.preventDefault();
  const user = window.auth && window.auth.currentUser;
  const displayName = document.getElementById("account-display-name-input").value.trim();

  if (!user || !window.db) {
    setAccountSettingsStatus("You must be signed in to change your display name.", true);
    return;
  }
  if (!displayName || displayName.length > 80) {
    setAccountSettingsStatus("Enter a display name between 1 and 80 characters.", true);
    return;
  }

  try {
    await window.db.collection("users").doc(user.uid).set({
      displayName,
      email: user.email || "",
      updatedAt: new Date().toISOString()
    });

    let profileWarning = "";
    if (user.displayName !== displayName) {
      try {
        await user.updateProfile({ displayName });
      } catch (error) {
        console.error("Could not synchronize the Firebase Auth display name:", error);
        profileWarning = " The app name was saved, but Firebase could not synchronize the account profile.";
      }
    }

    updateLoginStatus(user, displayName, window.admin);
    setAccountSettingsStatus(`Display name updated.${profileWarning}`);
  } catch (error) {
    console.error("Could not save the display name:", error);
    setAccountSettingsStatus("Could not save the display name. Check your connection and Firebase permissions.", true);
  }
}

async function changePassword(event) {
  event.preventDefault();
  const user = window.auth && window.auth.currentUser;
  const currentPassword = document.getElementById("current-password-input").value;
  const newPassword = document.getElementById("new-password-input").value;
  const confirmPassword = document.getElementById("confirm-password-input").value;

  if (!user || !user.email) {
    setAccountSettingsStatus("You must be signed in with an email account to change your password.", true);
    return;
  }
  if (newPassword.length < 6) {
    setAccountSettingsStatus("The new password must be at least 6 characters long.", true);
    return;
  }
  if (newPassword !== confirmPassword) {
    setAccountSettingsStatus("The new passwords do not match.", true);
    return;
  }

  try {
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
    document.getElementById("password-form").reset();
    setAccountSettingsStatus("Password updated.");
  } catch (error) {
    console.error("Could not change the password:", error);
    const message = error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential" ||
      error.code === "auth/invalid-login-credentials"
      ? "The current password is incorrect."
      : error.code === "auth/weak-password"
        ? "The new password does not meet Firebase's password requirements."
        : "Could not change the password. Verify the current password and try again.";
    setAccountSettingsStatus(message, true);
  }
}

async function recordAuthAction(action, user) {
  if (!window.db || !user.email) {
    throw new Error("Firestore and an account email are required to record authentication history.");
  }

  await window.db.collection("auth_history").add({
    action,
    email: user.email,
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function handleAuthState(user) {
  if (!user) {
    updateLoginStatus(null, "Guest", false);
    return;
  }

  let displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Member");
  let isAdmin = false;

  try {
    isAdmin = await isAdminUser(user.uid);
    const profileRef = window.db.collection("users").doc(user.uid);
    const profile = await profileRef.get();
    if (profile.exists && profile.data().displayName) {
      displayName = profile.data().displayName;
    } else {
      await profileRef.set({
        displayName,
        email: user.email || "",
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Could not load Firebase user profile or admin status:", error);
  }

  updateLoginStatus(user, displayName, isAdmin);
  if (typeof logVisit === "function") {
    logVisit(user.uid);
  }
}

async function loginUser() {
  if (!window.auth) {
    alert("Firebase is not configured yet. Contact the site administrator.");
    return;
  }

  const dialog = document.getElementById("login-dialog");
  const emailInput = dialog.querySelector("#login-email-input");
  const passwordInput = dialog.querySelector("#login-password-input");

  dialog.addEventListener("close", async () => {
    if (dialog.returnValue !== "submit") return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    passwordInput.value = "";

    let credential;
    try {
      credential = await window.auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Firebase sign-in failed:", error);
      alert("Sign-in failed. Check your email and password, or ask the site administrator for an account.");
      return;
    }

    try {
      await recordAuthAction("login", credential.user);
    } catch (error) {
      console.error("Could not record login history:", error);
      alert("You are signed in, but your login could not be added to history.");
    }
  }, { once: true });

  dialog.showModal();
}

async function logoutUser() {
  if (!window.auth || !window.auth.currentUser) return;

  try {
    await recordAuthAction("logout", window.auth.currentUser);
  } catch (error) {
    console.error("Could not record logout history:", error);
    alert("Could not save your logout history, so you remain signed in. Please try again.");
    return;
  }

  try {
    await window.auth.signOut();
  } catch (error) {
    console.error("Firebase sign-out failed:", error);
    alert("Could not sign out. Please try again.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("display-name-form").addEventListener("submit", saveDisplayName);
  document.getElementById("password-form").addEventListener("submit", changePassword);
  document.getElementById("create-user-form").addEventListener("submit", createManagedUser);
  document.getElementById("edit-user-form").addEventListener("submit", saveManagedUser);
  document.getElementById("cancel-edit-user-btn").addEventListener("click", () => {
    document.getElementById("edit-user-form").hidden = true;
  });
  document.getElementById("managed-users-list").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const users = Array.from(document.querySelectorAll("#managed-users-list tbody tr"), (row) => {
      const [email, displayName, role, actions] = row.cells;
      const userId = actions.querySelector("[data-edit-user]").dataset.editUser;
      return {
        uid: userId,
        email: email.textContent,
        displayName: displayName.textContent,
        isAdmin: role.textContent === "Admin"
      };
    });

    if (button.dataset.editUser) {
      const user = users.find((item) => item.uid === button.dataset.editUser);
      if (user) beginEditManagedUser(user);
    } else if (button.dataset.deleteUser) {
      deleteManagedUser(button.dataset.deleteUser);
    }
  });

  if (!window.auth) {
    updateLoginStatus(null, "Guest", false);
    return;
  }

  window.auth.onAuthStateChanged((user) => {
    handleAuthState(user).catch((error) => {
      console.error("Could not update the signed-in user:", error);
    });
  });
});
