export function showPaymentsPanel(container, user) {
  // --- DEMO DATA (Insert API data here in production)
  const friends = [
    {
      id: 1,
      name: "Rafseed",
      net: -70,
      events: [
        { type: "pay", dir: "to", amount: 40, status: "accepted", time: "3d ago" },
        { type: "pay", dir: "to", amount: 30, status: "rejected", time: "9d ago" }
      ]
    },
    {
      id: 2,
      name: "Bala",
      net: 120,
      events: [
        { type: "pay", dir: "from", amount: 88, status: "accepted", time: "1d ago" },
        { type: "pay", dir: "to", amount: 120, status: "pending", time: "just now" }
      ]
    },
    {
      id: 3,
      name: "Shyam",
      net: 0,
      events: [
        { type: "settled", time: "6d ago" }
      ]
    },
    {
      id: 4,
      name: "Anju",
      net: -25,
      events: [
        { type: "pay", dir: "to", amount: 10, status: "accepted", time: "8d ago" },
        { type: "pay", dir: "to", amount: 15, status: "pending", time: "now" }
      ]
    }
  ];

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase() || name.slice(0,2).toUpperCase();
  }

  function renderListUI(filter = "", tabType = "all") {
    container.innerHTML = `
      <div class="pay-ui-friends" style="margin-top:64px;">
        <div class="pay-ui-head-row">
          <div class="pay-ui-search" style="flex:1;">
            <input type="text" id="payFriendSearch" class="pay-ui-searchinpt" placeholder="Search friend..." autocomplete="off" />
          </div>
          <div class="pay-ui-filter-row">
            <button class="pay-ui-filter${tabType === "all" ? " active" : ""}" data-type="all">All</button>
            <button class="pay-ui-filter${tabType === "give" ? " active" : ""}" data-type="give">You Owe</button>
            <button class="pay-ui-filter${tabType === "get" ? " active" : ""}" data-type="get">You Get</button>
            <button class="pay-ui-filter${tabType === "done" ? " active" : ""}" data-type="done">Settled</button>
          </div>
        </div>
        <div class="pay-ui-friend-list">
          ${
            friends
              .filter(f => {
                const match = !filter || f.name.toLowerCase().includes(filter);
                if (tabType === "all") return match;
                if (tabType === "give") return f.net < 0 && match;
                if (tabType === "get") return f.net > 0 && match;
                if (tabType === "done") return f.net === 0 && match;
                return match;
              })
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
        <div class="pay-ui-panel-bg" id="payUiPanelBg" style="display:none;"></div>
      </div>
    `;

    container.querySelector("#payFriendSearch").oninput = e =>
      renderListUI(e.target.value.trim().toLowerCase(), tabType);

    Array.from(container.querySelectorAll('.pay-ui-filter')).forEach(btn => {
      btn.onclick = () => {
        renderListUI(
          container.querySelector("#payFriendSearch").value.trim().toLowerCase(),
          btn.dataset.type
        );
      };
    });

    container.querySelectorAll(".pay-ui-friend-row").forEach(row => {
      row.onclick = () => showFriendPanel(Number(row.dataset.id));
    });
  }

  function showFriendPanel(fid) {
    const friend = friends.find(f => f.id === fid);
    const bg = container.querySelector("#payUiPanelBg");
    bg.innerHTML = `
      <div class="pay-ui-sheet-panel pay-ui-sheet-panel-fixed">
        <button class="pay-ui-panel-x" id="payUiClose">&times;</button>
        <div class="pay-ui-sheet-headerrow">
          <div class="pay-ui-sheet-header">
            <span class="pay-ui-friend-avatar">${initials(friend.name)}</span>
            <span class="pay-ui-sheet-name">${friend.name}</span>
          </div>
          <span class="pay-ui-sheet-badge ${friend.net > 0 ? "receivable" : friend.net < 0 ? "payable" : "settled"}">
            ${friend.net > 0 ? ("+" + friend.net + " QAR") : friend.net < 0 ? (friend.net + " QAR") : "Settled"}
          </span>
        </div>
        <div class="pay-ui-sheet-history pay-ui-sheet-history-scroll">
          ${
            friend.events.length
              ? friend.events.map(ev => chatBubble(ev, friend)).join('')
              : `<div class="pay-ui-history-none">No transactions yet.</div>`
          }
        </div>
        <div class="pay-ui-sheet-bottom">
          ${
            friend.net < 0
              ? `<button class="pay-ui-pay-btn" id="payUiOpenPay">Pay</button>`
              : ""
          }
        </div>
        <div class="pay-ui-bottom-gap"></div>
      </div>
      <div id="payUiModal" class="pay-ui-modal" style="display:none;"></div>
    `;
    bg.style.display = "flex";
    bg.querySelector("#payUiClose").onclick = () => bg.style.display = "none";
    const payBtn = bg.querySelector("#payUiOpenPay");
    if (payBtn) payBtn.onclick = () => showPayModal(friend);
  }

  function chatBubble(ev, friend) {
    if (ev.type === "settled")
      return `<div class="pay-ui-bubble pay-ui-bubble-settled">Settled up (${ev.time})</div>`;
    let who = ev.dir === "from" ? friend.name : "You";
    let what =
      ev.dir === "from"
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

  function showPayModal(friend) {
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
      const amt = Number(modal.querySelector("#payUiAmount").value || 0);
      if (!amt || amt < 1 || amt > Math.abs(friend.net)) {
        modal.querySelector("#payUiAmount").style.borderColor = "#d33";
        return;
      }
      modal.innerHTML = `<div style="margin:35px auto; color:#129c55;">Paid ${amt} QAR! (demo)</div>`;
      setTimeout(() => { modal.style.display = "none"; }, 1200);
    };
  }

  renderListUI();
}
