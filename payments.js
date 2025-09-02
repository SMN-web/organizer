export function showPaymentsPanel(container, user) {
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70, timeline: [
        { dir: "to", status: "pending", amount: 8, date: "9 Jul", time: "12:01 pm" },
        { dir: "to", status: "pending", amount: 6, date: "7 Aug", time: "7:14 am" },
        { dir: "to", status: "accepted", amount: 5, date: "5 Aug", time: "10:05 am" },
        { dir: "from", status: "accepted", amount: 14, date: "2 Aug", time: "12:10 pm" },
        { dir: "to", status: "rejected", amount: 10, date: "1 Aug", time: "04:21 pm" }
      ]
    },
    {
      initials: "BA", name: "Bala", net: 120, timeline: [
        { dir: "from", status: "accepted", amount: 120, date: "7 Aug", time: "8:48 am" }
      ]
    }
  ];

  const FILTERS = [
    { value: "all",   label: "All" },
    { value: "owed",  label: "Owed" },
    { value: "get",   label: "Received" },
    { value: "settled", label: "Settled" }
  ];

  let selected = 0; // for this demo, always 1 friend open, could toggle if needed
  let searchTerm = "";
  let filter = "all";

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${net > 0 ? "" : ""}${Math.abs(net)} QAR</span>`;
  }

  function statusPill(status) {
    if (status === "pending") return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted") return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected") return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }

  function filterTimeline(timeline) {
    return timeline.filter(ev => {
      if (filter === "all") return true;
      if (filter === "owed") return ev.dir === "to";
      if (filter === "get") return ev.dir === "from";
      if (filter === "settled") return ev.status === "accepted" && Math.abs(ev.amount) === 0;
      return true;
    }).filter(ev =>
      searchTerm === "" || ("" + ev.amount).includes(searchTerm)
    );
  }

  function render() {
    const friend = friends[selected];
    const timeline = filterTimeline(friend.timeline);

    container.innerHTML = `
      <div class="paypage-wrap">
        <div class="paypage-padtop"></div>
        <div class="paypage-header-row">
          <span class="paypage-avatar">${friend.initials}</span>
          <span class="paypage-username">${friend.name}</span>
          ${netPill(friend.net)}
        </div>
        <div class="paypage-searchbar-row">
          <input class="paypage-search" placeholder="Search payments..." value="${searchTerm}" />
          <select class="paypage-filter">
            ${FILTERS.map(f=>`<option value="${f.value}"${filter===f.value?" selected":""}>${f.label}</option>`).join("")}
          </select>
        </div>
        <div class="paypage-chat">
          ${timeline.map(ev => `
            <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
              <div class="paypage-bubble ${ev.dir === "from" ? "bubble-recv" : "bubble-send"}">
                <div>
                  <span class="bubble-amt ${ev.dir==="from"?"amt-recv":"amt-send"}">${ev.amount} QAR</span>
                  <span class="bubble-label">${ev.dir==="from"?"Received":"Paid"}</span>
                  ${statusPill(ev.status)}
                </div>
                <div class="bubble-meta">
                  <span>${ev.date}, ${ev.time}</span>
                  ${ev.dir === "to" && ev.status === "pending"
                    ? '<button class="bubble-cancel">Cancel</button>' : ""}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="paypage-actionsbar">
          <button class="paypage-btn pay">Pay</button>
          <button class="paypage-btn remind">Remind</button>
        </div>
      </div>
    `;

    // Interactivity
    container.querySelector('.paypage-search').oninput = e => { searchTerm = e.target.value; render(); };
    container.querySelector('.paypage-filter').onchange = e => { filter = e.target.value; render(); };
    container.querySelectorAll('.bubble-cancel').forEach(btn =>
      btn.onclick = () => alert("Cancel (demo)")
    );
    container.querySelector('.paypage-btn.pay').onclick = () => alert("Pay (demo)");
    container.querySelector('.paypage-btn.remind').onclick = () => alert("Remind (demo)");
  }
  render();
}
