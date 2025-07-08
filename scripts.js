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
