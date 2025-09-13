export async function showDashboard(container, user) {
  // Demo Data for metrics, recent activity, stats grid, etc.
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
    ]
  };

  // Utility
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t => t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  const FRIENDS_PER_PAGE = 5;
  let friends = [];
  let page = 0;
  let openCardIdx = null;

  // API calls using Firebase Auth for token
  async function fetchFriendsList() {
    try {
      showSpinner(container);
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function')
        throw new Error("Not logged in");
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('/api/settlements/friends', {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await resp.json();
      hideSpinner(container);
      if (!Array.isArray(data) && data.error) throw new Error(data.error);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      hideSpinner(container);
      container.innerHTML = `<div style="color:#d12020;margin:2em;">${e.message || e}</div>`;
      throw e;
    }
  }

  async function sendSettlePayment(toUser, amount) {
    try {
      showSpinner(container);
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('/api/expense_payment', {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ to_user: toUser, amount, currency: "QAR" })
      });
      const result = await resp.json();
      hideSpinner(container);
      if (!result.ok) throw new Error(result.error || "Payment failed");
      return result.payment_id;
    } catch (e) {
      hideSpinner(container);
      showModal && showModal({ content: e.message || e, okText: "OK" }); // Optional modal helper
      throw e;
    }
  }

  function donutSVG(owed, owe, net) {
    const tot = owed + owe, c = 2 * Math.PI * 38, pct1 = tot ? owed / tot : 0, pct2 = tot ? owe / tot : 0;
    let netColor = net > 0 ? "#43a047" : net < 0 ? "#e53935" : "#789";
    return `
      <div id="donutChartArea" style="cursor:pointer;">
        <svg width="88" height="88" viewBox="0 0 88 88" style="display:block;margin:0 auto 0.2em;">
          <circle r="38" cx="44" cy="44" fill="#f3f8fc"/>
          <circle r="38" cx="44" cy="44" fill="none" stroke="#43a047" stroke-width="12"
            stroke-dasharray="${pct1 * c},${c}" stroke-linecap="round" />
          <circle r="38" cx="44" cy="44" fill="none" stroke="#e53935" stroke-width="12"
            stroke-dasharray="${pct2 * c},${c}" stroke-linecap="round"
            style="transform:rotate(${pct1 * 360}deg);transform-origin:44px 44px;" />
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
    const list = friends.slice(page * FRIENDS_PER_PAGE, page * FRIENDS_PER_PAGE + FRIENDS_PER_PAGE);
    return list.map((f, idx) => {
      let isGreen = f.net > 0, isRed = f.net < 0;
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
      <div class="fd-fcard" data-idx="${idx}" style="position:relative;background:#fff;border-radius:13px;box-shadow:0 1px 8px #146dd012;margin-bottom:0.7em;min-height:52px;border-left:6px solid ${leftBar};display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:.77em;padding:0.6em 0.8em 0.6em 1em;">
          <span style="background:#e3f2fd;color:#1976d2;font-weight:700;font-size:1.07em;width:27px;height:27px;text-align:center;line-height:27px;border-radius:14px;">${escapeHtml(f.initials)}</span>
          <span style="font-weight:700;font-size:1.08em;">${escapeHtml(f.name)}</span>
          <span style="margin-left:auto;color:${netColor};font-size:1.17em;font-weight:700;">${f.net > 0 ? "+" : f.net < 0 ? "-" : ""}${Math.abs(f.net)} QAR</span>
        </div>
        <div style="margin-left:1.8em;font-size:.99em;font-weight:600;color:${netColor};">${status}</div>
        ${actions}
      </div>`;
    }).join("");
  }
  function renderFriendsPager() {
    let totalPages = Math.max(1, Math.ceil(friends.length / FRIENDS_PER_PAGE));
    if (totalPages <= 1) return "";
    return `
    <div class="fd-pager-row">
      <button class="fd-pager-btn"${page === 0 ? " disabled" : ""} data-pager="prev">&lt; Prev</button>
      <span class="fd-pager-label">Page ${page + 1} / ${totalPages}</span>
      <button class="fd-pager-btn"${page === totalPages - 1 ? " disabled" : ""} data-pager="next">Next &gt;</button>
    </div>
    `;
  }

  function renderDashboard() {
    let owed = friends.filter(f => f.net > 0).reduce((s, f) => s + f.net, 0);
    let owe = friends.filter(f => f.net < 0).reduce((s, f) => s + Math.abs(f.net), 0);
    let net = owed - owe;
    let netBG = net > 0 ? "#e7fff0" : net < 0 ? "#ffe6e6" : "#ececec";
    let netColor = net > 0 ? "#43a047" : net < 0 ? "#e53935" : "#789";
    let settledPct = Math.min(100, Math.round(demo.settled / (demo.spends + demo.settled) * 100));

    container.innerHTML = `
    <div class="fd-main">
      ${demo.payments?.length ?
        `<div class="fd-banner">
          🔔 You have ${demo.payments.length} payments awaiting your action!
        </div>` : ''}
      <div class="fd-title">Group Payments Dashboard</div>
      <div class="fd-btn-row">
        <button class="fd-btn-main" onclick="alert('Go to friends page')">Friends</button>
        <button class="fd-btn-main expense" onclick="window.location='/group-splits'">Split Expense</button>
      </div>
      <div class="fd-piepanel">${donutSVG(owed, owe, net)}</div>
      <div class="fd-net-badge" style="background:${netBG};color:${netColor};">${net >= 0 ? "+" : "-"}${Math.abs(net)} QAR Net Balance</div>
      <div class="fd-metrics-row">
        <div class="fd-metric-card"><div class="fd-metric-label">Paid</div><div class="fd-metric-value">${demo.paidTotal}</div></div>
        <div class="fd-metric-card"><div class="fd-metric-label">Received</div><div class="fd-metric-value">${demo.owedTotal}</div></div>
        <div class="fd-metric-card owe"><div class="fd-metric-label">Owe</div><div class="fd-metric-value">${demo.youOwe}</div></div>
      </div>
      <div class="fd-progress-wrap">
        <div class="fd-progress-bar"><div class="fd-progress-fill" style="width:${settledPct}%;"></div></div>
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
        ${(demo.recent || []).map(ev => `
          <div class="fd-rec-card">
            <span class="fd-rc-dot ${ev.type}"></span>
            <div class="fd-rc-details">
              <div class="fd-rc-amount">${ev.amount} QAR</div>
              <div class="fd-rc-desc">${ev.type === "received" ? "Received from <b>" + escapeHtml(ev.name) + "</b>" :
                ev.type === "sent" ? "Sent to <b>" + escapeHtml(ev.name) + "</b>" :
                  "Settled with <b>" + escapeHtml(ev.name) + "</b>"}
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

    // Friends cards and paging
    container.querySelector("#fd-friend-list").innerHTML = renderFriendsList();
    container.querySelector("#fd-friend-pager").innerHTML = renderFriendsPager();

    // Paging logic
    let pagerRow = container.querySelector(".fd-pager-row");
    if (pagerRow) {
      pagerRow.querySelectorAll(".fd-pager-btn").forEach((btn) => {
        btn.onclick = (e) => {
          if (btn.disabled) return;
          page += btn.getAttribute("data-pager") === "next" ? 1 : -1;
          openCardIdx = null;
          renderDashboard();
        };
      });
    }
    // Only open/close card for non-button click
    container.querySelectorAll('.fd-fcard').forEach(card => {
      card.onclick = evt => {
        if (evt.target.closest('.fd-fbtn')) return;
        let idx = Number(card.getAttribute('data-idx'));
        openCardIdx = openCardIdx === idx ? null : idx;
        renderDashboard();
      }
    });
    container.querySelectorAll('.fd-fbtn').forEach(btn => {
      btn.onclick = async ev => {
        ev.stopPropagation();
        const card = btn.closest('.fd-fcard');
        let idx = Number(card.getAttribute('data-idx'));
        let friend = friends[page * FRIENDS_PER_PAGE + idx];
        if (btn.textContent === "Settle Up") {
          showPayModal(friend.username, Math.abs(friend.net));
        } else if (btn.textContent === "Transactions") {
          alert("Show transactions with " + friend.name);
        }
      };
    });

    // Donut chart modal
    const chartArea = container.querySelector("#donutChartArea");
    if (chartArea) {
      chartArea.onclick = () => {
        showPieLegendModal();
      };
    }
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
            ${friends.filter(f => f.net > 0).map(f => `<li>${escapeHtml(f.name)}: ${f.net} QAR</li>`).join('') || "<li>None</li>"}
          </ul>
          <b style="color:#e53935;">Owe (You Owe):</b>
          <ul>
            ${friends.filter(f => f.net < 0).map(f => `<li>${escapeHtml(f.name)}: ${Math.abs(f.net)} QAR</li>`).join('') || "<li>None</li>"}
          </ul>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.fd-pay-close').onclick =
      modal.onclick = ev => { if (ev.target === modal || ev.target.classList.contains('fd-pay-close')) document.body.removeChild(modal); };
  }

  function showPayModal(username, amountMax) {
    const modal = document.createElement("div");
    modal.className = "fd-pay-modal";
    modal.innerHTML = `
      <div class="fd-pay-content" style="position:relative;">
        <button class="fd-pay-close">&times;</button>
        <h4>Settle Up Payment</h4>
        <input class="fd-pay-input" type="number" min="1" max="${amountMax}" placeholder="Amount in QAR" value="${amountMax}"/>
        <button class="fd-pay-confirm">Settle Up</button>
        <div class="fd-pay-error" style="color:#e53935;font-weight:700;margin-top:0.7em;"></div>
      </div>`;
    document.body.appendChild(modal);

    const closeHandler = () => document.body.removeChild(modal);
    modal.querySelector('.fd-pay-close').onclick = closeHandler;
    modal.onclick = ev => { if (ev.target === modal) closeHandler(); };

    modal.querySelector('.fd-pay-confirm').onclick = async () => {
      const amount = +modal.querySelector('.fd-pay-input').value;
      try {
        await sendSettlePayment(username, amount);
        modal.querySelector('.fd-pay-confirm').textContent = "Sent!";
        setTimeout(closeHandler, 900);
        friends = await fetchFriendsList();
        renderDashboard();
      } catch (e) {
        modal.querySelector('.fd-pay-error').textContent = e.message;
      }
    };
  }

  // Show spinner while loading
  container.innerHTML = `<div class="fd-main"><div style="text-align:center;margin:3em auto;font-size:1.28em;color:#2566b2;font-weight:700;">Loading group balances&hellip;</div></div>`;
  try {
    friends = await fetchFriendsList();
    renderDashboard();
  } catch (e) {
    // already handled above
  }
}

// Optional: plug in your own showSpinner/hideSpinner/showModal
function showSpinner(container) {
  if (!container.__spinner) {
    container.__spinner = document.createElement("div");
    container.__spinner.innerHTML = "<div style='text-align:center;margin:2em;font-size:1.21em;color:#176dc4;'>Loading&hellip;</div>";
    container.appendChild(container.__spinner);
  }
}
function hideSpinner(container) {
  if (container.__spinner) {
    container.removeChild(container.__spinner);
    container.__spinner = null;
  }
}
// You can implement/showModal similarly or use any modal component you prefer
