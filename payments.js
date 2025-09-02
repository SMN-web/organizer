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
      <div class="pay-main">
        <div style="height:36px"></div>
        <div class="pay-friends-list">
          ${friends.map((f, i) => `
            <div class="pay-friend-card" data-idx="${i}">
              <div class="pay-avatar">${f.initials}</div>
              <div class="pay-names">
                <div class="pay-friend-name">${f.name}</div>
                <div class="pay-friend-balance ${f.net>0?'plus':f.net<0?'minus':'settled'}">
                  ${f.net>0?`+${f.net}`:f.net<0?`–${Math.abs(f.net)}`:"Settled"} QAR
                </div>
              </div>
              <span class="pay-arrow">&#8250;</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function detailsPage(friend) {
    return `
      <div class="pay-detail-wrap">
        <div style="height:30px"></div>
        <div class="pay-detail-header">
          <button class="pay-back" aria-label="Back">&larr;</button>
          <span class="pay-avatar detail">${friend.initials}</span>
          <span class="pay-detail-name">${friend.name}</span>
          ${netPill(friend.net)}
        </div>
        <div class="pay-txn-list">
          ${friend.timeline.map(ev => `
            <div class="pay-txn-card ${ev.dir === "from" ? "receive" : "send"}">
              <div class="pay-txn-row">
                <div>
                  <span class="pay-txn-type">${ev.dir === "from" ? "Received" : "Paid"}</span>
                  <span class="pay-txn-amt ${ev.dir === "from" ? "plus" : "minus"}">
                    ${ev.dir === "from" ? "+" : "–"}${ev.amount} QAR
                  </span>
                </div>
                <span class="pay-txn-status-row">
                  ${statusPill(ev.status)}
                  ${ev.status === "pending"
                    ? `<button class="pay-txn-cancel">Cancel</button>` : ""}
                </span>
              </div>
              <div class="pay-txn-meta">
                <span class="pay-txn-dt">${ev.date}, ${ev.time}</span>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="pay-actionbar-fixed">
          <button class="pay-btn pay">Pay</button>
          <button class="pay-btn remind">Remind</button>
        </div>
      </div>
    `;
  }

  function render() {
    if (selected === null) {
      container.innerHTML = friendList();
      container.querySelectorAll('.pay-friend-card').forEach(row =>
        row.onclick = () => { selected = Number(row.dataset.idx); render(); }
      );
    } else {
      container.innerHTML = detailsPage(friends[selected]);
      container.querySelector('.pay-back').onclick = () => { selected = null; render(); };
      container.querySelectorAll('.pay-txn-cancel').forEach(btn =>
        btn.onclick = () => alert("Cancel (demo)")
      );
      container.querySelector('.pay-btn.pay').onclick = () => alert("Pay (demo)");
      container.querySelector('.pay-btn.remind').onclick = () => alert("Remind (demo)");
    }
  }

  render();
}
