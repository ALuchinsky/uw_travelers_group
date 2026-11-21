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

    try {
      await window.auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Firebase sign-in failed:", error);
      alert("Sign-in failed. Check your email and password, or ask the site administrator for an account.");
    }
  }, { once: true });

  dialog.showModal();
}

async function logoutUser() {
  if (!window.auth || !window.auth.currentUser) return;

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
