export function showDashboard(container, user) {
  // DEMO DATA – swap for API/backend in production!
  const demo = {
    paidTotal: 342,
    owedTotal: 119,
    youOwe: 41,
    net: 78,
    spends: 12,
    topSpend: 120,
    shares: 22,
    settled: 9,
    payments: [
      { status: "pending", from_user: "Bala", to_user: "User", amount: 15 },
      { status: "pending", from_user: "Rafseed", to_user: "User", amount: 9 }
    ],
    recent: [
      { type: "received", name: "Bala", amount: 15, date: "Today" },
      { type: "sent", name: "Sreerag", amount: 18, date: "Yesterday" },
      { type: "settled", name: "Rafseed", amount: 23, date: "2 days ago" }
    ],
    friendsOwe: [
      { name: "Bala", amount: 27 },
      { name: "Rafseed", amount: 15 }
    ],
    youOweList: [
      { name: "Sreerag", amount: 18 },
      { name: "Rafseed", amount: 23 }
    ]
  };

  // Utility
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allFriends = Object.entries(balances).map(([name, net]) => ({ name, net }));
  const settledPct = Math.min(100,Math.round(demo.settled/(demo.spends+demo.settled)*100));
  const netColor = demo.net > 0 ? "#43a047" : demo.net < 0 ? "#e53935" : "#789";
  const netBG = demo.net > 0 ? "#e7fff0" : demo.net < 0 ? "#ffe6e6" : "#ececec";
  let pendingCount = demo.payments?.filter(p => p.status === 'pending' && p.to_user === (user?.username||"User")).length || 0;

  function donutSVG(owed, owe, net) {
    const tot = owed+owe, c = 2*Math.PI*38, pct1 = tot ? owed/tot : 0, pct2 = tot ? owe/tot : 0;
    return `
      <div id="donutChartArea" style="cursor:pointer;">
      <svg width="88" height="88" viewBox="0 0 88 88" style="display:block;margin:0 auto 0.2em;">
        <circle r="38" cx="44" cy="44" fill="#f3f8fc"/>
        <circle r="38" cx="44" cy="44" fill="none" stroke="#43a047" stroke-width="12"
          stroke-dasharray="${pct1*c},${c}" stroke-linecap="round" />
        <circle r="38" cx="44" cy="44" fill="none" stroke="#e53935" stroke-width="12"
          stroke-dasharray="${pct2*c},${c}" stroke-linecap="round"
          style="transform:rotate(${pct1*360}deg);transform-origin:44px 44px;" />
        <text x="44" y="54" text-anchor="middle" font-size="24" fill="${netColor}" font-weight="700">${net >= 0 ? '+' : '-'}${Math.abs(net)}</text>
      </svg>
      <div style="font-size:1em;font-weight:700;text-align:center;">
        <span style="color:#43a047;">Owed (Green)</span> &bull; <span style="color:#e53935;">Owe (Red)</span>
        <span style="font-size:0.92em;color:#9cacc0;">(Tap chart for legend)</span>
      </div>
      </div>
    `;
  }

  container.innerHTML = `
  <style>
    .fd-top-spacer { height:74px; }
    .fd-abs-header-row { display:flex;align-items:center;justify-content:space-between;margin:0 0 1em 0;padding:.7em 0 0.4em 0;}
    .fd-header-icon {
      background: none; border: none; padding: 0; font-size: 2em; color: #2566b2; cursor:pointer;*/
      background: none; border: none; outline: none; font-size: 2em; color: #2566b2; cursor:pointer;
      position:relative;
    }
    .fd-header-icon .fd-alert-dot {
      position:absolute;top:3px;right:2px;background:#e53935;color:#fff;border-radius:9px;padding:0 5px;font-size:.79em;line-height:1.3;font-weight:700;z-index:2;border:2px solid #fff;
    }
    .fd-banner { background: #fffde7; border-radius: 11px; padding: 0.95em 1.7em; margin-bottom: 1.1em; text-align: center; color: #e53935; font-weight: 700; box-shadow: 0 1px 8px #e5393512;}
    .fd-title { font-size:2.08em; font-weight:800; color:#153; text-align:center; margin-bottom:.7em; letter-spacing:.01em;}
    .fd-btn-row { display:flex;align-items:center;justify-content:space-between;gap:1em;margin-bottom:1.4em;}
    .fd-btn-main {
      flex:1 1 0;max-width:48%;padding:0.82em 1.1em;font-size:1.11em;font-weight:700;text-align:center;border-radius:11px;border:none;box-shadow:0 1px 8px #1976d215;cursor:pointer;
      background:#e3f2fd;color:#176dc4;transition:background .18s;
    }
    .fd-btn-main.expense {background:#e5ffe6;color:#148142;}
    .fd-btn-main:active { background:#89ebfc;color:#235;}
    /* ...rest of your CSS as previously provided... */
    .fd-piepanel { margin-bottom:1em; }
    .fd-net-badge { font-size:2em;font-weight:900;display:block;background:${netBG};color:${netColor};border-radius:15px;text-align:center;margin:0 auto 1.2em auto;padding:.7em 0;letter-spacing:.04em;}
    .fd-metrics-row { display:flex; gap:1em; margin-bottom:2em; justify-content:center;}
    .fd-metric-card { flex:1 0 90px; padding:1em 0.7em; background:linear-gradient(110deg,#f7fafc,#fff6f6); border-radius:13px; text-align:center; box-shadow:0 2px 10px #176dc412;}
    .fd-metric-label { color:#3897d1;font-weight:700;font-size:.98em;}
    .fd-metric-value { color:#2e3b57;font-size:1.2em;font-weight:900;}
    .fd-metric-card.owe .fd-metric-value { color:#e53935 !important; }
    .fd-progress-wrap {margin-bottom:1.8em;}
    .fd-progress-bar { background:#e3f2fd;border-radius:13px;width:80%;max-width:320px;margin:0 auto;height:14px;overflow:hidden;}
    .fd-progress-fill { background:#43a047;height:14px;width:${settledPct}%;border-radius:13px;transition:width .9s;}
    .fd-progress-text {margin-top:0.65em;font-size:1em;color:#198;font-weight:700;text-align:center;}
    /* ...Friends cards, activity, stats as previously... */
  </style>
  <div class="fd-main">
    <div class="fd-top-spacer"></div>
    <div class="fd-abs-header-row">
      <button class="fd-header-icon" title="Menu">&#9776;</button>
      <span></span>
      <button class="fd-header-icon" title="Notifications">
        &#128276;${pendingCount ? `<span class="fd-alert-dot">${pendingCount}</span>` : ""}
      </button>
    </div>
    ${pendingCount ?
      `<div class="fd-banner">
        🔔 You have ${pendingCount} payments awaiting your action!
      </div>` : ''}
    <div class="fd-title">Group Payments Dashboard</div>
    <div class="fd-btn-row">
      <button class="fd-btn-main friends" onclick="alert('Go to friends page')">Friends</button>
      <button class="fd-btn-main expense" onclick="window.location='/group-splits'">Split Expense</button>
    </div>
    <div class="fd-piepanel">${donutSVG(demo.owedTotal, demo.youOwe, demo.net)}</div>
    <div class="fd-net-badge">${demo.net>=0?'+':'-'}${Math.abs(demo.net)} QAR Net Balance</div>
    <div class="fd-metrics-row">
      <div class="fd-metric-card">
        <div class="fd-metric-label">Paid</div>
        <div class="fd-metric-value">${demo.paidTotal}</div>
      </div>
      <div class="fd-metric-card">
        <div class="fd-metric-label">Received</div>
        <div class="fd-metric-value">${demo.owedTotal}</div>
      </div>
      <div class="fd-metric-card owe">
        <div class="fd-metric-label">Owe</div>
        <div class="fd-metric-value">${demo.youOwe}</div>
      </div>
    </div>
    <div class="fd-progress-wrap">
      <div class="fd-progress-bar"><div class="fd-progress-fill"></div></div>
      <div class="fd-progress-text">
        ${demo.settled} of ${demo.spends+demo.settled} spends settled!
      </div>
    </div>
    <!-- rest of dashboard as previous ... -->
  </div>`;
  
  // You can plug the remainder of previous code for friends, activity, stats, pie legend modal, etc.
  // For brevity, keep those unchanged. The full styling and header pattern now matches your latest preferences!
  // Remember to update action handlers for "Friends", "Split Expense" as needed.
}
