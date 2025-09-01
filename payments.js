export function showPaymentsPanel(container, user) {
  const ACCENT = "#2455ea"; // your professional blue

  // --- Sidebar / Navigation ---
  function nav() {
    return `
      <nav class="ledger-nav">
        <div class="nav-header">My Accounts</div>
        <input class="nav-search" placeholder="Search…" />
        <ul class="nav-list">
          <li class="nav-list-item active">All</li>
          <li class="nav-list-item">Owe</li>
          <li class="nav-list-item">Get</li>
          <li class="nav-list-item">Settled</li>
        </ul>
      </nav>
    `;
  }

  // --- Main Table / Sheet ---
  function mainTable(friends) {
    return `
      <div class="ledger-table">
        <div class="ledger-table-head">
          <span class="head-avatar"></span>
          <span class="head-friend">Friend</span>
          <span class="head-balance">Net</span>
          <span class="head-last">Last</span>
        </div>
        <div class="ledger-table-body">
          ${friends.map(f => `
            <div class="ledger-row" data-id="${f.id}">
              <span class="ledger-avatar">${f.initials}</span>
              <span class="ledger-friend">${f.name}</span>
              <span class="ledger-balance${f.net>0?' plus':f.net<0?' minus':' settled'}">
                ${f.net>0?'+':'–'}${Math.abs(f.net)} QAR
              </span>
              <span class="ledger-last">${f.lastEvent}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // --- (Drawer) Side Panel ---
  function detailPanel(friend) {
    return friend ? `
      <aside class="ledger-panel active">
        <section>
          <span class="ledger-panel-avatar">${friend.initials}</span>
          <span class="ledger-panel-name">${friend.name}</span>
        </section>
        <div class="ledger-panel-balance${friend.net>0?' plus':friend.net<0?' minus':' settled'}">
          ${friend.net>0?'+':'–'}${Math.abs(friend.net)} QAR
        </div>
        <hr />
        <div class="ledger-panel-events">
          ${friend.events.map(ev => `
            <div class="ledger-event-row">
              <span class="ledger-event-amt${ev.dir==='to' ? ' minus':' plus'}">
                ${ev.dir==='to'?'-':'+'}${ev.amount} QAR
              </span>
              <span class="ledger-event-summary">${ev.summary}</span>
              <span class="ledger-event-time">${ev.time}</span>
            </div>
          `).join("")}
        </div>
        <div class="ledger-panel-actions">
          <button class="ledger-btn ledger-action-pay">Pay</button>
          <button class="ledger-btn ledger-action-remind">Remind</button>
          <button class="ledger-btn ledger-action-split">Split</button>
        </div>
      </aside>
    ` : "";
  }

  // --- Root render (keep only essential style switches) ---
  container.innerHTML = `
    <div class="ledger-root">
      ${nav()}
      <div class="ledger-main">
        ${mainTable(data.friends)}
        <div class="ledger-panel-container"></div>
      </div>
    </div>
  `;

  // Interactivity: expand/collapse detail panel
  const panelC = container.querySelector('.ledger-panel-container');
  container.querySelectorAll('.ledger-row').forEach(row => {
    row.onclick = () => {
      const fid = Number(row.dataset.id);
      const friend = data.friends.find(f => f.id === fid);
      panelC.innerHTML = detailPanel(friend);
      panelC.classList.add('active');
    };
  });
  // Close drawer (desktop: click body; mobile: swipe; implement as needed)
}

