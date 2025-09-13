export function showDashboard(container, user) {
  // Replace demo with API data in production
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
    settled: 9
  };

  // Utility
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // Friend chips
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allChips = Object.entries(balances)
    .map(([name, net]) => {
      let color = net > 0 ? "#43a047" : net < 0 ? "#e53935" : "#789";
      let badge = net > 0 ? "gets +" : net < 0 ? "owes -" : "settled";
      let initials = name.split(" ").map(n => n[0]).join('').toUpperCase().slice(0,2);
      return `<div class="chip-friend" style="background:${color}20;"><span class="chip-avatar" style="background:${color}">${initials}</span> 
        <span>${escapeHtml(name)}</span>
        <span class="chip-net" style="color:${color}">${net > 0 ? "+" : net < 0 ? "-" : ""}${Math.abs(net)}</span>
        <small>${badge}</small>
      </div>`;
    }).join('');

  // Animated horizontal metrics bar
  function animateNums() {
    ["db-pd","db-rec","db-ow","db-net"].forEach(id => {
      const el = document.getElementById(id); if(!el) return;
      const v = +el.dataset.val||0;
      let cur=0,inc=Math.max(1,Math.ceil(v/40));
      function step(){ if(cur>=v){el.textContent=v+" QAR"; return;} cur+=inc; el.textContent=Math.min(cur,v)+" QAR"; requestAnimationFrame(step);}
      step();
    });
  }

  // Simple ring chart
  function ringChart(owed, owe, net) {
    const r=30,c=2*Math.PI*r,x=38,y=38;
    const tot=Math.max(1,owed+owe), pct1=owed/tot, pct2=owe/tot;
    return `
      <svg width="90" height="90" viewBox="0 0 76 76" style="vertical-align:-30%;">
        <circle r="30" cx="38" cy="38" fill="#f6f6f9"/>
        <circle r="30" cx="${x}" cy="${y}" fill="none" stroke="#1976d2" stroke-width="10"
          stroke-dasharray="${pct1*c},${c}" stroke-linecap="round" />
        <circle r="30" cx="${x}" cy="${y}" fill="none" stroke="#e53935" stroke-width="10"
          stroke-dasharray="${pct2*c},${c}" stroke-linecap="round" style="transform:rotate(${(pct1)*360}deg);transform-origin:38px 38px;" />
        <text x="38" y="47" text-anchor="middle" font-size="23" fill="${net>=0?"#43a047":"#e53935"}" font-weight="800">${net}</text>
      </svg>
    `;
  }

  // Activity tiles
  function activityTiles() {
    return [
      { label: "Spends", value: demo.spends, color: "#1976d2" },
      { label: "Top Spend", value: demo.topSpend+" QAR", color: "#e53935" },
      { label: "Shares", value: demo.shares, color: "#218c36" },
      { label: "Settled", value: demo.settled, color: "#546e7a" }
    ].map(tile =>
      `<div class="tile-activity" style="background:${tile.color}10;color:${tile.color}">
        <div class="tile-label">${tile.label}</div>
        <div class="tile-val">${tile.value}</div>
      </div>`
    ).join('');
  }

  // Dashboard HTML
  container.innerHTML = `
  <style>
    .alt-dash-main { max-width:680px;margin:32px auto;padding:2em 1em 2.8em;background:#fff;border-radius:22px;box-shadow:0 8px 38px #2277ff22;
      font-family:'Inter','Segoe UI',Arial,sans-serif;color:#214;
      animation:fadein .7s; }
    @media (max-width:700px) { .alt-dash-main { max-width:97vw; padding:1em 0.3em; } }
    .metrics-bar-scroll { display:flex;overflow-x:auto;gap:1.2em;margin:1.3em 0;padding-bottom:8px; }
    .metric-horiz { display:flex;flex-direction:column;min-width:132px;background:#fafcfd;border-radius:9px;box-shadow:0 4px 10px #0001;text-align:center;padding:1em; }
    .metric-label { font-size:.97em;color:#99aad0;font-weight:600;margin-bottom:0.3em;text-transform:uppercase; }
    .metric-val { font-size:1.63em;font-weight:800;color:#1976d2;margin-bottom:.1em; }
    .metric-val.net { color:${demo.net>=0?"#43a047":"#e53935"} }
    .metrics-bar-scroll::-webkit-scrollbar { display:none; }
    .ring-wrap { margin:2.8em 0 1em; text-align:center; }
    .badge-net { display:inline-block;padding:7px 24px;border-radius:30px;background:${demo.net>=0?"#e4ffea":"#ffe2e2"};font-weight:700;color:${demo.net>=0?"#218c36":"#e53935"};font-size:1.12em;margin-bottom:5px;box-shadow:0 2px 8px #0001; }
    .chips-bal-row { display:flex;flex-wrap:wrap;gap:0.7em;margin:2.2em 0 2.8em; }
    .chip-friend { display:flex;align-items:center;gap:7px;background:#f3f9fc;border-radius:19px;padding:7px 18px;box-shadow:0 1px 6px #1e88e512; }
    .chip-avatar { display:inline-block;width:27px;height:27px;border-radius:50%;text-align:center;font-weight:700;font-size:1em;color:#fff; }
    .chip-net { font-weight:600;padding:0 5px; }
    .tile-row { display:flex;gap:1.1em;margin-top:2.6em;justify-content:center; }
    .tile-activity { flex:1 0 110px;min-width:100px;border-radius:13px;background:#f3f9fc;box-shadow:0 2px 14px #2277ff10;text-align:center;padding:1em 0.6em; }
    .tile-label { font-size:.97em;color:#6c7fa5;font-weight:700;margin-bottom:1px; }
    .tile-val { font-size:1.21em;font-weight:800; }
    @keyframes fadein {0%{opacity:0;}100%{opacity:1;}}
  </style>
  <div class="alt-dash-main">
    <h2 style="font-size:2em;margin-top:0;font-weight:800;">👋 Hi ${escapeHtml(user.name||"User")}</h2>
    <div style="font-size:1.17em;margin-bottom:1em;">Your payment and activity summary.</div>
    <div class="metrics-bar-scroll">
      <div class="metric-horiz"><div class="metric-label">Net</div>
        <span class="metric-val net" id="db-net" data-val="${demo.net}">0</span></div>
      <div class="metric-horiz"><div class="metric-label">Paid</div>
        <span class="metric-val" id="db-pd" data-val="${demo.paidTotal}">0</span></div>
      <div class="metric-horiz"><div class="metric-label">Received</div>
        <span class="metric-val" id="db-rec" data-val="${demo.owedTotal}">0</span></div>
      <div class="metric-horiz"><div class="metric-label">You Owe</div>
        <span class="metric-val" id="db-ow" data-val="${demo.youOwe}">0</span></div>
    </div>
    <div class="ring-wrap">
      ${ringChart(demo.youOwe, demo.owedTotal, demo.net)}
      <div class="badge-net">${demo.net>=0?'+':'-'}${Math.abs(demo.net)} Net</div>
      <div style="font-size:1em;color:#7e97b3;">Owed (<span style="color:#1e88e5;">Blue</span>) &nbsp;/&nbsp; Owe (<span style="color:#e53935;">Red</span>)</div>
    </div>
    <div class="db-section-hdr">Balances with Friends</div>
    <div class="chips-bal-row">${allChips || '<em>No group balances yet!<em>'}</div>
    <div class="db-section-hdr">Your Activity</div>
    <div class="tile-row">${activityTiles()}</div>
    <div style="margin:2.7em auto 0 auto;text-align:center;color:#99acd5;font-size:1.10em;">
      <em>Visual analytics, exports, and reports coming soon.<br>Connect your API for real-time snapshots!</em>
    </div>
  </div>
  `;

  animateNums();
}
