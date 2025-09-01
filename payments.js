export function showPaymentsPanel(container, user) {
  // DATA & STATE
  const allFriends = Array.from({length:32},(_,i)=>({
    id: i+1,
    name: [
      "Rafseed","Bala","Shyam","Anju","Jose","Deepa","Girish","Narayan","Amit","Ravi",
      "Sunil","Dinesh","Zara","Lini","Sara","Vikram","Ashok","Rupa","Meera","Hari",
      "Manju","Kiran","Priya","Sneha","Geeta","Vinod","Sonia","Karthik","Kavya","Mohan","Prasad","Laila"][i%32],
    net: i%4===0?-70: i%4===1?120: i%4===2?0:-25,
    events: (i===0 ? Array.from({length:18}).map((_,j) =>
        (j % 3 === 0)
        ? { type: "pay", dir: "to", amount: 8, status: "pending", time: `${18-j}m ago` }
        : (j % 3 === 1)
        ? { type: "pay", dir: "to", amount: 5, status: "accepted", time: `${18-j}m ago` }
        : { type: "pay", dir: "to", amount: 10, status: "rejected", time: `${18-j}m ago` }
      ) : [])
  }));
  let filterVal = "all";
  let searchTerm = "";

  const filters = [
    { value: "all", label: "All" },
    { value: "give", label: "You Owe" },
    { value: "get", label: "You Get" },
    { value: "done", label: "Settled" }
  ];

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase() || name.slice(0,2).toUpperCase();
  }

  // ---- MAIN RENDER ----
  function renderList() {
    let friends = allFriends.filter(f => {
      const match = !searchTerm || f.name.toLowerCase().includes(searchTerm);
      if (filterVal === "all") return match;
      if (filterVal === "give") return f.net < 0 && match;
      if (filterVal === "get") return f.net > 0 && match;
      if (filterVal === "done") return f.net === 0 && match;
      return match;
    });

    container.innerHTML = `
      <div class="payx-app-shell">
        <div class="payx-appbar">
          <span class="payx-title">Payments</span>
          <button class="payx-filterbtn" id="payxFilterBtn">
            <span class="payx-filterlabel">${filters.find(f=>f.value===filterVal).label}</span>
            <svg viewBox="0 0 20 20" width="18" height="18" class="payx-dc"><path fill="currentColor" d="M7 8l3 3 3-3z"></path></svg>
          </button>
        </div>
        <div class="payx-search-wrap">
          <input type="text" id="payxSearch" placeholder="Search friends..." class="payx-searchinpt" />
          <button class="payx-addbtn" id="payxAddBtn">+</button>
        </div>
        <div class="payx-friendlist-outer" id="payxFriendList">
          ${
            friends.length === 0
              ? `<div class="payx-empty">No friends found</div>`
              : friends.map(f => `
                <div class="payx-friend-row" data-id="${f.id}">
                  <span class="payx-friend-avatar">${initials(f.name)}</span>
                  <span><span class="payx-friend-name">${f.name}</span>
                  <span class="payx-friend-status">
                    ${f.net > 0 ? `<span class="payx-badge badge-recv">+${f.net} QAR</span>` :
                      f.net < 0 ? `<span class="payx-badge badge-give">${f.net} QAR</span>` :
                      `<span class="payx-badge badge-neut">Settled</span>`}
                  </span></span>
                  <svg class="payx-arrow" width="20" height="20" viewBox="0 0 24 24"><path d="M10 6l6 6-6 6" fill="none" stroke="#a6b0cd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              `).join("")
          }
        </div>
        <div id="payxFilterMenu" class="payx-fmenu">${filters.map(f=>`
          <div class="payx-fmenu-item${filterVal===f.value?" active":""}" data-f="${f.value}">${f.label}</div>
        `).join("")}</div>
      </div>
    `;

    // Event wiring
    container.querySelector("#payxSearch").value = searchTerm;
    container.querySelector("#payxSearch").oninput = e => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderList();
      setTimeout(() => {
        const s = container.querySelector("#payxSearch");
        if(s) s.focus();
      },0);
    };
    container.querySelector("#payxFilterBtn").onclick = () => {
      let m = container.querySelector("#payxFilterMenu");
      m.style.display = m.style.display === "block" ? "none" : "block";
      setTimeout(()=>window.addEventListener("click", closeFilterMenu, { once:true }),5);
    };
    function closeFilterMenu(e) {
      if (!e || !e.target.classList.contains('payx-fmenu-item'))
        container.querySelector("#payxFilterMenu").style.display = "none";
    }
    container.querySelectorAll(".payx-fmenu-item").forEach(it=>{
      it.onclick = ()=>{filterVal=it.dataset.f;renderList();}
    });
    container.querySelectorAll(".payx-friend-row").forEach(row => {
      row.onclick = () => renderDetail(Number(row.dataset.id));
    });
    container.querySelector("#payxAddBtn").onclick = () => alert("Add friend (demo)");
  }

  function renderDetail(fid) {
    const friend = allFriends.find(f => f.id === fid);
    container.innerHTML = `
      <div class="payx-detail-modal">
        <div class="payx-detail-topbar">
          <button class="payx-backbtn" id="payxBackBtn"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M17 12H7m6-6-6 6 6 6" fill="none" stroke="#263056" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span class="payx-friend-avatar">${initials(friend.name)}</span>
          <span>
            <span class="payx-modal-name">${friend.name}</span>
            <span class="payx-modal-badge ${friend.net > 0 ? "badge-recv" : friend.net < 0 ? "badge-give" : "badge-neut"}">
              ${friend.net > 0 ? "+" + friend.net + " QAR" : friend.net < 0 ? friend.net + " QAR" : "Settled"}
            </span>
          </span>
        </div>
        <div class="payx-detail-history-outer">
          <div class="payx-detail-history-scroll">
          ${
            friend.events && friend.events.length
              ? friend.events.map(ev => chatBubble(ev, friend)).join('')
              : `<div class="payx-empty">No transactions yet.</div>`
          }
          </div>
        </div>
        <div class="payx-detail-footer">
          ${
            friend.net < 0
              ? `<button class="payx-detail-paybtn" id="payxDetailPayBtn">Pay</button>`
              : ""
          }
        </div>
      </div>
    `;
    container.querySelector("#payxBackBtn").onclick = () => renderList();
    if (container.querySelector("#payxDetailPayBtn")) {
      container.querySelector("#payxDetailPayBtn").onclick = () => alert("Demo Pay action");
    }
  }

  function chatBubble(ev, friend) {
    if (ev.type === "settled")
      return `<div class="payx-bubble payx-bubble-settled">Settled up (${ev.time})</div>`;
    let what = ev.dir === "from" ? `${friend.name} paid you` : `You paid ${friend.name}`;
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
    return `<div class="payx-bubble ${colorClass}">
      <div>
        <b>${what} ${ev.amount} QAR</b>
        ${statusTxt ? `<span class="payx-bubble-status">${statusTxt}</span>` : ""}
      </div>
      <div class="payx-bubble-meta">${ev.time}</div>
    </div>`;
  }

  // First render
  renderList();
}
