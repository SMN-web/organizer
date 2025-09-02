export function showPaymentsPanel(container, user) {
  const friends = [
    {
      initials: "RA",
      name: "Rafseed",
      net: -70,
      timeline: [
        { type: "payment", dir: "to", status: "pending", amount: 8, date: "9 Jul", time: "12:01 pm" },
        { type: "payment", dir: "to", status: "pending", amount: 6, date: "7 Aug", time: "7:14 am" },
        { type: "payment", dir: "to", status: "accepted", amount: 5, date: "5 Aug", time: "10:05 am" },
        { type: "payment", dir: "to", status: "rejected", amount: 10, date: "4 Aug", time: "04:21 pm" }
      ]
    },
    {
      initials: "BA",
      name: "Bala",
      net: 120,
      timeline: [
        { type: "payment", dir: "from", status: "accepted", amount: 120, date: "7 Aug", time: "8:48 am" }
      ]
    }
  ];

  let selected = null;

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${net > 0 ? "+" : "–"}${Math.abs(net)} QAR</span>`;
  }

  function statusPill(status) {
    if (status === "pending") return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted") return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected") return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }

  function friendList() {
    return `
      <div class="gpay-main-container">
        <div style="height:38px"></div>
        <div class="gpay-friends-list">
          ${friends.map((f, i) => `
            <div class="gpay-friend-row" data-idx="${i}">
              <span class="gpay-friend-avatar">${f.initials}</span>
              <span class="gpay-friend-name">${f.name}</span>
              <span class="gpay-friend-net ${f.net>0?'plus':f.net<0?'minus':'settled'}">
                ${f.net>0?`+${f.net}`:f.net<0?`–${Math.abs(f.net)}`:"Settled"} QAR
              </span>
              <span class="gpay-open">&#8250;</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function detailsPage(friend) {
    return `
      <div class="gpay-detail-section">
        <div style="height:30px"></div>
        <div class="gpay-detail-header">
          <button class="gpay-back" aria-label="Back">&larr;</button>
          <span class="gpay-detail-avatar">${friend.initials}</span>
          <span class="gpay-detail-title">${friend.name}</span>
          ${netPill(friend.net)}
        </div>
        <div class="gpay-detail-cards">
          ${friend.timeline.map(ev => `
            <div class="gpay-card gpay-txn-card ${ev.dir === "from" ? "receive" : "send"}">
              <div class="gpay-txn-head">
                <span class="gpay-txn-type">${ev.dir === "from" ? "Received" : "Paid"}</span>
                <span class="gpay-txn-amt ${ev.dir === "from" ? "plus" : "minus"}">
                  ${ev.dir === "from" ? "+" : "–"}${ev.amount} QAR
                </span>
              </div>
              <div class="gpay-txn-status">${statusPill(ev.status)}</div>
              <div class="gpay-txn-dt">${ev.date}, ${ev.time}</div>
              ${ev.status === "pending" ? '<button class="row-cancel">Cancel</button>' : ''}
            </div>
          `).join("")}
        </div>
        <div class="gpay-actionbar">
          <button class="gpay-abtn pay">Pay</button>
          <button class="gpay-abtn remind">Remind</button>
        </div>
      </div>
    `;
  }

  function render() {
    if (selected === null) {
      container.innerHTML = friendList();
      container.querySelectorAll('.gpay-friend-row').forEach(row => {
        row.onclick = () => { selected = Number(row.dataset.idx); render(); };
      });
    } else {
      container.innerHTML = detailsPage(friends[selected]);
      container.querySelector('.gpay-back').onclick = () => { selected = null; render(); };
      container.querySelectorAll('.row-cancel').forEach(btn =>
        btn.onclick = () => alert("Cancel (demo)")
      );
      container.querySelector('.gpay-abtn.pay').onclick = () => alert("Pay (demo)");
      container.querySelector('.gpay-abtn.remind').onclick = () => alert("Remind (demo)");
    }
  }

  render();
}
