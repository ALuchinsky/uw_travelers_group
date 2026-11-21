async function logVisit(uid) {
  if (!window.db || !uid) return;

  try {
    await window.db.collection("siteStats").doc("visits").set({
      count: firebase.firestore.FieldValue.increment(1),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Could not record member visit:", error);
  }
}

async function updateVisitorsCount() {
  const countElement = document.getElementById("visitors-count");
  if (!countElement) return;
  if (!window.db) {
    countElement.textContent = "Unavailable";
    return;
  }

  try {
    const snapshot = await window.db.collection("siteStats").doc("visits").get();
    countElement.textContent = String(snapshot.exists ? snapshot.data().count || 0 : 0);
  } catch (error) {
    console.error("Could not load member visit count:", error);
    countElement.textContent = "Unavailable";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const counter = document.getElementById("visitors-counter");
  if (counter) {
    counter.innerHTML = '<p>Member visits: <span id="visitors-count">Loading...</span></p>';
  }
  updateVisitorsCount();
});
