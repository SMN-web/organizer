export function showDashboard(container, user) {
  // Replace demo with your live backend data!
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

  // Balance with friends
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allFriends = Object.entries(balances)
    .map(([name, net]) => ({ name, net }));

  // Dashboard HTML & CSS: Pastel panels, glazed grouping, ultra-readable
  container.innerHTML = `
  <style>
    .f-dash-main { max-width:520px; margin:38px auto; font-family:'Inter',Arial,sans-serif; color:#223; background:#fafdff; border-radius:22px; box-shadow:0 8px 32px #1e90ff19; padding:2.5em 1.2em 2.6em; }
    @media(max-width:540px){.f-dash-main{max-width:99vw;padding:1em 0.15em 2em;}}
    .f-dash-title { font-size:2.3em; font-weight:700; color:#124; text-align:center; margin-bottom:.7em; letter-spacing:.01em;}
    .f-balance-panel { background:linear-gradient(90deg,#c3eaff,#ffffff 65%); border-radius:18px; box-shadow: 0 3px 23px #1976d219; padding:1.6em; margin-bottom:2.2em; text-align:center;}
    .f-balance-label { font-size:1em;color:#3178c6;font-weight:700;margin-bottom:0.13em;}
    .f-balance-value { font-size:2.03em; font-weight:900; color: #176dc4; letter-spacing:.01em;}
    .f-balance-net { font-size:1.13em; font-weight:700; color:${demo.net>0?"#43a047":demo.net<0?"#e53935":"#789"};background:${demo.net>0?"#e3ffe7":demo.net<0?"#ffdede":"#ececec"};border-radius:9px;padding:0.33em 1em;display:inline-block;box-shadow:0 2px 11px #43a04725;margin:0.19em 0;}
    .f-metrics-row { display:flex; gap:1.2em; margin-bottom:2.3em; justify-content:center;}
    .f-metric-card { flex:1 0 95px;padding:1.2em 1em; background:linear-gradient(110deg,#f3fcff,#ededfb); border-radius:15px; text-align:center; box-shadow:0 3px 20px #176dc42a; font-size:1.12em;}
    .f-metric-label { color:#3897d1;font-weight:700;font-size:1em;margin-bottom:2px;}
    .f-metric-value { color:#223b57;font-size:1.4em;font-weight:900;}
    .f-friends-group { margin:2em 0 2.3em;}
    .f-friends-label { font-size:1.07em; color:#176dc4;font-weight:800; margin-bottom:.8em;}
    .f-friends-list { display:flex;flex-wrap:wrap;gap:0.9em;justify-content:left;}
    .f-friend-card { background:linear-gradient(90deg,#fafdff,#defee5 80%); border-radius:13px; padding:1.05em 0.9em 0.95em 1.02em; box-shadow:0 1.5px 12px #29a0650a; min-width:145px; display:flex;flex-direction:column; align-items:start;transition:.18s;position:relative;}
    .f-friend-avatar { display:inline-block;width:25px;height:25px;font-weight:700;font-size:1.02em;text-align:center;padding:0px;border-radius:99px;background:#e3f2fd;color:#1976d2; margin-bottom:3px;}
    .f-friend-name { font-weight:700; font-size:1.09em; margin-bottom:1px;}
    .f-friend-net { font-size:1.01em;font-weight:800;color: #2ca156;margin-bottom:2px;}
    .f-friend-status { background:${demo.net>0?"#e3fbe8":demo.net<0?"#fee":"#eee"};color:${demo.net>0?"#2ca156":demo.net<0?"#e53935":"#888"};border-radius:6px;padding:0.2em 0.7em;font-weight:600;font-size:.97em;}
    .f-paybtn { position:absolute;right:11px;bottom:13px;background:#3178c6;color:#fff;border:none; border-radius:6px;font-weight:700;font-size:1em;padding:7px 19px;cursor:pointer;box-shadow:0 1px 7px #176dc41b; }
    .f-recent-label {font-size:1.07em;color:#176dc4;font-weight:800;margin-bottom:0.6em;}
    .f-recent-list { margin-bottom:2em;}
    .f-recent-card { background:#fff;border-radius:10px;box-shadow:0 1px 7px #1976d213; margin-bottom:0.8em;padding:1em 1.3em; display:flex;align-items:center; gap:1em;}
    .f-rc-dot { width:15px;height:15px;border-radius:50%;background:#1976d2;display:inline-block;}
    .f-rc-dot.received {background:#43a047;}
    .f-rc-dot.sent {background:#e53935;}
    .f-rc-dot.settled {background:#789;}
    .f-rc-details { flex:1;}
    .f-rc-amount {font-size:1.11em;font-weight:800;color:#223b57;}
    .f-rc-desc {font-size:.99em;font-weight:600;color:#4570a2;}
    .f-rc-date {font-size:.98em;color:#789;}
    .f-stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.15em; }
    @media(max-width:600px){ .f-stats-grid { grid-template-columns:1fr; } }
    .f-sg-card { background:#e3f8fe;border-radius:10px; box-shadow:0 1px 8px #1976d212;text-align:center;padding:1em 0.7em;}
    .f-sg-label {font-size:.98em;color:#176dc4;font-weight:700;}
    .f-sg-value { font-size:1.18em;font-weight:800;}
    .f-stats-label {font-size:1.03em;color:#176dc4;font-weight:700;margin-top:1.8em;margin-bottom:0.7em;text-align:left;}
    .f-dash-footer {margin:2em auto 0;text-align:center;color:#99acd5;font-size:1.08em;}
    .f-pay-modal {
      position: fixed; left:0; top:0; width:100vw; height:100vh; z-index:99;
      background:rgba(24,32,54,0.30); display:flex; align-items:center; justify-content:center;
      animation:fadein1 .2s;
    }
    .f-pay-content { background:#fff; border-radius:13px; box-shadow:0 6px 36px #1976d230;
      padding:2em 2.3em; min-width:260px; text-align:center;}
    .f-pay-close { position:absolute; right:16px; top:16px; background:none; border:none; font-size:1.5em; color:#176dc4; cursor:pointer;}
    .f-pay-content h4 {font-size:1.2em;font-weight:700;margin-bottom:1em;}
    .f-pay-input {width:85%;padding:0.6em 0.7em;font-size:1em;border-radius:6px;border:1px solid #abc; margin-bottom:1.18em;}
    .f-pay-confirm { background:#3897d1; color:#fff; border:none; font-weight:700; font-size:1.02em; padding:.63em 2em; border-radius:6px;cursor:pointer; box-shadow:0 2px 7px #176dc422;}
    @keyframes fadein1 {0%{opacity:0;}100%{opacity:1;}}
  </style>
  <div class="f-dash-main">
    <div class="f-dash-title">Welcome, <b>${escapeHtml(user.name||"User")}</b></div>
    <div class="f-balance-panel">
      <div class="f-balance-label">Current Group Balance</div>
      <div class="f-balance-value">${demo.paidTotal} QAR</div>
      <div class="f-balance-net">${demo.net>=0?'+':'-'}${Math.abs(demo.net)} QAR Net</div>
    </div>
    <div class="f-metrics-row">
      <div class="f-metric-card">
        <div class="f-metric-label">Paid</div>
        <div class="f-metric-value">${demo.paidTotal}</div>
      </div>
      <div class="f-metric-card">
        <div class="f-metric-label">Received</div>
        <div class="f-metric-value">${demo.owedTotal}</div>
      </div>
      <div class="f-metric-card">
        <div class="f-metric-label">Owe</div>
        <div class="f-metric-value">${demo.youOwe}</div>
      </div>
    </div>
    <div class="f-friends-group">
      <div class="f-friends-label">Balance with Friends</div>
      <div class="f-friends-list">
        ${allFriends.map((f,i)=>{
          let initials=f.name.split(" ").map(n=>n[0]).join('').toUpperCase().slice(0,2);
          let color=f.net>0?"#21a065":f.net<0?"#e53935":"#789";
          let status=f.net>0?"Owes You":f.net<0?"You Owe":"Settled";
          return `<div class="f-friend-card" data-friend="${escapeHtml(f.name)}">
            <span class="f-friend-avatar" style="background:${color}">${initials}</span>
            <span class="f-friend-name">${escapeHtml(f.name)}</span>
            <span class="f-friend-net" style="color:${color};">${f.net>0?'+':f.net<0?'-':''}${Math.abs(f.net)}</span>
            <span class="f-friend-status" style="background:${color}11;">${status}</span>
            <button class="f-paybtn">Pay</button>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="f-recent-label">Recent Activity</div>
    <div class="f-recent-list">
      ${(demo.recent||[]).map(ev=>`
        <div class="f-recent-card">
          <span class="f-rc-dot ${ev.type}"></span>
          <div class="f-rc-details">
            <div class="f-rc-amount">${ev.amount} QAR</div>
            <div class="f-rc-desc">${ev.type==="received"?"Received from <b>"+escapeHtml(ev.name)+"</b>":
              ev.type==="sent"?"Sent to <b>"+escapeHtml(ev.name)+"</b>":
              "Settled with <b>"+escapeHtml(ev.name)+"</b>"}
            </div>
            <div class="f-rc-date">${escapeHtml(ev.date)}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="f-stats-label">Your Stats</div>
    <div class="f-stats-grid">
      <div class="f-sg-card"><div class="f-sg-label">Spends</div><div class="f-sg-value">${demo.spends}</div></div>
      <div class="f-sg-card"><div class="f-sg-label">Shares</div><div class="f-sg-value">${demo.shares}</div></div>
      <div class="f-sg-card"><div class="f-sg-label">Top Spend</div><div class="f-sg-value">${demo.topSpend}</div></div>
      <div class="f-sg-card"><div class="f-sg-label">Settled</div><div class="f-sg-value">${demo.settled}</div></div>
    </div>
    <div class="f-dash-footer"><em>Connect your API for live group analytics.</em></div>
  </div>`;

  // Interactive pay modal
  let openModalFriend = null;
  const friendsDivs = container.querySelectorAll('.f-friend-card');
  friendsDivs.forEach(card => {
    const btn = card.querySelector('.f-paybtn');
    card.onclick = e => {
      e.stopPropagation();
      friendsDivs.forEach(c=>{
        c.classList.remove("selected");
        if(c!==card)c.querySelector('.f-paybtn').style.display='none';
      });
      card.classList.add("selected"); btn.style.display="inline-block";
      openModalFriend = card.getAttribute('data-friend');
    };
    btn.onclick = ev => {
      ev.stopPropagation();
      showPayModal(openModalFriend||card.getAttribute('data-friend'));
    };
  });
  container.onclick = e => {
    if (!e.target.closest('.f-friend-card')) {
      friendsDivs.forEach(c=>{
        c.classList.remove('selected');
        c.querySelector('.f-paybtn').style.display='none';
      });
      openModalFriend = null;
    }
  };

  function showPayModal(friendName) {
    const modal = document.createElement("div");
    modal.className = "f-pay-modal";
    modal.innerHTML = `
      <div class="f-pay-content">
        <button class="f-pay-close">&times;</button>
        <h4>Pay to ${escapeHtml(friendName)}</h4>
        <input class="f-pay-input" type="number" min="1" placeholder="Amount in QAR"/>
        <button class="f-pay-confirm">Send Payment</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.f-pay-close').onclick =
    modal.onclick = ev => { if(ev.target===modal||ev.target.classList.contains('f-pay-close')) document.body.removeChild(modal);}
    modal.querySelector('.f-pay-confirm').onclick = ()=> {
      const val = +modal.querySelector('.f-pay-input').value;
      if(val>0){modal.querySelector('.f-pay-confirm').textContent="Sending...";setTimeout(()=>{document.body.removeChild(modal);},800);}
    };
  }
}
