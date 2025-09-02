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
        { type: "payment", dir: "from", status: "accepted", amount: 14, date: "2 Aug", time: "12:10 pm" },
        { type: "payment", dir: "to", status: "rejected", amount: 10, date: "1 Aug", time: "04:21 pm" }
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
      <div class="chatpay-main">
        <div style="height:36px"></div>
        <div class="chatpay-friends-list">
          ${friends.map((f, i) => `
            <div class="chatpay-friend-card" data-idx="${i}">
              <div class="chatpay-avatar">${f.initials}</div>
              <div class="chatpay-names">
                <div class="chatpay-friend-name">${f.name}</div>
                <div class="chatpay-friend-balance ${f.net>0?'plus':f.net<0?'minus':'settled'}">
                  ${f.net>0?`+${f.net}`:f.net<0?`–${Math.abs(f.net)}`:"Settled"} QAR
                </div>
              </div>
              <span class="chatpay-arrow">&#8250;</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function chatSession(friend) {
    return `
      <div class="chatpay-detail-wrap">
        <div style="height:30px"></div>
        <div class="chatpay-detail-header">
          <button class="chatpay-back" aria-label="Back">&larr;</button>
          <span class="chatpay-avatar detail">${friend.initials}</span>
          <span class="chatpay-detail-name">${friend.name}</span>
          ${netPill(friend.net)}
        </div>
        <div class="chatpay-chatbox">
          ${friend.timeline.map(ev => `
            <div class="chatpay-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
              <div class="chatpay-bubble-card ${ev.dir === "from" ? "receive" : "send"}">
                <div class="bubble-amt-row">
                  <span class="bubble-amt ${ev.dir === "from" ? "plus" : "minus"}">
                    ${ev.dir === "from" ? "+" : "–"}${ev.amount} QAR
                  </span>
                  <span class="bubble-type">${ev.dir === "from" ? "Received" : "Paid"}</span>
                  ${statusPill(ev.status)}
                </div>
                <div class="bubble-meta-row">
                  <span class="bubble-date">${ev.date}, ${ev.time}</span>
                  ${ev.dir === "to" && ev.status === "pending"
                    ? `<button class="bubble-cancel" title="Cancel payment">Cancel</button>` : ""}
                </div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="chatpay-actionbar-fixed">
          <button class="chatpay-btn pay">Pay</button>
          <button class="chatpay-btn remind">Remind</button>
        </div>
      </div>
    `;
  }

  function render() {
    if (selected === null) {
      container.innerHTML = friendList();
      container.querySelectorAll('.chatpay-friend-card').forEach(row =>
        row.onclick = () => { selected = Number(row.dataset.idx); render(); }
      );
    } else {
      container.innerHTML = chatSession(friends[selected]);
      container.querySelector('.chatpay-back').onclick = () => { selected = null; render(); };
      container.querySelectorAll('.bubble-cancel').forEach(btn =>
        btn.onclick = () => alert("Cancel (demo)")
      );
      container.querySelector('.chatpay-btn.pay').onclick = () => alert("Pay (demo)");
      container.querySelector('.chatpay-btn.remind').onclick = () => alert("Remind (demo)");
    }
  }
  render();
}
