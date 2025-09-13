export function showDashboard(container, user) {
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

  // Utility
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // Prepare friend balances
  const balances = {};
  demo.friendsOwe.forEach(f => { balances[f.name] = (balances[f.name]||0) + f.amount; });
  demo.youOweList.forEach(f => { balances[f.name] = (balances[f.name]||0) - f.amount; });
  const allFriends = Object.entries(balances)
    .map(([name, net]) => ({ name, net }));

  let payModalTimeout;

  // Dashboard HTML
  container.innerHTML = `
  <style>
    .mdl-root { max-width:520px;margin:36px auto 0;background:#fff;border-radius:22px;box-shadow:0 8px 38px #2277ff10;
      font-family:'Inter',Arial,sans-serif;color:#222;padding:2em 0.6em 2.1em;animation:fadein .7s;}
    @media(max-width:540px){.mdl-root{max-width:99vw;padding:0.5em 0.1em 2em;}}
    .summary-row { display:flex;justify-content:center;align-items:center;gap:1.1em;margin-bottom:1.2em; }
    .pill-card { padding:1.1em 1.6em; border-radius:18px;font-weight:800;font-size:1.22em;box-shadow:0 4px 12px #0002;margin-bottom:10px; }
    .pill-paid { background:linear-gradient(110deg,#cceefd,#e3f2fd); color:#1873d1;}
    .pill-rec { background:linear-gradient(110deg,#e0ffd7,#f6fff0); color:#2da356;}
    .pill-ow { background:linear-gradient(110deg,#ffe3e3,#fff0f5); color:#e53935;}
    .mdl-balance-badge { border-radius:13px;background:${demo.net>0?"#e9ffe7":demo.net<0?"#ffe3e3":"#eeedef"};padding:0.7em 2.1em;
      font-weight:800;font-size:1.26em;box-shadow:0 4px 16px #43a04722;color:${demo.net>0?"#218c36":demo.net<0?"#e53935":"#888"};}
    .mdl-bal-list { display:flex;gap:0.66em;flex-wrap:wrap;justify-content:center;margin:2.6em 0 2.2em;}
    .card-friend { position:relative;display:flex;align-items:center;gap:10px;background:#f7fbfd;
      border-radius:14px;padding:1.04em 1.2em 1em 1.12em;margin-bottom:7px;font-size:1.02em;min-width:175px;box-shadow:0 2px 14px #1976d214;cursor:pointer; transition:box-shadow 0.1s;}
    .card-friend.selected,.card-friend:hover { box-shadow:0 4px 20px #1976d218; }
    .card-avatar {display:inline-block;width:26px;height:26px;border-radius:50%;text-align:center;font-weight:800;font-size:1.04em;color:#fff;line-height:26px;margin-right:2px;}
    .card-fnet {margin-left:auto;margin-right:10px;}
    .card-status {font-size:.96em;margin-left:2px;}
    .pay-modal {
      position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99;background:rgba(24,32,54,0.37);
      display:flex;align-items:center;justify-content:center;
    }
    .pay-modal-content { background:#fff; border-radius:12px; box-shadow:0 6px 36px #1976d230;
      padding:2em 2.3em; min-width:260px; text-align:center; }
    .pay-close { position:absolute;right:18px;top:18px;background:none;border:none;font-size:1.5em;color:#1976d2;cursor:pointer;}
    .pay-modal h4 { font-size:1.23em;font-weight:700;margin-bottom:1.1em;color:#215;}
    .pay-amt-input { width:85%;padding:0.6em 0.7em;font-size:1.05em;border-radius:6px;border:1px solid #dde; margin-bottom:1.2em;}
    .pay-confirm { background:#1e88e5;color:#fff;border:none;font-weight:700;font-size:1.09em;padding:0.65em 2.3em; border-radius:7px;cursor:pointer; }
    .mdl-section { margin-top:1.8em;}
    .stats-grid { display:grid;grid-template-columns:1fr 1fr;gap:1em;margin:1em 0;}
    .stat-card { background:#f4f8fb;border-radius:11px;box-shadow:0 2px 12px #2277ff12;text-align:center;padding:1.05em 0.5em;}
    .stat-label { font-size:.97em;color:#1976d2; font-weight:700;margin-bottom:0.2em;}
    .stat-val { font-size:1.21em;font-weight:800;}
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
    .mdl-actions {display:flex;gap:1em;justify-content:right;margin-top:.9em;}
    .mdl-action-btn { border:none;font-size:1.06em;font-weight:700;padding:0.92em 1.4em;border-radius:9px;box-shadow:0 2px 9px #1976d210;cursor:pointer;background:#1e88e5;color:#fff;transition:.15s;}
    .mdl-action-btn.addfr { background:#43a047;}
    .mdl-action-btn.export { background:#ffd54f;color:#111;}
    @keyframes fadein {0%{opacity:0;}100%{opacity:1;}}
  </style>
  <div class="mdl-root" tabindex="0">
    <div class="summary-row">
      <div class="pill-card pill-paid" title="Total paid to others">${demo.paidTotal} Paid</div>
      <div class="pill-card pill-rec" title="Total received from friends">${demo.owedTotal} Received</div>
      <div class="pill-card pill-ow" title="Amount you owe friends">${demo.youOwe} Owe</div>
    </div>
    <div class="mdl-balance-badge">
      Net Balance: ${demo.net>0?'+':'-'}${Math.abs(demo.net)} QAR
    </div>
    <div class="mdl-actions">
      <button class="mdl-action-btn addfr">Add Friend</button>
      <button class="mdl-action-btn export">Export</button>
    </div>
    <div class="mdl-section">
      <h3 style="font-size:1.09em;color:#1976d2;text-align:left;margin-bottom:0.6em;">Friends' Balances</h3>
      <div class="mdl-bal-list">
        ${allFriends.map(f=>{
          let color = f.net>0?"#43a047":f.net<0?"#e53935":"#789";
          let status = f.net>0?"Owes Me":f.net<0?"I Owe":"Settled";
          let initials = f.name.split(" ").map(n=>n[0]).join('').toUpperCase().slice(0,2);
          return `<div class="card-friend" data-friend="${escapeHtml(f.name)}">
            <span class="card-avatar" style="background:${color}">${initials}</span>
            <span class="card-fname">${escapeHtml(f.name)}</span>
            <span class="card-fnet" style="color:${color};font-weight:700;">${f.net>0?'+':f.net<0?'-':''}${Math.abs(f.net)}</span>
            <small class="card-status" style="color:${color}">${status}</small>
            <button class="mdl-action-btn" style="background:#1e88e5;position:absolute;right:17px;top:13px;font-size:.99em;padding:7px 1em;display:none;z-index:2;">Pay</button>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="mdl-section mdl-timeline">
      <h3 style="font-size:1.09em;color:#1976d2;margin-bottom:0.6em;text-align:left;">Recent Activity</h3>
      ${(demo.recent||[]).map(ev=>`
        <div class="tl-row tl-${ev.type}">
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
    <div class="mdl-section">
      <h3 style="font-size:1.03em;color:#1976d2;text-align:left;margin-bottom:0.2em;">Your Stats</h3>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-label">Spends</div><div class="stat-val">${demo.spends}</div></div>
        <div class="stat-card"><div class="stat-label">Shares</div><div class="stat-val">${demo.shares}</div></div>
        <div class="stat-card"><div class="stat-label">Top Spend</div><div class="stat-val">${demo.topSpend}</div></div>
        <div class="stat-card"><div class="stat-label">Settled</div><div class="stat-val">${demo.settled}</div></div>
      </div>
    </div>
    <div style="margin:2em auto 0 auto;text-align:center;color:#99acd5;font-size:1.07em;">
      <em>Connect your API for live, actionable insights!</em>
    </div>
  </div>`;

  // --Pay modal logic--
  const friendsDivs = container.querySelectorAll('.card-friend');
  let openModalFriend = null;
  friendsDivs.forEach(card => {
    const btn = card.querySelector('.mdl-action-btn');
    card.onclick = (e) => {
      e.stopPropagation();
      // Hide any open pay modals/buttons not for this friend
      friendsDivs.forEach(c=>{
        c.classList.remove("selected");
        if(c!==card)c.querySelector('.mdl-action-btn').style.display='none';
      });
      card.classList.add("selected"); btn.style.display="inline-block";
      openModalFriend = card.getAttribute('data-friend');
    };
    btn.onclick = (ev) => {
      ev.stopPropagation();
      showPayModal(openModalFriend||card.getAttribute('data-friend'));
    };
  });

  // When clicking outside, hide pay button for all
  container.onclick = (e) => {
    if (!e.target.closest('.card-friend')) {
      friendsDivs.forEach(c=>{
        c.classList.remove('selected');
        c.querySelector('.mdl-action-btn').style.display='none';
      });
      openModalFriend = null;
    }
  };

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
    modal.onclick = (ev) => { if(ev.target===modal||ev.target.classList.contains('pay-close')) document.body.removeChild(modal); };
    modal.querySelector('.pay-confirm').onclick = () => {
      const val = +modal.querySelector('.pay-amt-input').value;
      if(val>0) {
        modal.querySelector('.pay-confirm').textContent = "Sending...";
        setTimeout(()=>{document.body.removeChild(modal);},700);
        // Use your API to send payment here
      }
    };
  }
}
