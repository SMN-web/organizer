export function showPaymentsPanel(container, user) {
  // Demo data
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70, timeline: [
        { dir: "to", status: "pending", amount: 8, date: "9 Jul", time: "12:01 pm" },
        { dir: "to", status: "pending", amount: 6, date: "7 Aug", time: "7:14 am" },
        { dir: "to", status: "accepted", amount: 5, date: "5 Aug", time: "10:05 am" },
        { dir: "from", status: "pending", amount: 14, date: "2 Aug", time: "12:10 pm" },
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
    { value: "all", label: "All" },
    { value: "owed", label: "Owed" },
    { value: "get", label: "Received" },
    { value: "settled", label: "Settled" }
  ];

  let view = "friends"; // or "user"
  let current = 0;
  let searchTerm = "";
  let filter = "all";
  // Account for stateful "accept/reject" on incoming
  let userTimeline = friends.map(f => f.timeline.map(row => ({ ...row })));

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${Math.abs(net)} QAR</span>`;
  }
  function statusPill(status) {
    if (status === "pending") return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted") return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected") return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }

  function filteredFriends() {
    return friends
      .filter(f => searchTerm === "" || f.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(f => {
        if (filter === "all") return true;
        if (filter === "owed") return f.net < 0;
        if (filter === "get") return f.net > 0;
        if (filter === "settled") return f.net === 0;
        return true;
      });
  }

  function render() {
    if (view === "friends") {
      const flist = filteredFriends();
      container.innerHTML = `
        <div class="paypage-wrap">
          <div class="paypage-padding-top"></div>
          <div class="paypage-searchbar-row">
            <input class="paypage-search" placeholder="Search friends..." value="${searchTerm}">
            <select class="paypage-filter">
              ${FILTERS.map(f => `<option value="${f.value}"${filter===f.value?" selected":""}>${f.label}</option>`).join("")}
            </select>
          </div>
          <div class="paypage-friend-list">
            ${flist.length === 0 ? `<div class="paypage-empty">No friends found.</div>` : flist.map((f, i) => `
              <div class="paypage-friend-row" data-idx="${i}">
                <span class="paypage-avatar">${f.initials}</span>
                <span class="paypage-friend-name">${f.name}</span>
                ${netPill(f.net)}
                <span class="paypage-right-arrow">&#8250;</span>
              </div>
            `).join("")}
          </div>
        </div>
      `;
      // Events
      container.querySelector('.paypage-search').oninput = e => { searchTerm = e.target.value; render(); };
      container.querySelector('.paypage-filter').onchange = e => { filter = e.target.value; render(); };
      container.querySelectorAll('.paypage-friend-row').forEach(row =>
        row.onclick = () => {
          // Friend index in filtered list
          const idx = Number(row.dataset.idx);
          current = friends.findIndex(f => f.name === flist[idx].name);
          view = "user"; render();
        }
      );
    } else {
      const friend = friends[current];
      const timeline = userTimeline[current];
      container.innerHTML = `
        <div class="paypage-wrap">
          <div class="paypage-padding-top"></div>
          <div class="paypage-header-row">
            <button class="paypage-back">&larr;</button>
            <span class="paypage-avatar">${friend.initials}</span>
            <span class="paypage-username">${friend.name}</span>
            ${netPill(friend.net)}
          </div>
          <div class="paypage-chat">
            ${timeline.map((ev, idx) => `
              <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
                <div class="paypage-bubble ${ev.dir === "from" ? "bubble-recv" : "bubble-send"}">
                  <div>
                    <span class="bubble-amt ${ev.dir==="from"?"amt-recv":"amt-send"}">${ev.amount} QAR</span>
                    <span class="bubble-label">${ev.dir==="from"?"Received":"Paid"}</span>
                    ${
                      ev.status !== "pending"
                        ? statusPill(ev.status)
                        : (ev.dir === "from")
                          ? `<button class="bubble-accept" data-idx="${idx}">Accept</button>
                             <button class="bubble-reject" data-idx="${idx}">Reject</button>`
                          : statusPill("pending")
                    }
                  </div>
                  <div class="bubble-meta">
                    <span>${ev.date}, ${ev.time}</span>
                    ${ev.dir === "to" && ev.status === "pending"
                      ? `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>` : ""}
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
      container.querySelector('.paypage-back').onclick = () => { view = "friends"; render(); };

      // Accept/reject/cancel actions (mutate timeline for this session)
      container.querySelectorAll('.bubble-accept').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.idx);
          userTimeline[current][idx].status = "accepted";
          render();
        }
      });
      container.querySelectorAll('.bubble-reject').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.idx);
          userTimeline[current][idx].status = "rejected";
          render();
        }
      });
      container.querySelectorAll('.bubble-cancel').forEach(btn =>
        btn.onclick = () => {
          const idx = Number(btn.dataset.idx);
          userTimeline[current][idx].status = "rejected";
          render();
        }
      );
      container.querySelector('.paypage-btn.pay').onclick = () => alert("Pay (demo)");
      container.querySelector('.paypage-btn.remind').onclick = () => alert("Remind (demo)");
    }
  }
  render();
}
