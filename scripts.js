  class MeetingEntry extends HTMLElement {
    connectedCallback() {
      const date = this.getAttribute('date');
      const title = this.getAttribute('title');
      var presenters = this.getAttribute('presenters');
      const show_by = this.getAttribute("show_by")
      if(show_by !="no" && show_by != false) {
        presenters = "by " + presenters
      }
        this.innerHTML = `
        <br>
        <table>
            <tr>
            <td width="20%">${date}</td>
            <td>
                ${title ? `<span style="color:chocolate">&laquo;${title}&raquo;</span> ` : ''}
                ${presenters}
            </td>
            </tr>
        </table>
        `;
    }
  }
  customElements.define('meeting-entry', MeetingEntry);


function renderScheduleTable(data) {
  const container = document.getElementById("schedule-table");

  let html = '<table border="1" cellpadding="5" cellspacing="0">';
  html += '<thead><tr><th>Date</th><th>Hosts</th><th>Presenters</th><th>Topic</th></tr></thead><tbody>';

  data.forEach((entry, rowIndex) => {
    html += '<tr>';

    ['Date', 'Hosts', 'Presenters', 'Topic'].forEach((key) => {
      html += `<td ondblclick="handleCellDoubleClick('${key}', ${rowIndex})">
        ${entry[key] || ''}
      </td>`;
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

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
    schedule_data = data
    console.log("data = ", data)
    renderScheduleTable(schedule_data); // ✅ call render after loading
}

function handleCellDoubleClick(column, rowIndex) {
  const value = schedule_data[rowIndex][column];
  alert(`Double-clicked on: ${column} = "${value}" (row ${rowIndex + 1})`);
  schedule_data[rowIndex][column] = "clicked"
  // Optional: add editing logic here later
  renderScheduleTable(schedule_data);
}