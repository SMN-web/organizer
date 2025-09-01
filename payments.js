export function showPaymentsPanel(container, user) {
  // Demo data—replace with your own user payments list
  const friends = [
    {
      initials: "RA",
      name: "Rafseed",
      net: -70,
      status: "accepted",
      events: [
        { dir: "to", amount: 8, status: "pending", time: "7m ago" },
        { dir: "to", amount: 5, status: "accepted", time: "6m ago" },
        { dir: "to", amount: 10, status: "rejected", time: "5m ago" }
      ]
    },
    {
      initials: "BA",
      name: "Bala",
      net: 120,
      status: "rejected",
      events: [
        { dir: "to", amount: 15, status: "rejected", time: "6m ago" }
      ]
    },
    {
      initials: "SH",
      name: "Shyam",
      net: 0,
      status: "pending",
      events: [
        { dir: "to", amount: 20, status: "pending", time: "just now" }
      ]
    }
  ];

  function friendCard(friend) {
    return `
      <div class="pmain-friendcard">
        <div class="pmain-friendtop">
          <span class="pmain-avatar">${friend.initials}</span>
          <span>
            <span class="pmain-friendname">${friend.name}</span><br/>
            <span class="pmain-friendamt ${friend.net > 0 ? 'recv' : friend.net < 0 ? 'give' : 'settled'}">
              ${friend.net > 0 ? `+${friend.net} QAR` : friend.net < 0 ? `${friend.net} QAR` : "Settled"}
            </span>
          </span>
          <span class="pmain-status pmain-status-${friend.status}">${friend.status.charAt(0).toUpperCase() + friend.status.slice(1)}</span>
        </div>
        <div class="pmain-actionbar">
          <button class="pmain-btn pmain-btn-secondary">Remind</button>
          <button class="pmain-btn pmain-btn-secondary">Split</button>
          <button class="pmain-btn pmain-btn-pay">Pay</button>
        </div>
        <div class="pmain-history">
          ${(friend.events || []).map(ev => `
            <div class="pmain-history-row">
              <div class="pmain-history-title">
                ${ev.dir === "to" ? `You paid ${friend.name}` : `${friend.name} paid you`} ${ev.amount} QAR
              </div>
              <div class="pmain-history-meta">
                <span class="pmain-history-status pmain-status-${ev.status}">${ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}</span>
                <span class="pmain-history-time">${ev.time}</span>
              </div>
              <div class="pmain-history-ops">
                ${(ev.status === "pending" && ev.dir === "to") ? `<button class="pmain-btn pmain-btn-cancel">Cancel</button>` : ''}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="pmain-wrapper">
      <div class="pmain-headerbar">
        <span class="pmain-menuicon">&#9776;</span>
        <span class="pmain-title">Your Settlements</span>
        <span class="pmain-bell">
          <span class="pmain-bell-icon">&#128276;</span>
          <span class="pmain-bell-badge">111</span>
        </span>
      </div>
      <div class="pmain-searchbar">
        <input id="paySearch" class="pmain-searchinput" type="text" autocomplete="off" placeholder="Search..." />
        <select id="payFilter" class="pmain-dropdown">
          <option value="all" selected>All</option>
          <option value="give">You Owe</option>
          <option value="get">You Get</option>
          <option value="done">Settled</option>
        </select>
      </div>
      <div class="pmain-friendlist">
        ${friends.map(friendCard).join("")}
      </div>
    </div>
  `;
}
