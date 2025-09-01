export function showPaymentsPanel(container, user) {
  // --- Demo Data ---
  const allFriends = [
    {
      id: 1, name: "Rafseed", net: -70,
      events: [
        {id:1, dir:"to", amount:8, status:"pending", time:"7m ago"},
        {id:2, dir:"to", amount:5, status:"accepted", time:"6m ago"},
        {id:3, dir:"to", amount:10, status:"rejected", time:"5m ago"}
      ]
    },
    {
      id: 2, name: "Bala", net: 120,
      events: [{id:4, dir:"to", amount:15, status:"rejected", time:"6m ago"}]
    },
    {
      id: 3, name: "Shyam", net: 0,
      events: [{id:5, dir:"to", amount:20, status:"pending", time:"just now"}]
    }
  ];

  const filters = [
    { value: "all", label: "All" },
    { value: "give", label: "You Owe" },
    { value: "get", label: "You Get" },
    { value: "done", label: "Settled" }
  ];

  let searchTerm = "", filterVal = "all", expanded = null;

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase();
  }

  function renderUI() {
    // Header
    container.innerHTML = `
      <div class="tl-shell">
        <div class="tl-toolbar">
          <div class="tl-title">Account Timeline</div>
          <div class="tl-searchbar">
            <input id="tlSearch" class="tl-searchinput" type="text" placeholder="Find Partner..." value="${searchTerm.replace(/"/g,'&quot;')}"/>
            <select id="tlFilter" class="tl-dropdown">
              ${filters.map(f=>`<option value="${f.value}"${f.value===filterVal?" selected":""}>${f.label}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="tl-timeline">
          ${allFriends.filter(f=>{
              const nameMatch = f.name.toLowerCase().includes(searchTerm);
              if(filterVal==="all") return nameMatch;
              if(filterVal==="give") return f.net<0 && nameMatch;
              if(filterVal==="get") return f.net>0 && nameMatch;
              if(filterVal==="done") return f.net===0 && nameMatch;
              return nameMatch;
            }).map(friend=>`
            <section class="tl-section${expanded===friend.id?" open":""}" data-id="${friend.id}">
              <button class="tl-section-header">
                <span class="tl-avatar">${initials(friend.name)}</span>
                <span>
                  <span class="tl-fname">${friend.name}</span>
                  <span class="tl-fnet ${friend.net>0?'recv':friend.net<0?'give':'settled'}">
                    ${friend.net>0? `+${friend.net} QAR` : friend.net<0? `${friend.net} QAR` : `Settled`}
                  </span>
                </span>
                <span class="tl-mini">
                  <span class="tl-count">${friend.events.length} events</span>
                  <svg width="14" height="16"><path d="M3 6l4 4 4-4" fill="none" stroke="#a6b0cd" stroke-width="2.2"/></svg>
                </span>
              </button>
              <div class="tl-section-expand">
                ${
                  expanded===friend.id
                  ? `<div class="tl-actionbar">
                      <button class="tl-btn tl-btn-sec">Remind</button>
                      <button class="tl-btn tl-btn-sec">Split</button>
                      <button class="tl-btn tl-btn-pay">Pay</button>
                    </div>
                    <div class="tl-events">
                      ${friend.events.map(ev=>`
                        <div class="tl-evcard tl-ev-${ev.status}">
                          <div class="tl-evtop">
                            <span class="tl-evtype">${ev.dir==="to"?"You paid":"Paid you"}</span>
                            <span class="tl-evamt${ev.dir==="to"?" give":" recv"}">${ev.dir==="to"?"-":"+"}${ev.amount} QAR</span>
                            <span class="tl-evstat stat-${ev.status}">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
                          </div>
                          <div class="tl-evmeta">${ev.time}</div>
                          <div class="tl-evactions">
                            ${ev.status==="pending"?
                              `<button class="tl-btn tl-btn-cancel">Cancel</button>
                               <button class="tl-btn tl-btn-accept">Accept</button>
                               <button class="tl-btn tl-btn-reject">Reject</button>`
                               :""}
                          </div>
                        </div>
                      `).join("")}
                    </div>`
                  : ""
                }
              </div>
            </section>
          `).join("")}
        </div>
      </div>
    `;

    // Search+focus retention
    const s = container.querySelector("#tlSearch");
    s.oninput = e => {
      searchTerm = e.target.value.toLowerCase(); renderUI();
      setTimeout(()=>{const f=container.querySelector("#tlSearch");f&&f.focus();},0);
    };
    s.onclick = () => { setTimeout(()=>{const f=container.querySelector("#tlSearch");f&&f.focus();},0);}
    container.querySelector("#tlFilter").onchange = e => { filterVal = e.target.value; renderUI(); };

    // Section expand/collapse
    container.querySelectorAll(".tl-section-header").forEach(btn => {
      btn.onclick = e => {
        const id = Number(btn.closest("section").dataset.id);
        expanded = expanded===id ? null : id;
        renderUI();
      };
    });
    // Demo accept/reject/cancel (replace with real logic)
    container.querySelectorAll(".tl-btn-accept").forEach(b=>b.onclick=()=>alert("Accepted Demo"));
    container.querySelectorAll(".tl-btn-reject").forEach(b=>b.onclick=()=>alert("Rejected Demo"));
    container.querySelectorAll(".tl-btn-cancel").forEach(b=>b.onclick=()=>alert("Cancelled Demo"));
    container.querySelectorAll(".tl-btn-pay").forEach(b=>b.onclick=()=>alert("Pay Demo"));
  }
  renderUI();
}
