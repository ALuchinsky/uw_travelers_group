  class MeetingEntry extends HTMLElement {
    connectedCallback() {
      const date = this.getAttribute('date');
      const title = this.getAttribute('title');
      const presenters = this.getAttribute('presenters');
      this.innerHTML = `
        <br>
        <table>
            <tr>
                <td width="20%">${date}</td>
                <td><span style="color:chocolate">${title}</span> ${presenters}</td>
            </tr>
        </table>
      `;
    }
  }
  customElements.define('meeting-entry', MeetingEntry);
