export function showDashboard(container, user) {
  // DEMO DATA -- swap for backend!
  const demo = {
    paidTotal: 342,
    owedTotal: 119,
    youOwe: 41,
    net: 78,
    spends: 12,
    topSpend: 120,
    shares: 22,
    settled: 9,
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
  // Friend balances for rendering
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allFriends = Object.entries(balances).map(([name, net]) => ({ name, net }));
  const settledPct = Math.min(100,Math.round(demo.settled/(demo.settled+demo.spends)*100));
  const netColor = demo.net>0?"#43a047":demo.net<0?"#e53935":"#789";
  const netBG = demo.net>0?"#e7fff0":demo.net<0?"#ffe6e6":"#ececec";

  function donutSVG(owed, owe, net) {
    const tot = owed+owe, c = 2*Math.PI*38, pct1 = tot ? owed/tot : 0, pct2 = tot ? owe/tot : 0;
    return `
      <svg width="88" height="88" viewBox="0 0 88 88" style="display:block;margin:0 auto 0.2em;">
        <circle r="38" cx="44" cy="44" fill="#f3f8fc"/>
        <circle r="38" cx="44" cy="44" fill="none" stroke="#43a047" stroke-width="12"
          stroke-dasharray="${pct1*c},${c}" stroke-linecap="round" />
        <circle r="38" cx="44" cy="44" fill="none" stroke="#e53935" stroke-width="12"
          stroke-dasharray="${pct2*c},${c}" stroke-linecap="round"
          style="transform:rotate(${pct1*360}deg);transform-origin:44px 44px;" />
        <text x="44" y="54" text-anchor="middle" font-size="24" fill="${netColor}" font-weight="700">${net >= 0 ? '+' : '-'}${Math.abs(net)}</text>
      </svg>
      <div style="font-size:.99em;font-weight:700;text-align:center;">
        <span style="color:#43a047;">Owed (Green)</span> &bull; <span style="color:#e53935;">Owe (Red)</span>
      </div>
    `;
  }

  container.innerHTML = `
  <style>
    .fd-main { max-width: 540px; margin: 36px auto; font-family: 'Inter', Arial, sans-serif; color: #1a2440; background: #fafdff; border-radius: 22px; box-shadow: 0 8px 24px #176dc418; padding: 2em 1em 2.7em;}
    @media(max-width:540px){.fd-main{max-width:99vw;}}
    .fd-title { font-size:2.2em; font-weight:700; color:#124; text-align:center; margin-bottom:1em; }
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
    .fd-friends-section { margin:1.6em 0 1.6em;}
    .fd-friends-label { font-size:1.13em; color:#176dc4;font-weight:800; margin-bottom:.7em;}
    .fd-cardlist { margin:0 0 0.8em 0;}
    .fd-fcard {
      background:#fff; border-radius:13px; box-shadow:0 1px 6px #146dd012; position:relative; margin-bottom:0.7em;
      padding:0.09em 0 0.09em 0; display:flex;flex-direction:column;align-items:flex-start; min-height:53px;
    }
    .fd-fcard.green { border-left:5.5px solid #43a047;}
    .fd-fcard.red { border-left:5.5px solid #e53935;}
    .fd-fcard.gray { border-left:5.5px solid #bbc;}
    .fd-fcard-content { display:flex;align-items:center;width:100%;gap:.74em;padding:0.65em 0.7em 0.52em 1em;}
    .fd-fcard-avatar { background:#e3f2fd; color:#1976d2; font-weight:700; font-size:1.07em;width:27px;height:27px;text-align:center;line-height:27px;border-radius:14px;}
    .fd-fcard-name { font-weight:700; font-size:1.08em; flex:1 1 auto;}
    .fd-fcard-net { color:inherit; font-size:1.16em; min-width:40px; text-align:left; padding-left:0.5em;}
    .fd-fcard-status { font-size:.99em;font-weight:600;margin:-2px 0 4px 1.69em;}
    .fd-fcard.green .fd-fcard-status { color:#43a047; }
    .fd-fcard.red .fd-fcard-status { color:#e53935; }
    .fd-fcard.gray .fd-fcard-status { color:#888; }
    .fd-fbtnbar-wrap {width:100%;padding:0;margin:0;overflow:hidden;}
    .fd-fbtnbar { display:flex; justify-content:center; gap:1em; width:100%; padding:0; margin:0; transition:.13s; }
    .fd-fbtn { font-size:1.05em;font-weight:700;padding:0.6em 1.25em;border:none; border-radius:8px;color:#fff;cursor:pointer; box-shadow:0 1px 6px #176dc410; margin:0.22em 0; }
    .fd-fbtn.pay { background:#176dc4;}
    .fd-fbtn.tx { background:#43a047;}
    .fd-fbtn:hover { background:#e53935 !important;}
    .fd-fbtnbar-wrap { max-height:0; opacity:0; transition:max-height .23s, opacity .14s; pointer-events:none;}
    .fd-fcard.fd-open .fd-fbtnbar-wrap { max-height:70px; opacity:1; pointer-events:auto; animation:dropSlide .33s; }
    @keyframes dropSlide { 0% { max-height:0;opacity:0;} 100%{ max-height:70px; opacity:1; } }
    .fd-activity-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.46em; gap:0.2em;}
    .fd-rec-label {font-size:1.07em;color:#176dc4;font-weight:800;}
    .fd-rec-link { font-size:.98em;color:#1976d2;font-weight:700; text-decoration:underline; cursor:pointer; margin-left:auto;}
    .fd-rec-list { margin-bottom:1.7em;}
    .fd-rec-card { background:#fff;border-radius:10px;box-shadow:0 1px 5px #1976d213; margin-bottom:0.7em;padding:1em 1em; display:flex;align-items:center; gap:1em;}
    .fd-rc-dot { width:13px;height:13px;border-radius:50%;background:#1976d2;display:inline-block;}
    .fd-rc-dot.received {background:#43a047;}
    .fd-rc-dot.sent {background:#e53935;}
    .fd-rc-dot.settled {background:#789;}
    .fd-rc-amount {font-size:1.09em;font-weight:800;color:#223b57;}
    .fd-rc-desc {font-size:.98em;font-weight:600;color:#4570a2;}
    .fd-rc-date {font-size:.97em;color:#789;}
    .fd-stats-label {font-size:1.04em;color:#176dc4;font-weight:700;margin-top:1.5em;margin-bottom:.78em;text-align:left;}
    .fd-stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.12em;}
    .fd-sg-card { background:#e3f8fe;border-radius:11px; box-shadow:0 1px 8px #1976d212;text-align:center;padding:1em 0.7em;}
    .fd-sg-label {font-size:.97em;color:#176dc4;font-weight:700;}
    .fd-sg-value { font-size:1.21em;font-weight:800;}
    .fd-footer {margin:1.5em auto 0;text-align:center;color:#99acd5;font-size:1.09em;}
    .fd-pay-modal { position: fixed; left:0; top:0; width:100vw; height:100vh; z-index:99; background:rgba(24,32,54,0.28); display:flex; align-items:center; justify-content:center;}
    .fd-pay-content { background:#fff; border-radius:13px; box-shadow:0 6px 36px #1976d230; padding:2em 2.3em; min-width:260px; text-align:center;}
    .fd-pay-close { position:absolute; right:16px; top:16px; background:none; border:none; font-size:1.5em; color:#176dc4; cursor:pointer;}
    .fd-pay-content h4 {font-size:1.19em;font-weight:700;margin-bottom:1em;}
    .fd-pay-input {width:85%;padding:0.6em 0.7em;font-size:1em;border-radius:7px;border:1px solid #abc; margin-bottom:1.18em;}
    .fd-pay-confirm { background:#3897d1; color:#fff; border:none; font-weight:700; font-size:1.03em; padding:.62em 1.9em; border-radius:6px;cursor:pointer; box-shadow:0 2px 7px #176dc422;}
  </style>
  <div class="fd-main">
    <div class="fd-title">Group Payments Dashboard</div>
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
    <div class="fd-friends-section">
      <div class="fd-friends-label">Balance with Friends</div>
      <div class="fd-cardlist">
        ${allFriends.map((f,i)=>{
          let initials = f.name.split(" ").map(n=>n[0]).join('').toUpperCase().slice(0,2);
          let statusC = f.net>0?'green':f.net<0?'red':'gray';
          let barC = f.net>0?'#43a047':f.net<0?'#e53935':'#bbc';
          let label = f.net>0?"Owes You":f.net<0?"You Owe":"Settled";
          return `<div class="fd-fcard ${statusC}" data-friend="${escapeHtml(f.name)}" tabindex="0">
            <div style="background:${barC};width:5.5px;height:100%;position:absolute;left:0;top:0;border-radius:8px 0 0 8px;"></div>
            <div class="fd-fcard-content fd-fcard-main">
              <span class="fd-fcard-avatar">${initials}</span>
              <span class="fd-fcard-name">${escapeHtml(f.name)}</span>
              <span class="fd-fcard-net" style="color:${barC};">${f.net>0?'+':f.net<0?'-':''}${Math.abs(f.net)}</span>
            </div>
            <div class="fd-fcard-status">${label}</div>
            <div class="fd-fbtnbar-wrap">
              <div class="fd-fbtnbar" style="display:none;">
                ${f.net<0?`
                  <button class="fd-fbtn pay">Pay</button>
                `:''}
                <button class="fd-fbtn tx">Transactions</button>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="fd-activity-row">
      <div class="fd-rec-label">Recent Activity</div>
      <a class="fd-rec-link" href="#" onclick="event.preventDefault();alert('Go to transactions/all friends page')">Transactions</a>
    </div>
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

  // Friend cards: Pay/Transactions buttons (Pay button only for "You Owe")
  const cardEls = container.querySelectorAll('.fd-fcard');
  let openCard = null;
  cardEls.forEach(card=>{
    card.onclick = e => {
      e.stopPropagation();
      if(openCard === card) {
        card.classList.remove('fd-open');
        card.querySelector('.fd-fbtnbar').style.display = 'none';
        openCard = null;
        return;
      }
      cardEls.forEach(c=>{
        c.classList.remove('fd-open');
        c.querySelector('.fd-fbtnbar').style.display = 'none';
      });
      card.classList.add('fd-open');
      openCard = card;
      card.querySelector('.fd-fbtnbar').style.display = 'flex';
      let payBtn = card.querySelector('.fd-fbtn.pay');
      if(payBtn) {
        payBtn.onclick = ev => {
          ev.stopPropagation();
          showPayModal(card.getAttribute('data-friend'));
        };
      }
      card.querySelector('.fd-fbtn.tx').onclick = ev => {
        ev.stopPropagation();
        alert("Show transactions with "+card.getAttribute('data-friend'));
      };
    };
  });
  container.onclick = (e) => {
    if (!e.target.closest('.fd-fcard')) {
      cardEls.forEach(c=>{
        c.classList.remove('fd-open');
        c.querySelector('.fd-fbtnbar').style.display='none';
      });
      openCard = null;
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
