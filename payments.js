export function showPaymentsPanel(container, user) {
  const friends = [
    { id: 1, name: "Rafseed", net: -70, events: [
      {type:"pay", dir:"to", amount:40, status:"accepted", time:"3d ago"},
      {type:"pay", dir:"to", amount:30, status:"rejected", time:"9d ago"}
    ]},
    { id: 2, name: "Bala", net: 120, events: [
      {type:"pay", dir:"from", amount:88, status:"accepted", time:"1d ago"},
      {type:"pay", dir:"to", amount:120, status:"pending", time:"just now"}
    ]},
    { id: 3, name: "Shyam", net: 0, events: [
      {type:"settled", time:"6d ago"}
    ]},
    { id: 4, name: "Anju", net: -25, events: [
      {type:"pay", dir:"to", amount:25, status:"pending", time:"now"},
    ]}
  ];

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase() || name.slice(0,2).toUpperCase();
  }

  function renderListUI(filter="") {
    container.innerHTML = `
      <div class="pay-ui-friends">
        <div class="pay-ui-search">
          <input type="text" id="payFriendSearch" placeholder="Search friend..." autocomplete="off" />
        </div>
        <div class="pay-ui-friend-list">
          ${
            friends
              .filter(f => !filter || f.name.toLowerCase().includes(filter))
              .map(f =>
                `<div class="pay-ui-friend-row" data-id="${f.id}">
                  <span class="pay-ui-friend-avatar">${initials(f.name)}</span>
                  <span class="pay-ui-friend-name">${f.name}</span>
                  <span class="pay-ui-friend-net ${f.net > 0 ? "receivable" : f.net < 0 ? "payable" : "settled"}">
                    ${f.net > 0 ? '+'+f.net+' QAR' : f.net < 0 ? f.net+' QAR' : 'Settled'}
                  </span>
                </div>`
              ).join('')
          }
        </div>
      </div>
      <div class="pay-ui-panel-bg" id="payUiPanelBg" style="display:none;"></div>
    `;
    container.querySelector("#payFriendSearch").oninput = e =>
      renderListUI(e.target.value.trim().toLowerCase());
    container.querySelectorAll(".pay-ui-friend-row").forEach(row => {
      row.onclick = () => showFriendPanel(Number(row.dataset.id));
    });
  }

  function showFriendPanel(fid) {
    const friend = friends.find(f=>f.id===fid);
    const bg = container.querySelector("#payUiPanelBg");
    bg.innerHTML = `
      <div class="pay-ui-sheet-panel">
        <button class="pay-ui-panel-x" id="payUiClose">&times;</button>
        <div class="pay-ui-sheet-header">
          <span class="pay-ui-friend-avatar">${initials(friend.name)}</span>
          <span class="pay-ui-sheet-name">${friend.name}</span>
        </div>
        <div class="pay-ui-sheet-owed">
          ${friend.net > 0
            ? `To receive: <span class="receivable">${friend.net} QAR</span>`
            : friend.net < 0
              ? `You owe: <span class="payable">${Math.abs(friend.net)} QAR</span>`
              : `<span class="settled">All settled!</span>`
          }
        </div>
        <div class="pay-ui-sheet-history" id="payUiHistory">
          ${
            friend.events.length
              ? friend.events.map(ev => chatBubble(ev, friend)).join('')
              : `<div class="pay-ui-history-none">No transactions yet.</div>`
          }
        </div>
        ${
          friend.net<0
            ? `<button class="pay-ui-pay-btn" id="payUiOpenPay">Pay</button>`
            : ''
        }
        <div class="pay-ui-bottom-gap"></div>
      </div>
      <div id="payUiModal" class="pay-ui-modal" style="display:none;"></div>
    `;
    bg.style.display = "flex";
    bg.querySelector("#payUiClose").onclick = () => bg.style.display = "none";
    const payBtn = bg.querySelector("#payUiOpenPay");
    if(payBtn) payBtn.onclick = () => showPayModal(friend);
  }

  function chatBubble(ev, friend) {
    if (ev.type === "settled")
      return `<div class="pay-ui-bubble pay-ui-bubble-settled">Settled up (${ev.time})</div>`;
    let who = ev.dir === "from" ? friend.name : "You";
    let what = ev.dir === "from"
      ? `${who} paid you`
      : `You paid ${friend.name}`;
    let colorClass =
      ev.status === "accepted" ? "accepted"
      : ev.status === "rejected" ? "rejected"
      : ev.status === "pending" ? "pending"
      : "";
    let statusTxt =
      ev.status === "pending" ? "Awaiting action"
      : ev.status === "accepted" ? "Accepted"
      : ev.status === "rejected" ? "Rejected"
      : "";
    return `<div class="pay-ui-bubble ${colorClass}">
      <div>
        <b>${what} ${ev.amount} QAR</b>
        ${statusTxt ? `<span class="pay-ui-bubble-status">${statusTxt}</span>` : ""}
      </div>
      <div class="pay-ui-bubble-meta">${ev.time}</div>
    </div>`;
  }

  function showPayModal(friend){
    const modal = container.querySelector("#payUiModal");
    modal.innerHTML = `
      <div class="pay-ui-modal-content">
        <div class="pay-ui-modal-owed">You owe ${Math.abs(friend.net)} QAR</div>
        <input type="number" min="1" max="${Math.abs(friend.net)}" id="payUiAmount" class="pay-ui-modal-inpt" placeholder="Enter amount"/>
        <button class="pay-ui-modal-ok" id="payUiDoPay">Pay Now</button>
      </div>
    `;
    modal.style.display = "flex";
    modal.querySelector("#payUiDoPay").onclick = () => {
      const amt = Number(modal.querySelector("#payUiAmount").value||0);
      if(!amt || amt < 1 || amt > Math.abs(friend.net)){
        modal.querySelector("#payUiAmount").style.borderColor="#d33";
        return;
      }
      modal.innerHTML = `<div style="margin:35px auto; color:#129c55;">Paid ${amt} QAR! (demo)</div>`;
      setTimeout(()=>modal.style.display="none",1300);
    };
  }

  renderListUI();
}
