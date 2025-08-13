/******************************
 * Renders schedule data and shown it in schedule-table div
 */
function renderScheduleTable(data) {
  debug_print("Rendering Schedule table")
  const container = document.getElementById("schedule-table");

  let html = '<table border="1" cellpadding="5" cellspacing="0">';
  html += '<thead><tr><th>Date</th><th>Hosts</th><th>Presenters</th><th>Topic</th></tr></thead><tbody>';

  data.forEach((entry, rowIndex) => {
    html += '<tr>';

    ['Date', 'Hosts', 'Presenters', 'Topic'].forEach((key) => {
      const value = entry[key] || '';
      const style = value.trim().startsWith('(') ? 'style="background-color: #ffcccc;"' : '';

      html += `<td ${style} ondblclick="handleCellDoubleClick('${key}', ${rowIndex})">
        ${value}
      </td>`;
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}


/****************************************
 * Loads schedule from the supabase table schedule2025 and updates the page
 */
async function loadSchedule() {
    const supabaseUrl = 'https://ooqcydaootqkowkhxhil.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcWN5ZGFvb3Rxa293a2h4aGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjI2OTMsImV4cCI6MjA2NzYzODY5M30.NWS0b0alWEj9KAHpHyrcfyQ-2bri571atC0IEVBNeHI';
    const client = window.supabase.createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from('schedule2025')
      .select('*')
      .order('Date', { ascending: true });

    if (error) {
      console.error('Error loading schedule:', error);
      return;
    }
    window.oldData = JSON.parse(JSON.stringify(data));
    window.schedule_data = JSON.parse(JSON.stringify(data));    debug_print("data = ", data)
    renderScheduleTable(window.schedule_data); // ✅ call render after loading
}
document.addEventListener('DOMContentLoaded', loadSchedule);

/***************************
 * When cell is double-clicked opens a dialog box with new value prompt and updates the page
 */
function handleCellDoubleClick(column, rowIndex) {
  if(window.currentUser === "Guest" || !window.currentUser) {
    alert("You must be logged in to edit the schedule.");
    return;
  }
  const value = window.schedule_data[rowIndex][column];
  // alert(`Double-clicked on: ${column} = "${value}" (row ${rowIndex + 1})`);
  const currentValue = window.schedule_data[rowIndex][column]
  var new_value = prompt(`Edit ${column}:`, currentValue)
  if(new_value == null) {
    new_value = ""
  }
  new_value = "(" + new_value + ")"
  window.schedule_data[rowIndex][column] = new_value
  // Optional: add editing logic here later
  renderScheduleTable(window.schedule_data);
}

/**************
 * undoes all the changes and reverts the schedule to the original
 */
function revertSchedule() {
    debug_print("clicked")
    window.schedule_data =JSON.parse(JSON.stringify(window.oldData))
    debug_print(window.schedule_data)
    renderScheduleTable(window.schedule_data); // ✅ call render after loading
}

/***********
 * Sends information about the schedule changes to alexey.luchinsky@gmail.com
 */
async function saveSchedule() {
  if(window.currentUser === "Guest" || !window.currentUser) {
    debug_print("You must be logged in to save the schedule.");
    return;
  };
  debug_print("Saving")
  if(! window.admin ) {
    email_data = {
      name: "Travel Club Website",
      user: window.currentUser,
      email: "aluchi@bgsu.edu",  // optional: use fixed or dynamic email
      message: JSON.stringify(window.schedule_data)
    }
    emailjs.send("service_xg53xju", "template_efpbkjn", email_data).then( () => {
      debug_print("Email sent successfully")
      debug_print("email_data = ", email_data)
    }).catch( (error) => {
      debug_print("Email sent with error ", error)
    })
  } else {
    debug_print("Admin user, not sending email")
    debug_print("schedule_data = ", window.schedule_data)
    window.schedule_data = window.schedule_data.map(entry => {
      const cleanedEntry = { ...entry };
      ['Date', 'Hosts', 'Presenters', 'Topic'].forEach(key => {
        if (typeof cleanedEntry[key] === 'string') {
          cleanedEntry[key] = cleanedEntry[key].replace(/^\((.*)\)$/, '$1');
        }
      });
      return cleanedEntry;
    });
    const supabaseUrl = 'https://ooqcydaootqkowkhxhil.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcWN5ZGFvb3Rxa293a2h4aGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjI2OTMsImV4cCI6MjA2NzYzODY5M30.NWS0b0alWEj9KAHpHyrcfyQ-2bri571atC0IEVBNeHI';
    const client = window.supabase.createClient(supabaseUrl, supabaseKey);

    // Delete all existing rows
    await client.from('schedule2025').delete().neq('id', 0);

    // Insert new data
    const { error } = await client.from('schedule2025').insert(window.schedule_data);

    if (error) {
      debug_print("Error saving to Supabase:", error);
    } else {
      alert("Schedule saved to Supabase successfully");
    }
    renderScheduleTable(window.schedule_data);
  }
}

function downloadSchedule() {
  const workbook = XLSX.utils.book_new();
  // Exclude the 'id' column from the exported data
  const exportData = window.schedule_data.map(({ id, ...rest }) => rest);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");

  // Generate a file name based on the current date
  const today = new Date();
  const fileName = `Schedule_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.xlsx`;

  // Save the file
  XLSX.writeFile(workbook, fileName);
}