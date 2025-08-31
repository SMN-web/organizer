export function showPaymentsPanel(container, user) {
  // --- DEMO DATA (Replace with real API later)
  const friends = [
    { id: 1, name: "Rafseed", amount: -70, last: { type: "paid", amount: 40, when: "3d ago" } },
    { id: 2, name: "Bala", amount: 120, last: { type: "received", amount: 88, when: "1d ago" } },
    { id: 3, name: "Shyam", amount: 0, last: { type: "settled", when: "6d ago" } },
    { id: 4, name: "Anju", amount: -25, last: { type: "pending", amount: 25, when: "now" }, pending: true }
  ];

  // Helper for initial avatar
  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase() || name.slice(0,2).toUpperCase();
  }

  container.innerHTML = `
    <div class="pay-main">
      <div class="pay-head">Payments & Settlements</div>
      <div class="friends-card-row">
        ${
          friends.map(friend => `
            <div class="friend-card" data-id="${friend.id}">
              <span class="friend-avatar">${initials(friend.name)}</span>
              <span class="friend-name">${friend.name}</span>
              <span class="friend-balance ${
                  friend.amount > 0 ? "bal-positive" : friend.amount < 0 ? "bal-negative" : "bal-neutral"
                }">
                ${friend.amount > 0 
                    ? '+' + friend.amount + ' QAR'
                    : friend.amount < 0
                      ? friend.amount + ' QAR'
                      : "Settled"}
              </span>
              ${
                friend.pending
                ? `<span class="friend-status pending">Pending payment approval</span>`
                : ''
              }
              <span class="friend-history">
                ${
                  friend.last
                  ? friend.last.type === "paid"
                    ? `You paid ${friend.amount < 0 ? friend.name : ""} ${friend.last.amount} QAR • ${friend.last.when}`
                    : friend.last.type === "received"
                      ? `Received ${friend.last.amount} QAR • ${friend.last.when}`
                      : friend.last.type === "pending"
                        ? `Requested ${friend.last.amount} QAR • ${friend.last.when}`
                        : `Settled ${friend.last.when}`
                  : ""
                }
              </span>
            </div>
          `).join('')
        }
      </div>
      <div class="pay-popup-bg" id="pay-popup-bg" style="display:none;">
        <div class="pay-popup-panel" id="pay-popup-panel"></div>
      </div>
    </div>
  `;

  // Friend card click — open popup
  container.querySelectorAll('.friend-card').forEach(card => {
    card.onclick = () => {
      const fid = Number(card.dataset.id);
      const friend = friends.find(f => f.id === fid);
      showPopupPanel(friend);
    }
  });

  // Show details/payment popup for this friend (edit CSS separately)
  function showPopupPanel(friend) {
    const panel = container.querySelector("#pay-popup-panel");
    const bg = container.querySelector("#pay-popup-bg");
    let message = "";
    const oweMe = friend.amount > 0;
    const oweThem = friend.amount < 0;
    const settled = friend.amount === 0;
    const pending = !!friend.pending;

    panel.innerHTML = `
      <button class="popup-close-btn" id="closePayPanel" title="Close">&times;</button>
      <div class="popup-avatar">${initials(friend.name)}</div>
      <div class="popup-title">${friend.name}</div>
      <div class="popup-balance">
        ${
          oweThem
            ? `You owe <b>${Math.abs(friend.amount)} QAR</b> to ${friend.name}.`
            : oweMe && !pending
              ? `<b>${friend.name}</b> owes you <b>${Math.abs(friend.amount)} QAR</b>.`
              : settled
                ? `<span class="popup-settled">No outstanding balances.</span>`
                : ''
        }
      </div>
      <div class="popup-status">
        ${
          pending
          ? `<div class="pending-info">Waiting for ${friend.name}'s approval for ${Math.abs(friend.amount)} QAR.</div>`
          : ''
        }
      </div>
      <div class="popup-history">
        ${
          friend.last ? `
            <div>Last: ${
              friend.last.type === "paid" ? `You paid ${friend.last.amount} QAR (${friend.last.when})`
              : friend.last.type === "received" ? `Received ${friend.last.amount} QAR (${friend.last.when})`
              : friend.last.type === "pending" ? `Requested ${friend.last.amount} QAR (${friend.last.when})`
              : `Settled ${friend.last.when}`
            }</div>
          ` : ''
        }
      </div>
      <div class="popup-actions">
        ${
          oweThem && !pending
          ? `<input type="number" min="1" max="${Math.abs(friend.amount)}" class="pay-amount-inpt" id="payamt" placeholder="Enter amount"/><br>
             <button class="confirm-btn" id="btnPay">Pay</button>`
          : oweMe && pending
            ? `<button class="confirm-btn" id="btnAccept">Accept</button> <button class="cancel-btn" id="btnReject">Reject</button>`
          : ''
        }
      </div>
      <div class="popup-message" id="popup-message"></div>
    `;
    bg.style.display = "flex";

    // Popup close logic
    panel.querySelector("#closePayPanel").onclick = () => { bg.style.display = 'none'; };

    // Payment logic
    const payBtn = panel.querySelector("#btnPay");
    if (payBtn) payBtn.onclick = () => {
      const val = Number(panel.querySelector("#payamt").value || 0);
      const msg = panel.querySelector("#popup-message");
      if (!val || val < 1 || val > Math.abs(friend.amount)) {
        msg.textContent = "Enter a valid amount.";
        return;
      }
      msg.textContent = `Demo: You paid ${friend.name} ${val} QAR.`;
      setTimeout(()=>bg.style.display='none',1400);
    };
    const acceptBtn = panel.querySelector("#btnAccept");
    if (acceptBtn) acceptBtn.onclick = () => {
      panel.querySelector("#popup-message").textContent = "Payment accepted (demo).";
      setTimeout(()=>bg.style.display='none',1200);
    };
    const rejectBtn = panel.querySelector("#btnReject");
    if (rejectBtn) rejectBtn.onclick = () => {
      panel.querySelector("#popup-message").textContent = "Payment rejected (demo).";
      setTimeout(()=>bg.style.display='none',1200);
    };
  }
}
