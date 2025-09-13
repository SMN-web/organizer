export function showDashboard(container, user) {
  // Demo data -- replace with API values
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

  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // Compile balances & leaderboard
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allFriends = Object.entries(balances).map(([name, net]) => ({ name, net }));
  const sortedFriends = [...allFriends].sort((a,b) => Math.abs(b.net)-Math.abs(a.net));
  const topFriend = sortedFriends[0] || { name: "-", net: 0 };
  const settledPct = Math.min(100,Math.round(demo.settled/(demo.settled+demo.spends)*100));
  
  // Pie chart utility
  function donutSVG(owed, owe, net) {
    const tot = owed+owe, c = 2*Math.PI*38, pct1=tot?owed/tot:0, pct2=tot?owe/tot:0;
    return `
      <svg width="88" height="88" viewBox="0 0 88 88" class="fd-piechart">
        <circle r="38" cx="44" cy="44" fill="#f3f8fc"/>
        <circle r="38" cx="44" cy="44" fill="none" stroke="#1e88e5" stroke-width="12"
          stroke-dasharray="${pct1*c},${c}" stroke-linecap="round" />
        <circle r="38" cx="44" cy="44" fill="none" stroke="#e53935" stroke-width="12"
          stroke-dasharray="${pct2*c},${c}" stroke-linecap="round"
          style="transform:rotate(${pct1*360}deg);transform-origin:44px 44px;" />
        <text x="44" y="54" text-anchor="middle" font-size="21" fill="${net>=0?"#43a047":"#e53935"}" font-weight="700">${net>=0?'+':'-'}${Math.abs(net)}</text>
      </svg>
    `;
  }

  // Main Dashboard HTML
  container.innerHTML = `
  <style>
    .fd-main { max-width:540px; margin:45px auto; font-family:'Inter',Arial,sans-serif; color:#223; background:#fafdff; border-radius:24px; box-shadow:0 8px 34px #176dc419; padding:2.7em 1.3em 3em;}
    @media(max-width:540px){.fd-main{max-width:99vw;padding:1em 0.15em 2em;}}
    .fd-title { font-size:2.35em; font-weight:700; color:#124; text-align:center; margin-bottom:1em; letter-spacing:.01em;}
    .fd-piepanel { text-align:center; margin-bottom:2em;}
    .fd-leader-row { display:flex; gap:0.7em; justify-content:center;}
    .fd-leader-badge { background:#e3f8fe;border-radius:16px;padding:6px 21px;color:#176dc4;font-weight:700; }
    .fd-progress-wrap { margin:2em 0 1.5em 0; text-align:center;}
    .fd-progress-bar { background:#e3f2fd;border-radius:13px;width:77%;max-width:320px;margin:0 auto;height:14px;overflow:hidden;}
    .fd-progress-fill { background:#43a047;height:14px;width:${settledPct}%;border-radius:13px;transition:width .8s;}
    .fd-progress-text { margin-top:.31em;font-size:.99em;color:#198;font-weight:800;}
    .fd-panel { background:linear-gradient(90deg,#c3eaff,#ffffff 69%); border-radius:19px; box-shadow:0 2px 19px #176dc420; padding:1.7em; margin-bottom:2.4em; text-align:center;}
    .fd-panel-label { font-size:1.02em;color:#3178c6;font-weight:700;}
    .fd-panel-value { font-size:2.07em; font-weight:900; color:#176dc4; letter-spacing:.01em;}
    .fd-panel-net { font-size:1.15em; font-weight:700; color:${demo.net>0?"#43a047":demo.net<0?"#e53935":"#789"};background:${demo.net>0?"#e3ffe7":demo.net<0?"#ffdede":"#ececec"};border-radius:10px;padding:.33em 1.15em;display:inline-block;box-shadow:0 2px 9px #43a04721;margin:0.25em 0;}
    .fd-metrics-row { display:flex; gap:1.2em; margin-bottom:2.7em; justify-content:center;}
    .fd-metric-card { flex:1 0 95px;padding:1.12em 1em; background:linear-gradient(110deg,#f3fcff,#ededfb); border-radius:15px; text-align:center; box-shadow:0 2px 14px #176dc42a; font-size:1.13em;}
    .fd-metric-label { color:#3897d1;font-weight:700;font-size:.99em;}
    .fd-metric-value { color:#223b57;font-size:1.32em;font-weight:900;}
    .fd-friends-group { margin:2.3em 0 2.4em;}
    .fd-friends-label { font-size:1.09em; color:#176dc4;font-weight:800; margin-bottom:.8em;}
    .fd-friends-list { display:flex;flex-wrap:wrap;gap:1.08em;justify-content:left;}
    .fd-friend-card { background:linear-gradient(90deg,#fafdff,#defee5 80%); border-radius:13px; padding:1em 0.9em 1em 1.15em; box-shadow:0 1.5px 12px #29a0650a; min-width:146px; display:flex;flex-direction:column; align-items:start; transition:.18s; position:relative;}
    .fd-friend-avatar { display:inline-block;width:25px;height:25px;font-weight:700;font-size:1.05em;text-align:center;padding:0px;border-radius:99px;background:#e3f2fd;color:#1976d2; margin-bottom:3px;}
    .fd-friend-name { font-weight:700; font-size:1.1em; margin-bottom:1px;}
    .fd-friend-net { font-size:1.02em;font-weight:800;color: #2ca156;margin-bottom:2px;}
    .fd-friend-status { background:${demo.net>0?"#e3fbe8":demo.net<0?"#fee":"#eee"};color:${demo.net>0?"#2ca156":demo.net<0?"#e53935":"#888"};border-radius:7px;padding:0.18em 0.7em;font-weight:600;font-size:.97em;}
    .fd-act-panel { position:relative;width:92%;max-width:220px;margin:.5em auto 0 auto; transition:.13s; }
    .fd-act-content { background:#fff;box-shadow:0 4px 22px #1976d225;padding:1em 0.7em 1.3em;border-radius:14px;position:absolute;left:0;right:0;top:calc(100%+9px);z-index:44;text-align:center; }
    .fd-paybtn, .fd-txbtn {border:none;background:#176dc4;color:#fff;font-weight:700;padding:0.71em 2em;margin:0.3em 0.7em;border-radius:9px;cursor:pointer;font-size:1.08em;box-shadow:0 1px 11px #176dc42a; }
    .fd-paybtn:hover, .fd-txbtn:hover {background:#43a047;}
    .fd-rec-label {font-size:1.07em;color:#176dc4;font-weight:800;margin-bottom:0.45em;}
    .fd-rec-list { margin-bottom:2em;}
    .fd-rec-card { background:#fff;border-radius:10px;box-shadow:0 1px 7px #1976d213; margin-bottom:0.8em;padding:1em 1.3em; display:flex;align-items:center; gap:1em;}
    .fd-rc-dot { width:15px;height:15px;border-radius:50%;background:#1976d2;display:inline-block;}
    .fd-rc-dot.received {background:#43a047;}
    .fd-rc-dot.sent {background:#e53935;}
    .fd-rc-dot.settled {background:#789;}
    .fd-rc-details { flex:1;}
    .fd-rc-amount {font-size:1.08em;font-weight:800;color:#223b57;}
    .fd-rc-desc {font-size:.99em;font-weight:600;color:#4570a2;}
    .fd-rc-date {font-size:.98em;color:#789;}
    .fd-stats-label {font-size:1.03em;color:#176dc4;font-weight:700;margin-top:1.7em;margin-bottom:.7em;text-align:left;}
    .fd-stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.15em; }
    @media(max-width:600px){ .fd-stats-grid { grid-template-columns:1fr; } }
    .fd-sg-card { background:#e3f8fe;border-radius:10px; box-shadow:0 1px 8px #1976d212;text-align:center;padding:1em 0.7em;}
    .fd-sg-label {font-size:.98em;color:#176dc4;font-weight:700;}
    .fd-sg-value { font-size:1.18em;font-weight:800;}
    .fd-footer {margin:2em auto 0;text-align:center;color:#99acd5;font-size:1.10em;}
    .fd-pay-modal { position: fixed; left:0; top:0; width:100vw; height:100vh; z-index:99; background:rgba(24,32,54,0.30); display:flex; align-items:center; justify-content:center; animation:fadein1 .2s;}
    .fd-pay-content { background:#fff; border-radius:13px; box-shadow:0 6px 36px #1976d230; padding:2em 2.3em; min-width:260px; text-align:center;}
    .fd-pay-close { position:absolute; right:16px; top:16px; background:none; border:none; font-size:1.5em; color:#176dc4; cursor:pointer;}
    .fd-pay-content h4 {font-size:1.2em;font-weight:700;margin-bottom:1em;}
    .fd-pay-input {width:85%;padding:0.6em 0.7em;font-size:1em;border-radius:6px;border:1px solid #abc; margin-bottom:1.18em;}
    .fd-pay-confirm { background:#3897d1; color:#fff; border:none; font-weight:700; font-size:1.02em; padding:.63em 2em; border-radius:6px;cursor:pointer; box-shadow:0 2px 7px #176dc422;}
    @keyframes fadein1 {0%{opacity:0;}100%{opacity:1;}}
  </style>
  <div class="fd-main">
    <div class="fd-title">Welcome, <b>${escapeHtml(user.name||"User")}</b></div>
    <div class="fd-piepanel">${donutSVG(demo.owedTotal, demo.youOwe, demo.net)}
      <div class="fd-pie-labels">
        <span style="color:#1e88e5;">Owed</span> &bull; <span style="color:#e53935;">Owe</span>
      </div>
    </div>
    <div class="fd-toprow">
      <span class="fd-panel-label">Top Friend:</span>
      <span class="fd-top-friend">${escapeHtml(topFriend.name)} (${topFriend.net>0?'+':'-'}${Math.abs(topFriend.net)})</span>
      <div class="fd-leader-row">Leaderboard: ${
        sortedFriends.slice(0,2).map(f=>`
          <span class="fd-leader-badge">${escapeHtml(f.name)} (${f.net>0?'+':'-'}${Math.abs(f.net)})</span>
        `).join('')
      }</div>
    </div>
    <div class="fd-progress-wrap">
      <div class="fd-progress-bar"><div class="fd-progress-fill"></div></div>
      <div class="fd-progress-text">${demo.settled} of ${demo.spends+demo.settled} spends settled!</div>
    </div>
    <div class="fd-panel">
      <div class="fd-panel-label">Group Paid</div>
      <div class="fd-panel-value">${demo.paidTotal} QAR</div>
      <div class="fd-panel-net">${demo.net>=0?'+':'-'}${Math.abs(demo.net)} Net</div>
    </div>
    <div class="fd-metrics-row">
      <div class="fd-metric-card">
        <div class="fd-metric-label">Paid</div>
        <div class="fd-metric-value">${demo.paidTotal}</div>
      </div>
      <div class="fd-metric-card">
        <div class="fd-metric-label">Received</div>
        <div class="fd-metric-value">${demo.owedTotal}</div>
      </div>
      <div class="fd-metric-card">
        <div class="fd-metric-label">Owe</div>
        <div class="fd-metric-value">${demo.youOwe}</div>
      </div>
    </div>
    <div class="fd-friends-group">
      <div class="fd-friends-label">Balance with Friends</div>
      <div class="fd-friends-list" id="fd-friend-list"></div>
    </div>
    <div class="fd-rec-label">Recent Activity</div>
    <div class="fd-rec-list">
      ${(demo.recent||[]).map(ev=>`
        <div class="fd-rec-card">
          <span class="fd-rc-dot ${ev.type}"></span>
          <div class="fd-rc-details">
            <div class="fd-rc-amount">${ev.amount} QAR</div>
            <div class="fd-rc-desc">${ev.type==="received"?"Received from <b>"+escapeHtml(ev.name)+"</b>":
              ev.type==="sent"?"Sent to <b>"+escapeHtml(ev.name)+"</b>":
              "Settled with <b>"+escapeHtml(ev.name)+"</b>"}
            </div>
            <div class="fd-rc-date">${escapeHtml(ev.date)}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="fd-stats-label">Your Stats</div>
    <div class="fd-stats-grid">
      <div class="fd-sg-card"><div class="fd-sg-label">Spends</div><div class="fd-sg-value">${demo.spends}</div></div>
      <div class="fd-sg-card"><div class="fd-sg-label">Shares</div><div class="fd-sg-value">${demo.shares}</div></div>
      <div class="fd-sg-card"><div class="fd-sg-label">Top Spend</div><div class="fd-sg-value">${demo.topSpend}</div></div>
      <div class="fd-sg-card"><div class="fd-sg-label">Settled</div><div class="fd-sg-value">${demo.settled}</div></div>
    </div>
    <div class="fd-footer"><em>Connect your API for live analytics and history.</em></div>
  </div>`;

  // Friend cards: render and handle context action panels
  const friendListEl = container.querySelector('#fd-friend-list');
  let openPanelFriend = null;
  friendListEl.innerHTML = allFriends.map((f,i)=>{
    let initials=f.name.split(" ").map(n=>n[0]).join('').toUpperCase().slice(0,2);
    let color=f.net>0?"#21a065":f.net<0?"#e53935":"#789";
    let status=f.net>0?"Owes You":f.net<0?"You Owe":"Settled";
    return `<div class="fd-friend-card" data-friend="${escapeHtml(f.name)}" tabindex="0" style="animation-delay:${i*.10+.18}s;">
      <span class="fd-friend-avatar" style="background:${color}">${initials}</span>
      <span class="fd-friend-name">${escapeHtml(f.name)}</span>
      <span class="fd-friend-net" style="color:${color};">${f.net>0?'+':f.net<0?'-':''}${Math.abs(f.net)}</span>
      <span class="fd-friend-status" style="background:${color}11;">${status}</span>
      <div class="fd-act-panel" style="display:none;"></div>
    </div>`;
  }).join('');

  // Context action logic
  const friendCards = Array.from(friendListEl.querySelectorAll('.fd-friend-card'));
  friendCards.forEach(card => {
    card.onclick = e => {
      // If already open, close
      if(openPanelFriend === card.getAttribute('data-friend')) {
        card.querySelector('.fd-act-panel').style.display='none';
        card.classList.remove("selected");
        openPanelFriend = null;
        return;
      }
      // Close others
      friendCards.forEach(c=>{
        c.classList.remove("selected");
        c.querySelector('.fd-act-panel').style.display='none';
      });
      card.classList.add("selected");
      openPanelFriend = card.getAttribute('data-friend');
      const actEl = card.querySelector('.fd-act-panel');
      actEl.innerHTML = `
        <div class="fd-act-content">
          <button class="fd-paybtn">Pay</button>
          <button class="fd-txbtn">Transactions</button>
        </div>
      `;
      actEl.style.display='block';
      // Pay modal handler
      actEl.querySelector('.fd-paybtn').onclick = ev => {
        ev.stopPropagation();
        showPayModal(card.getAttribute('data-friend'));
      };
      // Transaction handler (demo: show alert)
      actEl.querySelector('.fd-txbtn').onclick = ev => {
        ev.stopPropagation();
        alert("Show transactions with "+card.getAttribute('data-friend'));
      };
    };
  });

  // Close context panels when clicking outside friend cards
  container.onclick = (e) => {
    if (!e.target.closest('.fd-friend-card')) {
      friendCards.forEach(c=>{
        c.classList.remove('selected');
        c.querySelector('.fd-act-panel').style.display='none';
      });
      openPanelFriend = null;
    }
  };

  function showPayModal(friendName) {
    const modal = document.createElement("div");
    modal.className = "fd-pay-modal";
    modal.innerHTML = `
      <div class="fd-pay-content" style="position:relative;">
        <button class="fd-pay-close">&times;</button>
        <h4>Pay to ${escapeHtml(friendName)}</h4>
        <input class="fd-pay-input" type="number" min="1" placeholder="Amount in QAR"/>
        <button class="fd-pay-confirm">Send Payment</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.fd-pay-close').onclick =
    modal.onclick = ev => { if(ev.target===modal||ev.target.classList.contains('fd-pay-close')) document.body.removeChild(modal);}
    modal.querySelector('.fd-pay-confirm').onclick = ()=> {
      const val = +modal.querySelector('.fd-pay-input').value;
      if(val>0){modal.querySelector('.fd-pay-confirm').textContent="Sending...";setTimeout(()=>{document.body.removeChild(modal);},800);}
    };
  }
}
