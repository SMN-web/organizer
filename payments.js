export function showPaymentsPanel(container, user) {
  const friend = {
    initials: "RA",
    name: "Rafseed",
    net: -70,
    events: [
      { amount: 8, dir: "to", type: "paid", status: "pending",  time: "7m ago" },
      { amount: 6, dir: "to", type: "paid", status: "pending",  time: "14m ago" },
      { amount: 5, dir: "to", type: "paid", status: "accepted", time: "21m ago" },
      { amount: 10, dir: "to", type: "paid", status: "rejected", time: "25m ago" }
    ]
  }

  function netPill(net) {
    if(net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${net > 0 ? "+" : "–"}${Math.abs(net)} QAR</span>`;
  }

  function statusPill(status) {
    if(status === "pending")   return `<span class="status-pill pending">Pending</span>`;
    if(status === "accepted")  return `<span class="status-pill accepted">Accepted</span>`;
    if(status === "rejected")  return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }

  container.innerHTML = `
    <div class="ledger-modal">
      <div class="ledger-summary">
        <button class="ledger-back">&larr;</button>
        <span class="ledger-avatar">${friend.initials}</span>
        <span class="ledger-title">${friend.name} ${netPill(friend.net)}</span>
        <button class="ledger-remind">Remind</button>
      </div>
      <div class="ledger-history-section">
        <div class="ledger-history-title">Transaction History</div>
        <div class="ledger-list">
          ${friend.events.map(event=>`
            <div class="ledger-row">
              <span class="amt minus">–${event.amount} QAR</span>
              <span class="type paid">Paid</span>
              ${statusPill(event.status)}
              <span class="meta">${event.time}</span>
              ${event.status==="pending"?'<button class="row-cancel">Cancel</button>':''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
