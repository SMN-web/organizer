export function showPaymentsPanel(container, user) {
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
  let modalIdx = null;

  function render() {
    const filtered = friends.filter(f => {
      const m = !searchTerm || f.name.toLowerCase().includes(searchTerm);
      if (filterVal==="all") return m;
      if (filterVal==="give") return f.net < 0 && m;
      if (filterVal==="get") return f.net > 0 && m;
      if (filterVal==="done") return f.net === 0 && m;
      return m;
    });
    container.innerHTML = `
      <div class="pm-root small">
        <div class="pm-srchrow">
          <input class="pm-search" id="pmSearch" placeholder="Search..." />
          <select class="pm-filter" id="pmFilter">
            ${filters.map(f=>`<option value="${f.value}">${f.label}</option>`).join("")}
          </select>
        </div>
        <div class="pm-flist">
          ${filtered.map((f,i)=>`
            <div class="pm-fcard" data-idx="${i}">
              <span class="pm-avatar">${f.initials}</span>
              <span class="pm-fmeta">
                <span class="pm-fname">${f.name}</span>
                <span class="pm-fnet${f.net>0?' plus':f.net<0?' minus':' settled'}">
                  ${f.net>0?'+':'–'}${Math.abs(f.net)} QAR
                </span>
              </span>
              <span class="pm-arrow">&#8250;</span>
            </div>
          `).join('')}
        </div>
        ${modalIdx!==null ? modalView(filtered[modalIdx]) : ""}
      </div>
    `;
    // Search/filter
    const searchEl = container.querySelector("#pmSearch");
    searchEl.value = searchTerm;
    searchEl.oninput = e => { searchTerm = e.target.value.toLowerCase(); render(); setTimeout(()=>searchEl.focus(),0); };
    container.querySelector("#pmFilter").value = filterVal;
    container.querySelector("#pmFilter").onchange = e => { filterVal = e.target.value; render(); };
    // Modal
    container.querySelectorAll('.pm-fcard').forEach(fc => {
      fc.onclick = () => { modalIdx = Number(fc.dataset.idx); render(); };
    });
    if (modalIdx!==null) container.querySelector('.pm-modal-back').onclick = ()=>{modalIdx=null;render();};
  }
  function modalView(friend) {
    const netState = friend.net > 0 ? 'plus' : friend.net < 0 ? 'minus' : 'settled';
    return `
      <div class="pm-modal-bg"></div>
      <div class="pm-modal">
        <button class="pm-modal-back" aria-label="Back">&larr;</button>
        <div class="pm-modal-pinfo">
          <span class="pm-avatar big">${friend.initials}</span>
          <span><span class="pm-fname big">${friend.name}</span>
          <span class="pm-fnet big ${netState}">
            ${friend.net>0?'+':'–'}${Math.abs(friend.net)} QAR
          </span></span>
        </div>
        <div class="pm-modal-actions">
          <button class="pm-btn pay">Pay</button>
          <button class="pm-btn remind">Remind</button>
          <button class="pm-btn split">Split</button>
        </div>
        <div class="pm-modal-hist">
          ${(friend.events||[]).map(ev=>`
            <div class="pm-modal-hrow ${ev.status}">
              <span>${ev.dir==="to"?`You paid ${friend.name}`:`${friend.name} paid you`}</span>
              <span class="pm-hamt">${ev.amount} QAR</span>
              <span class="pm-hstat">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
              <span class="pm-htime">${ev.time}</span>
              ${(ev.status==="pending"&&ev.dir==="to")?`<button class="pm-mini-act">Cancel</button>`:""}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
  render();
}
