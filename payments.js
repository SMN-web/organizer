export function showPaymentsPanel(container, user) {
  // Demo Data
  const allFriends = [
    {
      id: 1, name: "Rafseed", net: -70, status: "accepted",
      events: [
        {id:11, type:"pay", dir:"to", amount:8, status:"pending", time:"7m ago"},
        {id:12, type:"pay", dir:"to", amount:5, status:"accepted", time:"6m ago"},
        {id:13, type:"pay", dir:"to", amount:10, status:"rejected", time:"5m ago"}
      ]
    },
    {
      id: 2, name: "Bala", net: 120, status: "rejected",
      events: [
        {id:21, type:"pay", dir:"to", amount:15, status:"rejected", time:"6m ago"}
      ]
    },
    {
      id: 3, name: "Shyam", net: 0, status: "pending",
      events: [
         {id:31, type:"pay", dir:"to", amount:20, status:"pending", time:"just now"}
      ]
    }
  ];

  const filters = [
    { value: "all", label: "All" },
    { value: "give", label: "You Owe" },
    { value: "get", label: "You Get" },
    { value: "done", label: "Settled" }
  ];

  let searchTerm = "";
  let filterVal = "all";

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase() || name.slice(0,2).toUpperCase();
  }

  function shouldShowAcceptReject(ev, friend) {
    // Example rule: Show if status is pending, user is receiver
    return ev.type === "pay" && ev.status === "pending" && friend.net > 0;
  }
  function shouldShowCancel(ev, friend) {
    // Example rule: User sent pay request, still pending
    return ev.type === "pay" && ev.status === "pending" && friend.net < 0;
  }

  function renderUI() {
    const filteredFriends = allFriends.filter(f => {
      const nameMatch = f.name.toLowerCase().includes(searchTerm);
      if (filterVal === "all") return nameMatch;
      if (filterVal === "give") return f.net < 0 && nameMatch;
      if (filterVal === "get") return f.net > 0 && nameMatch;
      if (filterVal === "done") return f.net === 0 && nameMatch;
      return nameMatch;
    });

    container.innerHTML = `
      <div class="pmain-wrapper">
        <div class="pmain-headerbar">
          <div class="pmain-title">Your Settlements</div>
          <div class="pmain-bell">
            <span class="pmain-bell-icon">&#128276;</span>
            <span class="pmain-bell-badge">11</span>
          </div>
        </div>
        <div class="pmain-searchbar">
          <input id="paySearch"
            class="pmain-searchinput"
            type="text"
            autocomplete="off"
            placeholder="Search..."
            value="${searchTerm.replace(/"/g,'&quot;')}"
            />
          <select id="payFilter" class="pmain-dropdown">
            ${filters.map(f=>`<option value="${f.value}"${f.value===filterVal?" selected":""}>${f.label}</option>`).join("")}
          </select>
        </div>
        <div class="pmain-friendlist">
          ${filteredFriends.map(friend => `
            <div class="pmain-friendcard">
              <div class="pmain-friendtop">
                <span class="pmain-avatar">${initials(friend.name)}</span>
                <span>
                  <span class="pmain-friendname">${friend.name}</span><br/>
                  <span class="pmain-friendamt ${friend.net>0?'recv':friend.net<0?'give':'settled'}">
                    ${friend.net>0? `+${friend.net} QAR`: friend.net<0? `${friend.net} QAR`:"Settled"}
                  </span>
                </span>
                <span class="pmain-status pmain-status-${friend.status}">${friend.status.charAt(0).toUpperCase()+friend.status.slice(1)}</span>
              </div>
              <div class="pmain-actionbar">
                <button class="pmain-btn pmain-btn-secondary">Remind</button>
                <button class="pmain-btn pmain-btn-secondary">Split</button>
                <button class="pmain-btn pmain-btn-pay">Pay</button>
              </div>
              <div class="pmain-history">
                ${(friend.events||[]).map(ev=>`
                  <div class="pmain-history-row">
                    <div class="pmain-history-title">
                      ${ev.dir === "to" ? `You paid ${friend.name}` : `${friend.name} paid you`} ${ev.amount} QAR
                    </div>
                    <div class="pmain-history-meta">
                      <span class="pmain-history-status pmain-status-${ev.status}">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
                      <span class="pmain-history-time">${ev.time}</span>
                    </div>
                    <div class="pmain-history-ops">
                      ${shouldShowAcceptReject(ev, friend) ?
                         `<button class="pmain-btn pmain-btn-accept">Accept</button>
                          <button class="pmain-btn pmain-btn-reject">Reject</button>`: ''}
                      ${shouldShowCancel(ev, friend) ?
                         `<button class="pmain-btn pmain-btn-cancel">Cancel</button>`: ''}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // Search input always holds focus on input
    const s = container.querySelector("#paySearch");
    s.oninput = e => {
      searchTerm = e.target.value.trim().toLowerCase();
      renderUI();
      setTimeout(()=>{const t=container.querySelector("#paySearch");if(t)t.focus();t.selectionStart = t.selectionEnd = t.value.length;},0);
    };
    s.onclick = () => { setTimeout(()=>{const t=container.querySelector("#paySearch");if(t)t.focus();t.selectionStart = t.selectionEnd = t.value.length;},0);}
    container.querySelector("#payFilter").onchange = e => {
      filterVal = e.target.value;
      renderUI();
    };
    // Button demo handlers (replace with real logic)
    container.querySelectorAll(".pmain-btn-accept").forEach(b=>b.onclick=()=>alert("Accepted (demo)"));
    container.querySelectorAll(".pmain-btn-reject").forEach(b=>b.onclick=()=>alert("Rejected (demo)"));
    container.querySelectorAll(".pmain-btn-cancel").forEach(b=>b.onclick=()=>alert("Cancelled (demo)"));
    container.querySelectorAll(".pmain-btn-pay").forEach(b=>b.onclick=()=>alert("Pay (demo)"));
  }

  renderUI();
}
