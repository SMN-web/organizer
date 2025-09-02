export function showPaymentsPanel(container, user) {
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70, events: [
        { dir: "to", amount: 8, status: "pending", time: "7m ago" },
        { dir: "to", amount: 6, status: "pending", time: "14m ago" },
        { dir: "to", amount: 5, status: "accepted", time: "21m ago" },
        { dir: "to", amount: 10, status: "rejected", time: "25m ago" }
      ]
    },
    {
      initials: "BA", name: "Bala", net: 120, events: [
        { dir: "from", amount: 50, status: "accepted", time: "10m ago" },
        { dir: "from", amount: 70, status: "accepted", time: "27m ago" }
      ]
    },
    {
      initials: "SH", name: "Shyam", net: 0, events: [
        { dir: "to", amount: 20, status: "accepted", time: "just now" }
      ]
    },
    {
      initials: "AN", name: "Anju", net: -35, events: [
        { dir: "to", amount: 15, status: "pending", time: "11m ago" },
        { dir: "to", amount: 20, status: "accepted", time: "1h ago" }
      ]
    },
    {
      initials: "JO", name: "Jose", net: 0, events: [
        { dir: "from", amount: 40, status: "accepted", time: "50m ago" }
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

  function netState(net) {
    if (net === 0) return "settled";
    return net > 0 ? "plus" : "minus";
  }

  function displayNet(net) {
    if (net === 0) return `<span class="pm-net-status settled">Settled</span>`;
    return `<span class="pm-net-status ${net > 0 ? "plus" : "minus"}">${net > 0 ? "+" : "–"}${Math.abs(net)} QAR</span>`;
  }

  function rowAmount(ev) {
    return `<span class="pm-hamt ${ev.dir==="from"?"plus":"minus"}">${ev.dir==="from"?"+":"–"}${ev.amount} QAR</span>`;
  }

  function rowStatus(ev) {
    if(ev.dir==="from") return `<span class="pm-ttxt plus">Received</span>`;
    return `<span class="pm-ttxt minus">Paid</span>`;
  }

  function render() {
    const filtered = friends.filter(f => {
      const m = !searchTerm || f.name.toLowerCase().includes(searchTerm);
      if (filterVal === "all") return m;
      if (filterVal === "give") return f.net < 0 && m;
      if (filterVal === "get") return f.net > 0 && m;
      if (filterVal === "done") return f.net === 0 && m;
      return m;
    });

    container.innerHTML = `
      <div class="pm-root small">
        <div style="height:36px"></div>
        <div class="pm-srchrow">
          <input class="pm-search" id="pmSearch" placeholder="Search..." autocomplete="off" />
          <select class="pm-filter" id="pmFilter">
            ${filters.map(f => `<option value="${f.value}">${f.label}</option>`).join("")}
          </select>
        </div>
        <div class="pm-flist">
          ${filtered.map((f, i) => `
            <div class="pm-fcard" data-idx="${i}">
              <span class="pm-avatar">${f.initials}</span>
              <span class="pm-fmeta">
                <span class="pm-fname">${f.name}</span>
                ${displayNet(f.net)}
              </span>
              <span class="pm-arrow">&#8250;</span>
            </div>
          `).join('')}
        </div>
        ${modalIdx !== null ? modalView(filtered[modalIdx]) : ""}
      </div>
    `;

    // Search bar persistence
    const searchEl = container.querySelector("#pmSearch");
    searchEl.value = searchTerm;
    if (searchHadFocus) {
      setTimeout(() => {
        searchEl.focus();
        searchEl.setSelectionRange(searchSelection, searchSelection);
      }, 0);
    }
    searchEl.oninput = e => {
      searchTerm = e.target.value;
      searchHadFocus = true;
      searchSelection = e.target.selectionStart;
      render();
    };
    searchEl.onfocus = e => { searchHadFocus = true; searchSelection = e.target.selectionStart; };
    searchEl.onblur = e => { searchHadFocus = false; };
    container.querySelector("#pmFilter").value = filterVal;
    container.querySelector("#pmFilter").onchange = e => { filterVal = e.target.value; render(); };
    container.querySelectorAll('.pm-fcard').forEach(fc => {
      fc.onclick = () => { modalIdx = Number(fc.dataset.idx); render(); };
    });
    if (modalIdx !== null) {
      container.querySelector('.pm-modal-back').onclick = () => { modalIdx = null; render(); };
      const payBtn = container.querySelector('.pm-btn.pay');
      if (payBtn) {
        payBtn.onclick = () => {
          const friend = filtered[modalIdx];
          if (hasPending(friend.events)) {
            payBtn.disabled = true;
            payBtn.textContent = "Already Paid: Awaiting Confirmation";
            setTimeout(() => { payBtn.disabled = false; payBtn.textContent = "Pay"; }, 1800);
          }
        };
      }
      const remindBtn = container.querySelector('.pm-btn.remind');
      if (remindBtn) remindBtn.onclick = () => alert("Remind sent (demo)");
      container.querySelectorAll('.pm-mini-act').forEach(btn => btn.onclick = () => alert("Cancel request sent (demo)"));
    }
  }

  function modalView(friend) {
    const netCls = netState(friend.net);
    const pending = hasPending(friend.events);
    if(friend.net === 0) {
      return `
      <div class="pm-modal-bg"></div>
      <div class="pm-modal">
        <button class="pm-modal-back" aria-label="Back">&larr;</button>
        <div class="pm-modal-pinfo">
          <span class="pm-avatar big">${friend.initials}</span>
          <span>
            <span class="pm-fname big">${friend.name}</span>
            ${displayNet(friend.net)}
          </span>
        </div>
        <div class="pm-modal-actions">
          <span class="pm-settled-tag">All Settled</span>
        </div>
      </div>
      `;
    }
    return `
      <div class="pm-modal-bg"></div>
      <div class="pm-modal">
        <button class="pm-modal-back" aria-label="Back">&larr;</button>
        <div class="pm-modal-pinfo">
          <span class="pm-avatar big">${friend.initials}</span>
          <span>
            <span class="pm-fname big">${friend.name}</span>
            ${displayNet(friend.net)}
          </span>
        </div>
        <div class="pm-modal-actions">
          ${pending ? "" : `<button class="pm-btn pay">Pay</button>`}
          <button class="pm-btn remind">Remind</button>
        </div>
        <div class="pm-modal-hist clean-table">
          ${(friend.events||[]).map((ev, i) => `
            <div class="pm-modal-hrow ${ev.status}">
              ${rowAmount(ev)}
              ${rowStatus(ev)}
              <span class="pm-hstat">${ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}</span>
              <span class="pm-htime">${ev.time}</span>
              ${(ev.status === "pending" && ev.dir === "to") ? `<button class="pm-mini-act">Cancel</button>` : ""}
            </div>
            ${i < friend.events.length - 1 ? '<div class="hr-row"></div>' : ''}
          `).join("")}
        </div>
      </div>
    `;
  }
  render();
}
