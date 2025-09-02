export function showPaymentsPanel(container, user) {
  // Date grouping utility
  const DAY_LABELS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function smartDateLabel(rawDate) {
    const now = new Date();
    const todayStr = now.getDate()+" "+now.toLocaleString('en',{month:"short"});
    const yesterday = new Date(Date.now()-86400000);
    const yesterdayStr = yesterday.getDate()+" "+yesterday.toLocaleString('en',{month:"short"});
    if (rawDate === todayStr) return "Today";
    if (rawDate === yesterdayStr) return "Yesterday";
    for(let i=2;i<=7;++i){
      let nd=new Date(Date.now()-i*86400000);
      if(nd.getDate()+" "+nd.toLocaleString('en',{month:"short"})===rawDate)
        return DAY_LABELS[nd.getDay()];
    }
    return rawDate;
  }

  // Demo data
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70, timeline: [
        { dir: "to", status: "pending", amount: 8, date: "9 Jul", time: "12:01 pm" },
        { dir: "to", status: "pending", amount: 6, date: "7 Aug", time: "7:14 am" },
        { dir: "to", status: "accepted", amount: 5, date: "7 Aug", time: "10:05 am" },
        { dir: "from", status: "pending", amount: 14, date: "5 Aug", time: "12:10 pm" }
      ]
    },
    {
      initials: "BA", name: "Bala", net: 120, timeline: [
        { dir: "from", status: "accepted", amount: 120, date: "7 Aug", time: "8:48 am" },
        { dir: "to", status: "pending", amount: 33, date: "2 Jul", time: "02:17 pm" }
      ]
    }
  ];

  const FILTERS = [
    { value: "all", label: "All" },
    { value: "owed", label: "Owed" },
    { value: "get", label: "Received" },
    { value: "settled", label: "Settled" }
  ];

  let view = "friends";
  let current = 0;
  let searchTerm = "";
  let filter = "all";
  let userTimeline = friends.map(f => f.timeline.map(row => ({ ...row })));

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${Math.abs(net)} QAR</span>`;
  }
  function statusPill(status) {
    if (status === "pending") return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted") return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected") return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }
  function filteredFriends() {
    return friends
      .filter(f => searchTerm === "" || f.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(f => {
        if (filter === "all") return true;
        if (filter === "owed") return f.net < 0;
        if (filter === "get") return f.net > 0;
        if (filter === "settled") return f.net === 0;
        return true;
      });
  }

  renderMain();

  function renderMain() {
    if (view === "friends") {
      container.innerHTML = `
        <div class="paypage-wrap">
          <div class="paypage-padding-top"></div>
          <div class="paypage-searchbar-row">
            <input class="paypage-search" autocomplete="off" placeholder="Search friends..." value="">
            <select class="paypage-filter">
              ${FILTERS.map(f => `<option value="${f.value}">${f.label}</option>`).join("")}
            </select>
          </div>
          <div class="paypage-friend-list"></div>
        </div>
      `;
      const searchEl = container.querySelector('.paypage-search');
      searchEl.value = searchTerm;
      setTimeout(() => { searchEl.focus(); searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length); }, 5);

      searchEl.addEventListener("input", e => {
        searchTerm = e.target.value;
        updateFriendList();
      });
      searchEl.addEventListener("focus", e => {
        setTimeout(() => { searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length); }, 3);
      });
      container.querySelector('.paypage-filter').value = filter;
      container.querySelector('.paypage-filter').addEventListener("change", e => {
        filter = e.target.value;
        updateFriendList();
      });
      updateFriendList();
    } else {
      renderUserView();
    }
  }

  function updateFriendList() {
    const flist = filteredFriends();
    const el = container.querySelector('.paypage-friend-list');
    el.innerHTML = flist.length === 0
      ? `<div class="paypage-empty">No friends found.</div>`
      : flist.map((f, i) => `
          <div class="paypage-friend-row" data-idx="${i}">
            <span class="paypage-avatar">${f.initials}</span>
            <span class="paypage-friend-name">${f.name}</span>
            ${netPill(f.net)}
            <span class="paypage-right-arrow">&#8250;</span>
          </div>
        `).join('');
    el.querySelectorAll('.paypage-friend-row').forEach(row =>
      row.onclick = () => {
        const idx = Number(row.dataset.idx);
        current = friends.findIndex(f => f.name === filteredFriends()[idx].name);
        view = "user"; renderUserView();
      }
    );
  }

  function renderUserView() {
    const friend = friends[current];
    const timeline = userTimeline[current];
    let lastDate = "";
    container.innerHTML = `
      <div class="paypage-wrap" style="position:relative">
        <div class="paypage-padding-top"></div>
        <div class="paypage-header-row paypad-extra">
          <button class="paypage-back">&larr;</button>
          <span class="paypage-avatar user">${friend.initials}</span>
          <span class="paypage-username user">${friend.name}</span>
          ${netPill(friend.net)}
          <button class="paypage-more-btn" aria-label="Options">&#8942;</button>
          <div class="paypage-menu" tabindex="-1" style="display:none"></div>
        </div>
        <div class="user-header-divider"></div>
        <div class="paypage-chat">
          ${timeline.map((ev, idx) => {
            let datedisplay = "";
            if (ev.date !== lastDate) {
              datedisplay = `<div class="pay-date-header">${smartDateLabel(ev.date)}</div>`;
              lastDate = ev.date;
            }
            return `
              ${datedisplay}
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
                    <span>${ev.time}</span>
                    ${ev.dir === "to" && ev.status === "pending"
                      ? `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>` : ""}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="paypage-actionsbar">
          <button class="paypage-btn pay">Pay</button>
          <button class="paypage-btn remind">Remind</button>
        </div>
      </div>
    `;
    container.querySelector('.paypage-back').onclick = () => { view = "friends"; renderMain(); };
    container.querySelectorAll('.bubble-accept').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        userTimeline[current][idx].status = "accepted";
        renderUserView();
      }
    });
    container.querySelectorAll('.bubble-reject').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        userTimeline[current][idx].status = "rejected";
        renderUserView();
      }
    });
    container.querySelectorAll('.bubble-cancel').forEach(btn =>
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        userTimeline[current][idx].status = "rejected";
        renderUserView();
      }
    );
    container.querySelector('.paypage-btn.pay').onclick = () => alert("Pay (demo)");
    container.querySelector('.paypage-btn.remind').onclick = () => alert("Remind (demo)");
    // Native three-dot menu logic
    const btn = container.querySelector('.paypage-more-btn');
    const menu = container.querySelector('.paypage-menu');
    btn.onclick = (e) => {
      e.stopPropagation();
      // Position menu
      const rect = btn.getBoundingClientRect();
      menu.innerHTML = `
        <div class="paypage-menu-item">Edit</div>
        <div class="paypage-menu-item">Delete</div>
        <div class="paypage-menu-item">Share</div>
      `;
      menu.style.display = "block";
      menu.style.top = (btn.offsetTop + btn.offsetHeight + 2) + "px";
      menu.style.right = "11px";
      setTimeout(()=>menu.focus(),18);
      menu.onclick = e => e.stopPropagation();
      menu.querySelectorAll('.paypage-menu-item').forEach(item =>
        item.onclick = () => { alert(item.textContent+" (demo)"); menu.style.display="none"; }
      );
      window.addEventListener('click', closeMenuOnce, {capture:true});
      function closeMenuOnce() { menu.style.display="none"; window.removeEventListener('click', closeMenuOnce, {capture:true}); }
    };
  }
}
