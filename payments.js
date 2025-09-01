export function showPaymentsPanel(container, user) {
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70,
      events: [
        { dir: "to", amount: 8, status: "pending", time: "7m ago" },
        { dir: "to", amount: 6, status: "pending", time: "14m ago" },
        { dir: "to", amount: 5, status: "accepted", time: "21m ago" },
        { dir: "to", amount: 10, status: "rejected", time: "25m ago" }
      ]
    },
    {
      initials: "BA", name: "Bala", net: 120,
      events: [
        { dir: "to", amount: 50, status: "pending", time: "10m ago" },
        { dir: "to", amount: 70, status: "accepted", time: "27m ago" }
      ]
    },
    {
      initials: "SH", name: "Shyam", net: 0,
      events: [
        { dir: "to", amount: 20, status: "accepted", time: "just now" }
      ]
    },
    {
      initials: "AN", name: "Anju", net: -35,
      events: [
        { dir: "to", amount: 15, status: "pending", time: "11m ago" },
        { dir: "to", amount: 20, status: "accepted", time: "1h ago" }
      ]
    },
    {
      initials: "JO", name: "Jose", net: 0,
      events: [
        { dir: "to", amount: 40, status: "accepted", time: "50m ago" }
      ]
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
  let searchHadFocus = false;
  let searchSelection = 0;

  function hasPending(events) {
    return events && events.some(e => e.status === "pending" && e.dir === "to");
  }

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
        <div style="height:30px"></div>
        <div class="pm-srchrow">
          <input class="pm-search" id="pmSearch" placeholder="Search..." autocomplete="off" />
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

    // Get ref, restore input value, handle focus
    const searchEl = container.querySelector("#pmSearch");
    searchEl.value = searchTerm;
    // Restore prior selection (cursor position)
    if (searchHadFocus) {
      setTimeout(()=>{
        searchEl.focus();
        searchEl.setSelectionRange(searchSelection, searchSelection);
      }, 0);
    }
    // On input, always remember focus/selection for next render
    searchEl.oninput = e => {
      searchTerm = e.target.value.toLowerCase();
      searchHadFocus = true;
      searchSelection = e.target.selectionStart;
      render();
    };
    searchEl.onfocus = e => { searchHadFocus = true; searchSelection = e.target.selectionStart; };
    searchEl.onblur = e => { searchHadFocus = false; };
    // Dropdown filter
    container.querySelector("#pmFilter").value = filterVal;
    container.querySelector("#pmFilter").onchange = e => { filterVal = e.target.value; render(); };
    // Click friend = open modal
    container.querySelectorAll('.pm-fcard').forEach(fc => {
      fc.onclick = () => { modalIdx = Number(fc.dataset.idx); render(); };
    });
    // Modal events
    if (modalIdx!==null) {
      container.querySelector('.pm-modal-back').onclick = ()=>{modalIdx=null;render();};
      const payBtn = container.querySelector('.pm-btn.pay');
      if (payBtn) {
        payBtn.onclick = () => {
          const friend = filtered[modalIdx];
          if (hasPending(friend.events)) {
            payBtn.disabled = true;
            payBtn.textContent = "Already Paid: Awaiting Confirmation";
            setTimeout(()=>{payBtn.disabled=false;payBtn.textContent="Pay";},1800);
          }
        };
      }
      const remindBtn = container.querySelector('.pm-btn.remind');
      if (remindBtn) remindBtn.onclick = () => alert('Remind sent (demo)');
      container.querySelectorAll('.pm-mini-act').forEach(btn=>btn.onclick=()=>alert('Cancel request (demo)'));
    }
  }
  render();
}
