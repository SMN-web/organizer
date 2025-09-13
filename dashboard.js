export function showDashboard(container, user) {
  // Replace demo with API data for live app
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
      { type: "received", name: "Bala", amount: 15, date: "2025-09-13" },
      { type: "sent", name: "Sreerag", amount: 18, date: "2025-09-12" },
      { type: "settled", name: "Rafseed", amount: 23, date: "2025-09-11" }
    ]
  };

  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // Compile balances
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allFriends = Object.entries(balances)
    .map(([name, net]) => ({ name, net }));

  // Dashboard HTML & CSS
  container.innerHTML = `
  <style>
    .modern-root { max-width:520px;margin:36px auto;background:#fff;border-radius:28px;box-shadow:0 12px 34px #2277ff16;
      font-family:'Inter',Arial,sans-serif;color:#202e49;padding:2.5em 1.1em 2.1em;animation:fadein1 .7s;}
    @media(max-width:540px){.modern-root{max-width:99vw;padding:0.6em 0.15em 2em;}}
    .modern-title { font-size:2.11em; font-weight:700; margin-bottom:.17em; color:#123; text-align:center;}
    .metric-bar { display:flex;justify-content:center;gap:1em;margin:1.6em 0 1.3em;}
    .metric-pill { background:#1e88e5; color:#fff; font-weight:800; font-size:1.28em;
      border-radius:14px; padding:.9em 1.4em; text-align:center; box-shadow: 0 3px 13px #1976d218;
      transform:translateY(20px); opacity:0; animation:slideup1 .68s forwards;}
    .metric-pill.received {background:#43a047;}
    .metric-pill.owe {background:#e53935;}
    .metric-pill.net {background:linear-gradient(110deg,#43a047 60%,#1e88e5 99%);}
    .modern-badge-net { text-align:center; margin-bottom:1.8em; }
    .netval-anim { border-radius:22px;background:${demo.net>0?"#e9ffe7":demo.net<0?"#feedef":"#ececec"};
      padding:.7em 2.1em;font-weight:900;font-size:1.23em;color:${demo.net>0?"#218c36":demo.net<0?"#e53935":"#888"};
      box-shadow: 0 1px 14px #218c3622;transition:box-shadow .22s;display:inline-block;animation:scaleup1 .68s;}
    .friend-cards-row { display:flex;flex-wrap:wrap;gap:0.9em;justify-content:center;margin:2.7em 0 2.4em;}
    .friend-card { position:relative;display:flex;align-items:center;gap:12px;background:#fbfcfe;
      border-radius:17px;padding:1.14em 1.5em 1em 1.13em;min-width:169px;box-shadow:0 2px 13px #1976d212;
      cursor:pointer;transform:scale(0.93);opacity:0;animation:zoomfade1 .55s var(--delay) forwards;}
    .friend-card.selected,.friend-card:hover { box-shadow:0 9px 22px #1976d212; background:#f2faff;}
    .card-avatar {display:inline-block;width:27px;height:27px;border-radius:50%;text-align:center;font-weight:800;font-size:1.14em;color:#fff;line-height:27px;}
    .card-name {font-weight:700;}
    .card-net {margin-left:auto;margin-right:10px;font-size:1.13em;}
    .card-status {font-size:.97em;margin-left:2px;}
    .pay-btn { background:#1e88e5;color:#fff;border:none;font-weight:700;font-size:1em;padding:0.7em 1.7em;border-radius:8px;cursor:pointer; position:absolute;right:14px;top:13px;display:none;z-index:2;box-shadow:0 2px 5px #1976d221; }
    .activity-block { margin:1.6em 0;}
    .activity-grid { display:grid;grid-template-columns:1fr 1fr;gap:1.2em; }
    @media(max-width:600px){ .activity-grid { grid-template-columns:1fr; } }
    .stat-card { background:#f4f8fb;border-radius:13px;box-shadow:0 2px 12px #2277ff13;text-align:center;padding:1.08em 0.6em;animation:slideup2 .85s;}
    .stat-label { font-size:.97em;color:#1976d2; font-weight:700;}
    .stat-val { font-size:1.21em;font-weight:800;}
    .timeline-section {margin:2.3em 0 1.2em;}
    .tl-row { display:flex;align-items:flex-start;gap:10px;margin-bottom:1.2em;}
    .tl-dot { width:16px;height:16px;border-radius:50%;background:#1e88e5;display:inline-block;margin-right:7px;}
    .tl-row.tl-received .tl-dot { background:#43a047; }
    .tl-row.tl-sent .tl-dot { background:#e53935; }
    .tl-row.tl-settled .tl-dot { background:#789; }
    .tl-details { flex:1 0 auto; }
    .tl-amount { font-size:1.12em;font-weight:700; color:#213348;}
    .tl-desc { font-size:1.0em;margin-bottom:2px;}
    .tl-date { font-size:.98em;color:#789;}
    .pay-modal {
      position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99;background:rgba(24,32,54,0.37);
      display:flex;align-items:center;justify-content:center;
      animation:fadein1 .2s;
    }
    .pay-modal-content { background:#fff; border-radius:13px; box-shadow:0 6px 36px #1976d230;
      padding:2em 2.3em; min-width:270px; text-align:center; }
    .pay-close { position:absolute;right:18px;top:18px;background:none;border:none;font-size:1.5em;color:#1976d2;cursor:pointer;}
    .pay-modal h4 { font-size:1.23em;font-weight:700;margin-bottom:1.1em;color:#215;}
    .pay-amt-input { width:85%;padding:0.7em 0.8em;font-size:1.11em;border-radius:7px;border:1px solid #dde; margin-bottom:1.3em;}
    .pay-confirm { background:#1e88e5;color:#fff;border:none;font-weight:800;font-size:1.07em;padding:.67em 2em; border-radius:7px;cursor:pointer; box-shadow:0 2px 9px #1976d212;}
    @keyframes fadein1 {0%{opacity:0;}100%{opacity:1;}}
    @keyframes scaleup1 {0%{transform:scale(.7);}100%{transform:scale(1);}}
    @keyframes slideup1 {0%{transform:translateY(25px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
    @keyframes zoomfade1 {0%{transform:scale(.8);opacity:0;}100%{transform:scale(1);opacity:1;}}
    @keyframes slideup2 {0%{transform:translateY(33px);opacity:0;}100%{transform:translateY(0);opacity:1;}}
  </style>
  <div class="modern-root" tabindex="0">
    <div class="modern-title">Hi, <b>${escapeHtml(user.name||"User")}</b></div>
    <div class="metric-bar">
      <div class="metric-pill" style="--order:0;">${demo.paidTotal} Paid</div>
      <div class="metric-pill received" style="--order:1;">${demo.owedTotal} Received</div>
      <div class="metric-pill owe" style="--order:2;">${demo.youOwe} Owe</div>
      <div class="metric-pill net" style="--order:3;">${demo.net>=0?'+':'-'}${Math.abs(demo.net)} Net</div>
    </div>
    <div class="modern-badge-net">
      <span class="netval-anim">${demo.net>=0?'+':'-'}${Math.abs(demo.net)} QAR Net Balance</span>
    </div>
    <div class="friend-cards-row">
      ${allFriends.map((f,i)=>{
        let color = f.net>0?"#43a047":f.net<0?"#e53935":"#789";
        let status = f.net>0?"Owes Me":f.net<0?"I Owe":"Settled";
        let initials = f.name.split(" ").map(n=>n[0]).join('').toUpperCase().slice(0,2);
        return `<div class="friend-card" data-friend="${escapeHtml(f.name)}" style="--delay:${i*.13+0.23}s;">
          <span class="card-avatar" style="background:${color}">${initials}</span>
          <span class="card-name">${escapeHtml(f.name)}</span>
          <span class="card-net" style="color:${color};font-weight:700;">${f.net>0?'+':f.net<0?'-':''}${Math.abs(f.net)}</span>
          <small class="card-status" style="color:${color};margin-left:7px;">${status}</small>
          <button class="pay-btn">Pay</button>
        </div>`;
      }).join('')}
    </div>
    <div class="timeline-section">
      <h3 style="font-size:1.09em;color:#1976d2;text-align:left;margin-bottom:0.6em;">Recent Activity</h3>
      ${(demo.recent||[]).map((ev,i)=>`
        <div class="tl-row tl-${ev.type}" style="animation-delay:${i*.08+.77}s;">
          <span class="tl-dot"></span>
          <div class="tl-details">
            <div class="tl-amount">${ev.amount} QAR</div>
            <div class="tl-desc">${ev.type==="received"?"Received from <b>"+escapeHtml(ev.name)+"</b>":
              ev.type==="sent"?"Sent to <b>"+escapeHtml(ev.name)+"</b>":
              "Settled with <b>"+escapeHtml(ev.name)+"</b>"}
            </div>
            <div class="tl-date">${escapeHtml(ev.date)}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="activity-block">
      <div class="activity-grid">
        <div class="stat-card"><div class="stat-label">Spends</div><div class="stat-val">${demo.spends}</div></div>
        <div class="stat-card"><div class="stat-label">Shares</div><div class="stat-val">${demo.shares}</div></div>
        <div class="stat-card"><div class="stat-label">Top Spend</div><div class="stat-val">${demo.topSpend}</div></div>
        <div class="stat-card"><div class="stat-label">Settled</div><div class="stat-val">${demo.settled}</div></div>
      </div>
    </div>
    <div style="margin:2em auto 0 auto;text-align:center;color:#99acd5;font-size:1.08em;">
      <em>Connect your API for real-time group balances.</em>
    </div>
  </div>`;

  // Pay modal logic, realistic interaction
  let openModalFriend = null;
  const friendsDivs = container.querySelectorAll('.friend-card');
  friendsDivs.forEach(card => {
    const btn = card.querySelector('.pay-btn');
    card.onclick = e => {
      e.stopPropagation();
      // Only show for this card, hide others
      friendsDivs.forEach(c=>{
        c.classList.remove("selected");
        if(c!==card)c.querySelector('.pay-btn').style.display='none';
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
    if (!e.target.closest('.friend-card')) {
      friendsDivs.forEach(c=>{
        c.classList.remove('selected');
        c.querySelector('.pay-btn').style.display='none';
      });
      openModalFriend = null;
    }
  };

  // Animated metric values
  function animateUp(cls, toVal) {
    const el = container.querySelector(cls); if(!el) return;
    let cur=0, inc=Math.ceil(toVal/44);
    function step() {
      if(cur>=toVal){ el.textContent = toVal+" QAR"; return;}
      cur += inc; el.textContent = Math.min(cur,toVal) +" QAR";
      requestAnimationFrame(step);
    }
    step();
  }
  setTimeout(()=>{animateUp('.metric-pill',demo.paidTotal);},550);
  setTimeout(()=>{animateUp('.metric-pill.received',demo.owedTotal);},670);
  setTimeout(()=>{animateUp('.metric-pill.owe',demo.youOwe);},800);
  setTimeout(()=>{animateUp('.metric-pill.net',demo.net);},930);

  // Pay modal
  function showPayModal(friendName) {
    const modal = document.createElement("div");
    modal.className = "pay-modal";
    modal.innerHTML = `
      <div class="pay-modal-content">
        <button class="pay-close">&times;</button>
        <h4>Pay to ${escapeHtml(friendName)}</h4>
        <input class="pay-amt-input" type="number" min="1" placeholder="Amount in QAR"/>
        <button class="pay-confirm">Send Payment</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.pay-close').onclick =
    modal.onclick = ev => { if(ev.target===modal||ev.target.classList.contains('pay-close')) document.body.removeChild(modal);}
    modal.querySelector('.pay-confirm').onclick = ()=> {
      const val = +modal.querySelector('.pay-amt-input').value;
      if(val>0){modal.querySelector('.pay-confirm').textContent="Sending...";setTimeout(()=>{document.body.removeChild(modal);},800);}
    };
  }
}
