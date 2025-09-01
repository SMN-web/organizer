export function showPaymentsPanel(container, user) {
  // Demo friends data—you’ll likely fetch dynamically
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70,
      events: [
        { dir: "to", amount: 8, status: "pending", time: "7m ago" },
        { dir: "to", amount: 5, status: "accepted", time: "6m ago" }
      ]
    },
    {
      initials: "BA", name: "Bala", net: 120,
      events: [ { dir: "to", amount: 15, status: "rejected", time: "6m ago" } ]
    },
    {
      initials: "SH", name: "Shyam", net: 0,
      events: [ { dir: "to", amount: 20, status: "pending", time: "just now" } ]
    }
  ];
  const filters = [
    { value: "all", label: "All" },
    { value: "give", label: "You Owe" },
    { value: "get", label: "You Get" },
    { value: "done", label: "Settled" }
  ];
  let searchTerm = "", filterVal = "all";
  let expanded = null;

  function render() {
    // Filter
    const filtered = friends.filter(f => {
      const match = !searchTerm || f.name.toLowerCase().includes(searchTerm);
      if(filterVal==="all") return match;
      if(filterVal==="give") return f.net<0 && match;
      if(filterVal==="get") return f.net>0 && match;
      if(filterVal==="done") return f.net===0 && match;
      return match;
    });

    container.innerHTML = `
      <div class="bpay-sheet-pad"></div>
      <div class="bpay-root">
        <div class="bpay-searchrow">
          <input class="bpay-search" id="bpaySearch" placeholder="Search..." />
          <select class="bpay-filter" id="bpayFilter">
            ${filters.map(f=>`<option value="${f.value}">${f.label}</option>`).join("")}
          </select>
        </div>
        <div class="bpay-friend-list">
          ${filtered.map((f,i)=>`
            <div class="bpay-friendcard" data-idx="${i}">
              <span class="bpay-avatar">${f.initials}</span>
              <span class="bpay-nblock">
                <span class="bpay-fname">${f.name}</span>
                <span class="bpay-net${f.net>0?' plus':f.net<0?' minus':' settled'}">
                  ${f.net>0?'+':'–'}${Math.abs(f.net)} QAR
                </span>
              </span>
              <span class="bpay-arrow">&#8250;</span>
            </div>
          `).join('')}
        </div>
        <div class="bpay-drawer-ctr">${expanded!==null?friendDrawer(filtered[expanded], expanded):''}</div>
      </div>
    `;

    // Search & filter
    const searchEl = container.querySelector("#bpaySearch");
    searchEl.value = searchTerm;
    searchEl.oninput = e => {searchTerm=e.target.value.toLowerCase(); render();setTimeout(()=>searchEl.focus(),0);};
    container.querySelector("#bpayFilter").value = filterVal;
    container.querySelector("#bpayFilter").onchange = e=>{filterVal = e.target.value; render();};

    // Open drawer
    container.querySelectorAll('.bpay-friendcard').forEach(fc=>{
      fc.onclick=()=>{ expanded = Number(fc.dataset.idx); render();};
    });
    // Drawer close
    if(expanded!==null) container.querySelector('.bpay-close').onclick=()=>{ expanded=null; render();};
  }

  function friendDrawer(friend, idx) {
    const netState = friend.net > 0 ? 'get' : friend.net < 0 ? 'owe' : 'settled';
    return `
      <div class="bpay-drawer-sheet anim-in">
        <button class="bpay-close" aria-label="Back"><span>&larr;</span></button>
        <div class="bpay-drawer-info">
          <span class="bpay-avatar big">${friend.initials}</span>
          <div>
            <div class="bpay-fname big">${friend.name}</div>
            <div class="bpay-net big ${netState}">
              ${friend.net>0?'+':'–'}${Math.abs(friend.net)} QAR
            </div>
            <div class="bpay-badge ${netState}">
              ${netState==="get"?"You Get":netState==="owe"?"You Owe":"Settled"}
            </div>
          </div>
        </div>
        <div class="bpay-drawer-actions">
          <button class="bpay-btn pay">Pay</button>
          <button class="bpay-btn remind">Remind</button>
          <button class="bpay-btn split">Split</button>
        </div>
        <div class="bpay-history">
          ${(friend.events||[]).map(ev=>`
            <div class="bpay-hist-row ${ev.status}">
              <span class="bpay-hist-summary">
                ${ev.dir==="to"?`You paid ${friend.name}`:`${friend.name} paid you`} <strong>${ev.amount} QAR</strong>
              </span>
              <span class="bpay-hist-stat">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
              <span class="bpay-hist-time">${ev.time}</span>
              ${(ev.status==="pending"&&ev.dir==="to")?`<button class="bpay-mini-act cancel">Cancel</button>`:""}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
  render();
}
