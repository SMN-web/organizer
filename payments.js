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
    }
  ];
  let selectedFriend = 0; // Demo: single friend open

  // Local state for each transaction (simulate backend but stays in-browser)
  let timelineState = friends[selectedFriend].timeline.map(row => ({...row}));

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${net > 0 ? "" : ""}${Math.abs(net)} QAR</span>`;
  }
  function statusPill(status) {
    if (status === "pending")   return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted")  return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected")  return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }

  function render() {
    container.innerHTML = `
      <div class="paypage-wrap">
        <div class="paypage-padtop"></div>
        <div class="paypage-header-row">
          <span class="paypage-avatar">${friends[selectedFriend].initials}</span>
          <span class="paypage-username">${friends[selectedFriend].name}</span>
          ${netPill(friends[selectedFriend].net)}
        </div>
        <div class="paypage-topspacer"></div>
        <div class="paypage-chat">
          ${timelineState.map((ev, idx) => `
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

    // Accept/reject/cancel logic: change status in-place
    container.querySelectorAll('.bubble-accept').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        timelineState[idx].status = "accepted";
        render();
      }
    });
    container.querySelectorAll('.bubble-reject').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        timelineState[idx].status = "rejected";
        render();
      }
    });
    container.querySelectorAll('.bubble-cancel').forEach(btn =>
      btn.onclick = () => { 
        const idx = Number(btn.dataset.idx);
        timelineState[idx].status = "rejected";
        render();
      }
    );
    container.querySelector('.paypage-btn.pay').onclick = () => alert("Pay (demo)");
    container.querySelector('.paypage-btn.remind').onclick = () => alert("Remind (demo)");
  }
  render();
}
