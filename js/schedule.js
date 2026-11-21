const defaultSchedule = [
  {
    Date: "Sep 27, 2026",
    Hosts: "Denise Zephier",
    Presenters: "John Sampen, Marilyn Shrude",
    Topic: "Musical Journey"
  },
  {
    Date: "Oct 25, 2026",
    Hosts: "Jacoby’s",
    Presenters: "Jacoby’s",
    Topic: "Antarctica"
  },
  {
    Date: "Nov 22, 2026",
    Hosts: "--- cancelled ---",
    Presenters: "--- cancelled ---",
    Topic: "--- cancelled ---"
  },
  {
    Date: "Jan 24, 2027",
    Hosts: "Daria and Alexey Luchinsky",
    Presenters: "Bullerjahn’s",
    Topic: ""
  },
  {
    Date: "Feb 28, 2027",
    Hosts: "Hilde F",
    Presenters: "Bob and Sue K.",
    Topic: ""
  },
  {
    Date: "Mar 21, 2027",
    Hosts: "Sue and Dave Potter",
    Presenters: "Sue and Dave Potter",
    Topic: "Visit Indonesia"
  },
  {
    Date: "Apr 25, 2027",
    Hosts: "Roger and Betty Jean Anderson",
    Presenters: "Susan and George Winters",
    Topic: "Reno and Lake Tahoe"
  },
  {
    Date: "May 23, 2027",
    Hosts: "Raul and Jo Ascunce",
    Presenters: "Bob and Joan Callecod",
    Topic: "French Polynesian Islands"
  }
];

const scheduleColumns = ["Date", "Hosts", "Presenters", "Topic"];

function renderScheduleTable(data, statusMessage = "") {
  const container = document.getElementById("schedule-table");
  if (!container) return;

  container.replaceChildren();

  if (statusMessage) {
    const status = document.createElement("p");
    status.textContent = statusMessage;
    container.appendChild(status);
  }

  const table = document.createElement("table");
  table.border = "1";
  table.cellPadding = "5";
  table.cellSpacing = "0";
  const head = table.createTHead().insertRow();
  scheduleColumns.forEach((column) => {
    const heading = document.createElement("th");
    heading.textContent = column;
    head.appendChild(heading);
  });

  const body = table.createTBody();
  data.forEach((entry, rowIndex) => {
    const row = body.insertRow();
    scheduleColumns.forEach((column) => {
      const cell = row.insertCell();
      const value = String(entry[column] || "");
      cell.textContent = value;
      if (value.trim().startsWith("(")) {
        cell.style.backgroundColor = "#ffcccc";
      }
      if (window.admin) {
        cell.title = "Double-click to edit";
        cell.addEventListener("dblclick", () => handleCellDoubleClick(column, rowIndex));
      }
    });
  });
  container.appendChild(table);

  if (window.admin) {
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save schedule";
    saveButton.addEventListener("click", saveSchedule);
    container.appendChild(saveButton);

    const revertButton = document.createElement("button");
    revertButton.textContent = "Revert changes";
    revertButton.addEventListener("click", revertSchedule);
    container.appendChild(revertButton);
  }
}

async function loadSchedule() {
  window.schedule_data = structuredClone(defaultSchedule);
  window.oldData = structuredClone(window.schedule_data);

  if (!window.firebaseConfigured) {
    renderScheduleTable(
      window.schedule_data,
      "Showing the built-in schedule. Configure Firebase to save schedule changes."
    );
    return;
  }

  renderScheduleTable(window.schedule_data, "Loading saved schedule from Firebase...");

  let statusMessage = "";
  try {
    const snapshot = await window.db.collection("schedule2025").get();
    if (snapshot.empty) {
      statusMessage = "Showing the built-in schedule. An admin can save it to Firebase.";
    } else {
      window.schedule_data = snapshot.docs
        .map((document) => ({ ...document.data(), _order: document.data().order ?? 0 }))
        .sort((left, right) => left._order - right._order)
        .map(({ _order, ...entry }) => entry);
    }
  } catch (error) {
    console.error("Error loading schedule from Firebase:", error);
    statusMessage = "Could not load the saved schedule. Showing the built-in schedule instead.";
  }

  window.oldData = structuredClone(window.schedule_data);
  renderScheduleTable(window.schedule_data, statusMessage);
}

function handleCellDoubleClick(column, rowIndex) {
  if (!window.admin) return;

  const currentValue = window.schedule_data[rowIndex][column] || "";
  const newValue = prompt(`Edit ${column}:`, currentValue);
  if (newValue === null) return;

  window.schedule_data[rowIndex][column] = `(${newValue})`;
  renderScheduleTable(window.schedule_data);
}

function revertSchedule() {
  window.schedule_data = structuredClone(window.oldData || defaultSchedule);
  renderScheduleTable(window.schedule_data);
}

async function saveSchedule() {
  if (!window.firebaseConfigured || !window.admin) {
    alert("An administrator must sign in and Firebase must be configured to save the schedule.");
    return;
  }

  const schedule = window.schedule_data.map((entry, order) => {
    const savedEntry = { order };
    scheduleColumns.forEach((column) => {
      const value = entry[column];
      savedEntry[column] = typeof value === "string"
        ? value.replace(/^\((.*)\)$/, "$1")
        : "";
    });
    return savedEntry;
  });

  try {
    if (schedule.length > 450) {
      throw new Error("The schedule is too large to save in one Firestore batch.");
    }

    const collection = window.db.collection("schedule2025");
    const existing = await collection.get();
    const batch = window.db.batch();
    const desiredIds = new Set(schedule.map((_, index) => String(index)));
    existing.docs.forEach((document) => {
      if (!desiredIds.has(document.id)) batch.delete(document.ref);
    });
    schedule.forEach((entry, index) => {
      batch.set(collection.doc(String(index)), entry);
    });

    await batch.commit();
    window.schedule_data = schedule.map(({ order, ...entry }) => entry);
    window.oldData = structuredClone(window.schedule_data);
    renderScheduleTable(window.schedule_data, "Schedule saved to Firebase.");
  } catch (error) {
    console.error("Error saving schedule to Firebase:", error);
    alert("The schedule could not be saved. Check the browser console and Firebase security rules.");
  }
}

document.addEventListener("DOMContentLoaded", loadSchedule);
