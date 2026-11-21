window.firebaseConfigured = false;
window.auth = null;
window.db = null;

const config = window.firebaseConfig;
const requiredConfigValues = ["apiKey", "authDomain", "projectId", "appId"];

if (config && requiredConfigValues.every((key) =>
  typeof config[key] === "string" &&
  config[key].length > 0 &&
  !config[key].startsWith("YOUR_")
)) {
  firebase.initializeApp(config);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.firebaseConfigured = true;
} else {
  console.error("Firebase is not configured. Update js/firebase-config.js with your web app settings.");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function isAdminUser(uid) {
  if (!window.db || !uid) return false;
  const adminSnapshot = await window.db.collection("admins").doc(uid).get();
  return adminSnapshot.exists;
}

async function deleteFirestoreQuery(query) {
  const snapshot = await query.get();
  const batchSize = 400;

  for (let start = 0; start < snapshot.docs.length; start += batchSize) {
    const batch = window.db.batch();
    snapshot.docs.slice(start, start + batchSize).forEach((document) => {
      batch.delete(document.ref);
    });
    await batch.commit();
  }
}
