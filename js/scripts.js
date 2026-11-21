class MeetingEntry extends HTMLElement {
  connectedCallback() {
    const date = this.getAttribute("date") || "";
    const title = this.getAttribute("title") || "";
    const presenters = this.getAttribute("presenters") || "";
    const showBy = this.getAttribute("show_by");
    const presenterText = showBy === "no" ? presenters : `by ${presenters}`;

    this.innerHTML = `
      <br>
      <table>
        <tr>
          <td width="20%">${escapeHtml(date)}</td>
          <td>
            ${title ? `<span style="color:chocolate">&laquo;${escapeHtml(title)}&raquo;</span> ` : ""}
            ${escapeHtml(presenterText)}
          </td>
        </tr>
      </table>
    `;
  }
}

customElements.define("meeting-entry", MeetingEntry);
