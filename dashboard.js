export function showDashboard(container, user) {
  // ======= DEMO DATA (replace with your API for production) =======
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
      { status: "pending", from_user: "Bala", to_user: user?.username || "User", amount: 15 },
      { status: "pending", from_user: "Rafseed", to_user: user?.username || "User", amount: 9 }
    ],
    recent: [
      { type: "received", name: "Bala", amount: 15, date: "Today" },
      { type: "sent", name: "Sreerag", amount: 18, date: "Yesterday" },
      { type: "settled", name: "Rafseed", amount: 23, date: "2 days ago" }
    ],
    // API result format: each {name, amount}, amount <0 you owe, >0 owed to you, 0 = settled
    friendsOwe: [
      { name: "Lawrence", amount: -16 },
      { name: "Rafseed", amount: -8 },
      { name: "Shyam", amount: -31 },
      { name: "Sreerag", amount: -18 },
      { name: "Ben", amount: 12 },
      { name: "Bala", amount: 27 },
      { name: "Gokul", amount: 10 },
      { name: "Ramu", amount: 7 },
      { name: "Andy", amount: 0 },
      { name: "Raju", amount: 19 }
    ]
  };
  // ==== END DEMO DATA ==== //

  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<"
        ? "&lt;"
        : t === ">"
        ? "&gt;"
        : t === "&"
        ? "&amp;"
        : "&quot;"
    );
  }
  // ======= VARS & PAGINATION =======
  const balances = demo.friendsOwe;
  const FRIENDS_PER_PAGE = 5;
  let page = 0;
  let openCardIdx = null;
  const netColor = demo.net > 0 ? "#43a047" : demo.net < 0 ? "#e53935" : "#789";
  const netBG = demo.net > 0 ? "#e7fff0" : demo.net < 0 ? "#ffe6e6" : "#ececec";
  const settledPct = Math.min(100, Math.round(demo.settled / (demo.spends + demo.settled) * 100));
  let pendingCount = demo.payments?.filter(p => p.status === 'pending' && p.to_user === (user?.username || "User")).length || 0;

  function donutSVG(owed, owe, net) {
    const tot = owed+owe, c = 2*Math.PI*38, pct1 = tot ? owed/tot : 0, pct2 = tot ? owe/tot : 0;
    let netColor = net > 0 ? "#43a047" : net < 0 ? "#e53935" : "#789";
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
        <span style="color:#43a047;">Owed (Green)</span> • <span style="color:#e53935;">Owe (Red)</span>
        <span style="font-size:.92em;color:#9cacc0;">(Tap chart for legend)</span>
      </div>
      </div>
    `;
  }
  function renderFriendsList() {
    const list = balances.slice(page * FRIENDS_PER_PAGE, page * FRIENDS_PER_PAGE + FRIENDS_PER_PAGE);
    return list.map((f, idx) => {
      let initials = f.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
      let net = f.amount;
      let isGreen = net > 0, isRed = net < 0;
      let leftBar = isRed ? "#e53935" : isGreen ? "#43a047" : "#bbb";
      let status = isRed ? "You Owe" : isGreen ? "Owes You" : "Settled";
      let netColor = isRed ? "#e53935" : isGreen ? "#43a047" : "#888";
      let actions = "";
      if (openCardIdx === idx) {
        actions = `<div class="fd-fbtnbar" style="display:flex;gap:1em;justify-content:center;margin:.35em 0 0 0;">
          ${isRed ? `<button class="fd-fbtn blue">Settle Up</button>` : ''}
          <button class="fd-fbtn blue">Transactions</button>
        </div>`;
      }
      return `
      <div class="fd-fcard" data-idx="${idx}" style="position:relative;background:#fff;border-radius:13px;box-shadow:0 1px 8px #146dd012;margin-bottom:0.7em;min-height:52px;border-left:6px solid ${leftBar};display:flex;flex-direction:column;cursor:pointer;">
        <div style="display:flex;align-items:center;gap:.77em;padding:0.6em 0.8em 0.6em 1em;">
          <span style="background:#e3f2fd;color:#1976d2;font-weight:700;font-size:1.07em;width:27px;height:27px;text-align:center;line-height:27px;border-radius:14px;">${initials}</span>
          <span style="font-weight:700;font-size:1.08em;">${escapeHtml(f.name)}</span>
          <span style="margin-left:auto;color:${netColor};font-size:1.17em;font-weight:700;">${net > 0 ? "+" : net < 0 ? "-" : ""}${Math.abs(net)} QAR</span>
        </div>
        <div style="margin-left:1.8em;font-size:.99em;font-weight:600;color:${netColor};">${status}</div>
        ${actions}
      </div>
      `;
    }).join("");
  }
  function renderFriendsPager() {
    let totalPages = Math.max(1, Math.ceil(balances.length / FRIENDS_PER_PAGE));
    if (totalPages <= 1) return "";
    return `
    <div class="fd-pager-row">
      <button class="fd-pager-btn"${page === 0 ? " disabled" : ""} data-pager="prev">&lt; Prev</button>
      <span class="fd-pager-label">Page ${page + 1} / ${totalPages}</span>
      <button class="fd-pager-btn"${page === totalPages - 1 ? " disabled" : ""} data-pager="next">Next &gt;</button>
    </div>
    `;
  }

  container.innerHTML = `
  <style>
    .fd-main { max-width:540px; margin:36px auto; font-family:'Inter',Arial,sans-serif; color:#1a2440; background:#fafdff; border-radius:22px; box-shadow:0 8px 22px #176dc419; padding:2em 1em 2.5em;}
    @media(max-width:540px){.fd-main{max-width:99vw;}}
    .fd-banner { background: #fffde7; border-radius: 11px; padding: 0.95em 1.7em; margin-bottom: 1.1em; text-align: center; color: #e53935; font-weight: 700; box-shadow: 0 1px 8px #e5393512;}
    .fd-title { font-size:2.08em; font-weight:800; color:#153; text-align:center; margin-bottom:.6em; letter-spacing:.01em;}
    .fd-piepanel { margin-bottom:1em; }
    .fd-net-badge { font-size:2em;font-weight:900;display:block;background:${netBG};color:${netColor};border-radius:15px;text-align:center;margin:0 auto 1.2em auto;padding:.7em 0;letter-spacing:.04em;}
    .fd-metrics-row { display:flex; gap:1em; margin-bottom:2em; justify-content:center;}
    .fd-metric-card { flex:1 0 90px; padding:1em 0.7em; background:linear-gradient(110deg,#f7fafc,#fff6f6); border-radius:13px; text-align:center; box-shadow:0 2px 10px #176dc412;}
    .fd-metric-label { color:#3897d1;font-weight:700;font-size:.98em;}
    .fd-metric-value { color:#2e3b57;font-size:1.2em;font-weight:900;}
    .fd-metric-card.owe .fd-metric-value { color:#e53935 !important;}
    .fd-progress-wrap {margin-bottom:1.8em;}
    .fd-progress-bar { background:#e3f2fd;border-radius:13px;width:80%;max-width:320px;margin:0 auto;height:14px;overflow:hidden;}
    .fd-progress-fill { background:#43a047;height:14px;width:${settledPct}%;border-radius:13px;transition:width .9s;}
    .fd-progress-text {margin-top:0.65em;font-size:1em;color:#198;font-weight:700;text-align:center;}
    .fd-friends-label {font-size:1.21em; color:#176dc4; font-weight:800;margin-bottom:1.1em;}
    .fd-pager-row {text-align:center;display:flex;justify-content:center;align-items:center;gap:1.1em;margin-bottom:1em;}
    .fd-pager-btn {background:#e3f2fd;color:#176dc4;font-weight:700;border:none;border-radius:9px;padding:.47em 1.2em;cursor:pointer;}
    .fd-pager-btn:disabled {background:#ececec;color:#aaa;}
    .fd-pager-label {font-size:1.09em;font-weight:700;color:#7f97ba;}
    .fd-fbtn { font-size:1.06em;font-weight:700;padding:0.61em 1.28em;border:none; border-radius:8px;color:#fff;cursor:pointer; box-shadow:0 1px 6px #176dc410; background:#2566b2;}
    .fd-fbtn.blue:hover { background:#1563a9;}
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
    .fd-pay-modal { position: fixed; left:0; top:0; width:100vw; height:100vh; z-index:99; background:rgba(24,32,54,0.26); display:flex; align-items:center; justify-content:center;}
    .fd-pay-content { background:#fff; border-radius:13px; box-shadow:0 6px 36px #1976d230; padding:2em 2.3em; min-width:260px; text-align:center;}
    .fd-pay-close { position:absolute; right:16px; top:16px; background:none; border:none; font-size:1.5em; color:#176dc4; cursor:pointer;}
    .fd-pay-content h4 {font-size:1.19em;font-weight:700;margin-bottom:1em;}
  </style>
  <div class="fd-main">
    ${pendingCount ?
      `<div class="fd-banner">
        🔔 You have ${pendingCount} payments awaiting your action!
      </div>` : ''}
    <div class="fd-title">Group Payments Dashboard</div>
    <div class="fd-piepanel">${donutSVG(
      balances.filter(f=>f.amount>0).reduce((s,f)=>s+f.amount,0),
      balances.filter(f=>f.amount<0).reduce((s,f)=>s+Math.abs(f.amount),0),
      demo.net
    )}</div>
    <div class="fd-net-badge">${demo.net >= 0 ? "+" : "-"}${Math.abs(demo.net)} QAR Net Balance</div>
    <div class="fd-metrics-row">
      <div class="fd-metric-card"><div class="fd-metric-label">Paid</div><div class="fd-metric-value">${demo.paidTotal}</div></div>
      <div class="fd-metric-card"><div class="fd-metric-label">Received</div><div class="fd-metric-value">${demo.owedTotal}</div></div>
      <div class="fd-metric-card owe"><div class="fd-metric-label">Owe</div><div class="fd-metric-value">${demo.youOwe}</div></div>
    </div>
    <div class="fd-progress-wrap">
      <div class="fd-progress-bar"><div class="fd-progress-fill"></div></div>
      <div class="fd-progress-text">${demo.settled} of ${demo.spends + demo.settled} spends settled!</div>
    </div>
    <div class="fd-friends-label">Balance with Friends</div>
    <div id="fd-friend-list"></div>
    <div id="fd-friend-pager"></div>
    <div class="fd-activity-row" style="margin-top:1.5em;">
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
    <div class="fd-footer" style="margin-bottom:2em;"><em>Connect your API for live analytics and history.</em></div>
  </div>
  `;

  // Paging/cards/actions logic
  function updateFriendsPanel() {
    container.querySelector("#fd-friend-list").innerHTML = renderFriendsList();
    container.querySelector("#fd-friend-pager").innerHTML = renderFriendsPager();
    // Paging
    let pagerRow = container.querySelector(".fd-pager-row");
    if (pagerRow) {
      pagerRow.querySelectorAll(".fd-pager-btn").forEach((btn) => {
        btn.onclick = (e) => {
          if (btn.disabled) return;
          page += btn.getAttribute("data-pager") === "next" ? 1 : -1;
          openCardIdx = null;
          updateFriendsPanel();
        };
      });
    }
    // Card expand/collapse + action buttons
    container.querySelectorAll('.fd-fcard').forEach(card=>{
      card.onclick = evt => {
        let idx = Number(card.getAttribute('data-idx'));
        openCardIdx = openCardIdx === idx ? null : idx;
        updateFriendsPanel();
      }
    });
    container.querySelectorAll('.fd-fbtn').forEach(btn=>{
      btn.onclick = ev => {
        ev.stopPropagation();
        const card = btn.closest('.fd-fcard');
        let idx = Number(card.getAttribute('data-idx'));
        let friend = balances[page*FRIENDS_PER_PAGE+idx];
        if(btn.textContent==="Settle Up") {
          showPayModal(friend.name, Math.abs(friend.amount));
        } else if(btn.textContent==="Transactions") {
          alert("Show transactions with "+friend.name);
        }
      };
    });
  }
  updateFriendsPanel();

  // Pie chart breakdown modal
  const chartArea = container.querySelector("#donutChartArea");
  if (chartArea) {
    chartArea.onclick = () => {
      showPieLegendModal();
    };
  }
  function showPieLegendModal() {
    const modal = document.createElement("div");
    modal.className = "fd-pay-modal";
    modal.innerHTML = `
      <div class="fd-pay-content" style="position:relative;">
        <button class="fd-pay-close">&times;</button>
        <h4>Breakdown: Owed vs Owe</h4>
        <div>
          <b style="color:#43a047;">Owed (They Owe You):</b>
          <ul style="margin-bottom:1em;">
            ${balances.filter(f => f.amount > 0).map(f => `<li>${escapeHtml(f.name)}: ${f.amount} QAR</li>`).join('') || "<li>None</li>"}
          </ul>
          <b style="color:#e53935;">Owe (You Owe):</b>
          <ul>
            ${balances.filter(f => f.amount < 0).map(f => `<li>${escapeHtml(f.name)}: ${Math.abs(f.amount)} QAR</li>`).join('') || "<li>None</li>"}
          </ul>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.fd-pay-close').onclick =
      modal.onclick = ev => { if(ev.target === modal || ev.target.classList.contains('fd-pay-close')) document.body.removeChild(modal);}
  }

  // Pay/Settle modal
  function showPayModal(friendName, amount) {
    const modal = document.createElement("div");
    modal.className = "fd-pay-modal";
    modal.innerHTML = `
      <div class="fd-pay-content" style="position:relative;">
        <button class="fd-pay-close">&times;</button>
        <h4>Settle Up to ${escapeHtml(friendName)}</h4>
        <input class="fd-pay-input" type="number" min="1" placeholder="Amount in QAR" value="${amount||''}"/>
        <button class="fd-pay-confirm">Settle Up</button>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.fd-pay-close').onclick =
    modal.onclick = ev => { if(ev.target===modal||ev.target.classList.contains('fd-pay-close')) document.body.removeChild(modal);}
    modal.querySelector('.fd-pay-confirm').onclick = ()=> {
      const val = +modal.querySelector('.fd-pay-input').value;
      if(val>0) {
        modal.querySelector('.fd-pay-confirm').textContent = "Sending...";
        setTimeout(()=>{document.body.removeChild(modal);},800);
      }
    };
  }
}
