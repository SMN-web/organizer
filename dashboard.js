export function showDashboard(container, user) {
  // Sample/demo data, plug in your real metrics
  const demo = {
    paidTotal: 362,
    owedTotal: 119,
    youOwe: 41,
    net: 78,
    spends: 12,
    topSpend: 120,
    shares: 22,
    friendsOwe: [
      { name: "Bala", amount: 27 },
      { name: "Rafseed", amount: 15 }
    ],
    youOweList: [
      { name: "Sreerag", amount: 18 },
      { name: "Rafseed", amount: 23 }
    ],
    settled: 9,
    recent: [
      { type: "received", name: "Bala", amount: 15, date: "Today" },
      { type: "sent", name: "Sreerag", amount: 18, date: "Yesterday" },
      { type: "settled", name: "Rafseed", amount: 23, date: "2 days ago" }
    ]
  };

  // Helper
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // Friend balance cards
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const balanceCards = Object.entries(balances)
    .map(([name, net]) => {
      let color = net > 0 ? "#43a047" : net < 0 ? "#e53935" : "#789";
      let status = net > 0 ? "Owes Me" : net < 0 ? "I Owe" : "Settled";
      let initials = name.split(" ").map(n => n[0]).join('').toUpperCase().slice(0,2);
      return `<div class="card-friend" style="border-left:5px solid ${color};box-shadow:0 2px 14px ${color}14;">
        <span class="card-avatar" style="background:${color}">${initials}</span>
        <span class="card-fname">${escapeHtml(name)}</span>
        <span class="card-fnet" style="color:${color};font-weight:700;">${net > 0 ? "+" : net < 0 ? "-" : ""}${Math.abs(net)}</span>
        <small class="card-status" style="color:${color}">${status}</small>
      </div>`;
    }).join('');

  // Recent timeline
  const timeline = demo.recent.map(ev =>
    `<div class="tl-row tl-${ev.type}">
      <span class="tl-dot"></span>
      <div class="tl-details">
        <div class="tl-amount">${ev.amount} QAR</div>
        <div class="tl-desc">${ev.type === "received"
          ? `Received from <b>${escapeHtml(ev.name)}</b>`
          : ev.type === "sent"
            ? `Sent to <b>${escapeHtml(ev.name)}</b>`
            : `Settled with <b>${escapeHtml(ev.name)}</b>`
        }</div>
        <div class="tl-date">${escapeHtml(ev.date)}</div>
      </div>
    </div>`
  ).join('');

  // Dashboard HTML
  container.innerHTML = `
  <style>
    .mdl-root { max-width:520px;margin:36px auto 0;background:#fff;border-radius:22px;box-shadow:0 8px 38px #2277ff10; font-family:'Inter',Arial,sans-serif;color:#222;padding:2em 0.6em 2.1em;}
    @media(max-width:540px){.mdl-root{max-width:97vw;padding:1.1em 0.2em 2em;}}
    .mdl-top-summary { display:flex;flex-direction:column;align-items:center;gap:0.6em;margin-bottom:1.4em; }
    .mdl-balance-badge { border-radius:13px;background:${demo.net>0?"#e9ffe7":demo.net<0?"#ffe3e3":"#eeedef"};padding:0.8em 2em;font-weight:800;font-size:1.26em; box-shadow:0 4px 16px #43a04722; color:${demo.net>0?"#218c36":demo.net<0?"#e53935":"#888"};}
    .mdl-bal-list { display:flex;gap:0.7em;flex-wrap:wrap;justify-content:center;margin:2em 0 2.2em;}
    .card-friend { display:flex;align-items:center;gap:10px;background:#f7fbfd;border-radius:14px;padding:1em 1.3em 1em 1.1em;margin-bottom:7px;font-size:1.04em;min-width:175px;}
    .card-avatar {display:inline-block;width:27px;height:27px;border-radius:50%;text-align:center;font-weight:800;font-size:1em;color:#fff;line-height:27px;margin-right:2px;}
    .card-fnet {margin-left:auto;margin-right:10px;}
    .card-status {font-size:.95em;margin-left:2px;}
    .mdl-metric-bar { display:flex;gap:1em;margin-bottom:1.6em;justify-content:center;}
    .mdl-metric { flex:1 0 110px;background:#f9fafc; border-radius:10px;padding:1em 0.3em;text-align:center;box-shadow:0 2px 10px #1976d228; }
    .mdl-metric-label { font-size:.98em;color:#7e90ac;font-weight:700;text-transform:uppercase; }
    .mdl-metric-val { font-size:1.45em;font-weight:700; color:#213348;margin-bottom:.1em;}
    .mdl-action-row { display:flex;gap:2em;justify-content:center;margin:2.2em 0;}
    .mdl-action-btn { flex:1 0 80px;border:none;font-size:1.1em;font-weight:800;padding:0.8em 1.6em;border-radius:9px;box-shadow:0 2px 10px #1976d210;cursor:pointer;background:#1e88e5;color:#fff;transition:.17s;}
    .mdl-action-btn.owebtn {background:#e53935;}
    .mdl-action-btn.settlebtn {background:#43a047;}
    .mdl-timeline {margin:2.5em 0 1em;}
    .tl-row { display:flex;align-items:flex-start;gap:10px;margin-bottom:1.2em;}
    .tl-dot { width:16px;height:16px;border-radius:50%;background:#1e88e5;display:inline-block;margin-right:7px;}
    .tl-row.tl-received .tl-dot { background:#43a047; }
    .tl-row.tl-sent .tl-dot { background:#e53935; }
    .tl-row.tl-settled .tl-dot { background:#789; }
    .tl-details { flex:1 0 auto; }
    .tl-amount { font-size:1.12em;font-weight:700; color:#213348;}
    .tl-desc { font-size:1.0em;margin-bottom:2px;}
    .tl-date { font-size:.98em;color:#789;}
    @keyframes fadein {0%{opacity:0;}100%{opacity:1;}}
  </style>
  <div class="mdl-root">
    <div class="mdl-top-summary">
      <div class="mdl-balance-badge">
        Net Balance: ${demo.net>0?'+':'-'}${Math.abs(demo.net)} QAR
      </div>
      <div class="mdl-metric-bar">
        <div class="mdl-metric"><div class="mdl-metric-label">Paid</div><div class="mdl-metric-val">${demo.paidTotal}</div></div>
        <div class="mdl-metric"><div class="mdl-metric-label">Received</div><div class="mdl-metric-val">${demo.owedTotal}</div></div>
        <div class="mdl-metric"><div class="mdl-metric-label">Owe</div><div class="mdl-metric-val">${demo.youOwe}</div></div>
      </div>
    </div>
    <div class="mdl-action-row">
      <button class="mdl-action-btn owebtn">Pay</button>
      <button class="mdl-action-btn settlebtn">Settle Up</button>
    </div>
    <div class="mdl-section" style="margin-top:1.7em;">
      <h3 style="font-size:1.09em;color:#1976d2;text-align:left;margin-bottom:0.6em;">Friends' Balances</h3>
      <div class="mdl-bal-list">${balanceCards || '<em>No balances yet!</em>'}</div>
    </div>
    <div class="mdl-section mdl-timeline">
      <h3 style="font-size:1.09em;color:#1976d2;margin-bottom:0.6em;text-align:left;">Recent Activity</h3>
      ${timeline || '<em>No recent transactions.</em>'}
    </div>
    <div class="mdl-section" style="margin-top:2em;">
      <h3 style="font-size:1.03em;color:#1976d2;text-align:left;margin-bottom:0.2em;">Your Stats</h3>
      <div style="display:flex;gap:1em;">
        <div class="mdl-metric"><div class="mdl-metric-label">Spends</div><div class="mdl-metric-val">${demo.spends}</div></div>
        <div class="mdl-metric"><div class="mdl-metric-label">Shares</div><div class="mdl-metric-val">${demo.shares}</div></div>
        <div class="mdl-metric"><div class="mdl-metric-label">Top Spend</div><div class="mdl-metric-val">${demo.topSpend}</div></div>
        <div class="mdl-metric"><div class="mdl-metric-label">Settled</div><div class="mdl-metric-val">${demo.settled}</div></div>
      </div>
    </div>
    <div style="margin:2em auto 0 auto;text-align:center;color:#99acd5;font-size:1.07em;">
      <em>Connect your API for live, actionable insights!</em>
    </div>
  </div>`;

}
