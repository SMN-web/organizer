export function showPaymentsPanel(container, user) {
  // Demo: 32 friend rows for pagination
  const allFriends = Array.from({length:32},(_,i)=>({
    id: i+1,
    name: ["Rafseed","Bala","Shyam","Anju","Jose","Deepa","Girish","Narayan","Amit","Ravi","Sunil","Dinesh","Zara","Lini","Sara",
           "Vikram","Ashok","Rupa","Meera","Hari","Manju","Kiran","Priya","Sneha","Geeta","Vinod","Sonia","Karthik","Kavya","Mohan","Prasad","Laila"][i%32],
    net: i%4===0?-70: i%4===1?120: i%4===2?0:-25,
    events: (i===0 ? Array.from({length:21}).map((_,j) =>
        (j % 3 === 0)
        ? { type: "pay", dir: "to", amount: 5, status: "accepted", time: `${21-j}m ago` }
        : (j % 3 === 1)
        ? { type: "pay", dir: "to", amount: 10, status: "rejected", time: `${21-j}m ago` }
        : { type: "pay", dir: "to", amount: 8, status: "pending", time: `${21-j}m ago` }
      ) : [])
  }));

  const filters = [
    { value: "all", label: "All" },
    { value: "give", label: "You Owe" },
    { value: "get", label: "You Get" },
    { value: "done", label: "Settled" }
  ];

  const PAGE_SIZE = 15;
  let currentPage = 0;
  let searchTerm = "", filterVal = "all";

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase() || name.slice(0,2).toUpperCase();
  }

  function renderListUI(pg = 0, filterText = "", filtVal = "all") {
    searchTerm = filterText; filterVal = filtVal; currentPage = pg;
    const friends = allFriends.filter(f => {
      const match = !filterText || f.name.toLowerCase().includes(filterText);
      if (filtVal === "all") return match;
      if (filtVal === "give") return f.net < 0 && match;
      if (filtVal === "get") return f.net > 0 && match;
      if (filtVal === "done") return f.net === 0 && match;
      return match;
    });
    const totalPages = Math.ceil(friends.length / PAGE_SIZE);
    const pgFriends = friends.slice(pg*PAGE_SIZE, (pg+1)*PAGE_SIZE);
    container.innerHTML = `
      <div class="pay-ui-friends">
        <div style="height:36px; width:100%;"></div>
        <div class="pay-ui-row-main" style="margin-top:0.6em;">
          <input type="text" id="payFriendSearch" class="pay-ui-searchinpt" placeholder="Search friend..." autocomplete="off" />
          <div class="pay-ui-filter-dropdown-wrap">
            <select id="payFriendFilter" class="pay-ui-filter-dropdown">
              ${filters.map(f => `<option value="${f.value}"${f.value===filterVal?" selected":""}>${f.label}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="pay-ui-friend-list">
          ${
            pgFriends.length
              ? pgFriends.map(f =>
                `<div class="pay-ui-friend-row" data-id="${f.id}">
                    <span class="pay-ui-friend-avatar">${initials(f.name)}</span>
                    <span class="pay-ui-friend-name">${f.name}</span>
                    <span class="pay-ui-friend-net ${f.net > 0 ? "receivable" : f.net < 0 ? "payable" : "settled"}">
                      ${f.net > 0 ? '+'+f.net+' QAR' : f.net < 0 ? f.net+' QAR' : 'Settled'}
                    </span>
                </div>`
              ).join('')
            : '<div style="padding:16px;text-align:center;color:#888;">No friends found</div>'
          }
        </div>
        <div class="pay-ui-pagination-bar">
          ${pg > 0 ? '<button class="pay-ui-pagebtn" id="payUiPrevPage">Prev</button>' : ''}
          <span class="pay-ui-pgtext">${pg+1} of ${totalPages||1}</span>
          ${pg < totalPages-1 ? '<button class="pay-ui-pagebtn" id="payUiNextPage">Next</button>' : ''}
        </div>
        <div class="pay-ui-panel-bg" id="payUiPanelBg" style="display:none;"></div>
      </div>
    `;
    container.querySelector("#payFriendSearch").value = searchTerm;
    container.querySelector("#payFriendSearch").oninput = e =>
      renderListUI(0, e.target.value.trim().toLowerCase(), container.querySelector("#payFriendFilter").value);
    container.querySelector("#payFriendFilter").value = filterVal;
    container.querySelector("#payFriendFilter").onchange = e =>
      renderListUI(0, container.querySelector("#payFriendSearch").value.trim().toLowerCase(), e.target.value);
    if(container.querySelector("#payUiPrevPage")) container.querySelector("#payUiPrevPage").onclick = ()=>renderListUI(pg-1, searchTerm, filterVal);
    if(container.querySelector("#payUiNextPage")) container.querySelector("#payUiNextPage").onclick = ()=>renderListUI(pg+1, searchTerm, filterVal);
    container.querySelectorAll(".pay-ui-friend-row").forEach(row => {
      row.onclick = () => {
        showFriendPanel(Number(row.dataset.id));
      };
    });
  }

  function showFriendPanel(fid) {
    const friend = allFriends.find(f => f.id === fid);
    const bg = container.querySelector(".pay-ui-panel-bg");
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
            friend.events && friend.events.length
              ? friend.events.map(ev => chatBubble(ev, friend)).join('')
              : `<div class="pay-ui-history-none">No transactions yet.</div>`
          }
        </div>
        <div class="pay-ui-sheet-bottom-bar">
          ${
            friend.net < 0
              ? `<button class="pay-ui-pay-btn" id="payUiOpenPay">Pay</button>`
              : ""
          }
        </div>
      </div>
      <div id="payUiModal" class="pay-ui-modal" style="display:none;"></div>
    `;
    bg.style.display = "flex";
    bg.querySelector("#payUiClose").onclick = () => bg.style.display = "none";
    if(bg.querySelector("#payUiOpenPay")) bg.querySelector("#payUiOpenPay").onclick = () => showPayModal(friend);
  }

  function chatBubble(ev, friend) {
    if (ev.type === "settled")
      return `<div class="pay-ui-bubble pay-ui-bubble-settled">Settled up (${ev.time})</div>`;
    let what = ev.dir === "from"
        ? `${friend.name} paid you`
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
