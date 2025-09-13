import { showSpinner, hideSpinner } from './spinner.js';

export async function showDashboard(container, user) {
  // Demo data for non-API sections
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
      { type: "received", name: "Bala", amount: 15, date: "2025-09-13 20:55:00" },
      { type: "sent", name: "Sreerag", amount: 18, date: "2025-09-12 13:25:00" },
      { type: "settled", name: "Rafseed", amount: 23, date: "2025-09-11 11:42:00" }
    ]
  };

  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t => t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // Helper for API calls and UI state
  const FRIENDS_PER_PAGE = 5;
  let friends = [];
  let page = 0;
  let openCardIdx = null;

  // API: fetch non-settled friends and progress stats
  async function fetchFriendsList() {
    try {
      showSpinner(container);
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function')
        throw new Error("Not logged in");
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/settlements/friends', {
        headers: { Authorization: "Bearer " + token }
      });
      const data = await resp.json();
      hideSpinner(container);
      if (!Array.isArray(data) && data.error) throw new Error(data.error);
      // Split into non-settled and settled
      const outstanding = data.filter(f => f.net !== 0);
      const settled = data.filter(f => f.net === 0);
      return { outstanding, settled, all: data };
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
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/expense_payment', {
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
      showModal({ content: e.message || e, okText: "OK" });
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
  function renderFriendsList(list) {
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
  function renderFriendsPager(list) {
    let totalPages = Math.max(1, Math.ceil(list.length / FRIENDS_PER_PAGE));
    if (totalPages <= 1) return "";
    return `
    <div class="fd-pager-row">
      <button class="fd-pager-btn"${page === 0 ? " disabled" : ""} data-pager="prev">&lt; Prev</button>
      <span class="fd-pager-label">Page ${page + 1} / ${totalPages}</span>
      <button class="fd-pager-btn"${page === totalPages - 1 ? " disabled" : ""} data-pager="next">Next &gt;</button>
    </div>
    `;
  }

  // Modal for confirmation/error
  function showModal(args) {
    let modal = document.createElement('div');
    modal.className = "modal-backdrop";
    document.body.appendChild(modal);
    modal.innerHTML = `
      <div class="modal">
        <button class="modal-close" aria-label="Close">&times;</button>
        ${args.title ? `<h3>${args.title}</h3>` : ""}
        <div style="margin-bottom:1em;">${args.content || ''}</div>
        ${args.inputType ? `<input id="modal-input" type="${args.inputType}" placeholder="${args.inputPlaceholder||''}" value="${args.inputValue||''}" autofocus>` : ''}
        <div class="modal-btn-row">
          ${args.showCancel !== false ? `<button class="modal-btn modal-btn-alt" id="modal-cancel">${args.cancelText||'Cancel'}</button>` : ''}
          <button class="modal-btn" id="modal-ok">${args.okText||'OK'}</button>
        </div>
      </div>`;
    modal.querySelector('.modal-close').onclick = close;
    if (args.showCancel !== false) modal.querySelector('#modal-cancel').onclick = () => { close(); args.onCancel && args.onCancel(); };
    modal.querySelector('#modal-ok').onclick = () => {
      if (args.inputType) {
        const v = modal.querySelector('#modal-input').value;
        close();
        args.onOk && args.onOk(v);
      } else {
        close();
        args.onOk && args.onOk();
      }
    };
    function close() { document.body.removeChild(modal); }
    if (args.inputType) modal.querySelector('#modal-input').focus();
  }

  function parseDBDatetimeAsUTC(dt) {
    const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
    if (!m) return new Date(dt);
    return new Date(Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]));
  }
  function getDateLabel(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const then = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.round((today - then) / (1000*60*60*24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff >= 2 && diff < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${day}-${months[date.getMonth()]}-${String(date.getFullYear()).slice(2)}`;
  }

  function renderDashboard(friendsResult = { outstanding: [], settled: [], all: [] }) {
    friends = friendsResult.outstanding;
    // Settled payments progress indicator
    const numSettled = friendsResult.settled.length;
    const numTotal = friendsResult.outstanding.length + numSettled;
    let owed = friends.filter(f=>f.net>0).reduce((s,f)=>s+f.net,0);
    let owe = friends.filter(f=>f.net<0).reduce((s,f)=>s+Math.abs(f.net),0);
    let net = owed - owe;
    let netBG = net > 0 ? "#e7fff0" : net < 0 ? "#ffe6e6" : "#ececec";
    let netColor = net > 0 ? "#43a047" : net < 0 ? "#e53935" : "#789";
    let settledPct = numTotal ? Math.round(100*numSettled/numTotal) : 0;

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
        <div class="fd-progress-text">${numSettled} of ${numTotal} payments settled!</div>
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
              <div class="fd-rc-date">${getDateLabel(parseDBDatetimeAsUTC(ev.date))}</div>
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

    // Paginated friends section (show only outstanding)
    const friendsPage = friends.slice(page * FRIENDS_PER_PAGE, page * FRIENDS_PER_PAGE + FRIENDS_PER_PAGE);
    container.querySelector("#fd-friend-list").innerHTML = renderFriendsList(friendsPage);
    container.querySelector("#fd-friend-pager").innerHTML = renderFriendsPager(friends);

    let pagerRow = container.querySelector(".fd-pager-row");
    if (pagerRow) {
      pagerRow.querySelectorAll(".fd-pager-btn").forEach((btn) => {
        btn.onclick = (e) => {
          if (btn.disabled) return;
          page += btn.getAttribute("data-pager") === "next" ? 1 : -1;
          openCardIdx = null;
          renderDashboard(friendsResult);
        };
      });
    }
    // Card open/collapse, only if not clicking button
    container.querySelectorAll('.fd-fcard').forEach(card => {
      card.onclick = evt => {
        if (evt.target.closest('.fd-fbtn')) return;
        let idx = Number(card.getAttribute('data-idx'));
        openCardIdx = openCardIdx === idx ? null : idx;
        renderDashboard(friendsResult);
      }
    });
    // Settle up and transactions
    container.querySelectorAll('.fd-fbtn').forEach(btn => {
      btn.onclick = async ev => {
        ev.stopPropagation();
        const card = btn.closest('.fd-fcard');
        let idx = Number(card.getAttribute('data-idx'));
        let friend = friendsPage[idx];
        if (btn.textContent === "Settle Up") {
          showModal({
            title: "Confirm Payment",
            content: `Are you sure you want to pay <b>${Math.abs(friend.net)} QAR</b> to <b>${escapeHtml(friend.name)}</b>?`,
            okText: "Confirm",
            cancelText: "Edit Amount",
            inputType: "number",
            inputPlaceholder: "Amount in QAR",
            inputValue: Math.abs(friend.net),
            showCancel: true,
            onOk: async (enteredAmount) => {
              if (+enteredAmount > Math.abs(friend.net)) {
                showModal({ content: "You cannot pay more than you owe!", okText: "OK", showCancel: false });
                return;
              }
              await sendSettlePayment(friend.username, +enteredAmount);
              showSpinner(container);
              const refreshed = await fetchFriendsList();
              page = 0;
              openCardIdx = null;
              renderDashboard(refreshed);
            }
          });
        } else if (btn.textContent === "Transactions") {
          showModal({ title: "Transactions", content: `Transactions for ${escapeHtml(friend.name)} coming soon.`, okText: "OK", showCancel: false });
        }
      };
    });

    // Donut chart legend modal
    const chartArea = container.querySelector("#donutChartArea");
    if (chartArea) {
      chartArea.onclick = () => {
        showModal({
          title: "Breakdown: Owed vs Owe",
          content: `
            <b style="color:#43a047;">Owed (They Owe You):</b><ul style="margin-bottom:1em;">
            ${friends.filter(f => f.net > 0).map(f => `<li>${escapeHtml(f.name)}: ${f.net} QAR</li>`).join('') || "<li>None</li>"}
            </ul>
            <b style="color:#e53935;">Owe (You Owe):</b><ul>
            ${friends.filter(f => f.net < 0).map(f => `<li>${escapeHtml(f.name)}: ${Math.abs(f.net)} QAR</li>`).join('') || "<li>None</li>"}
            </ul>
          `,
          okText: "Close",
          showCancel: false
        });
      };
    }
  }

  // Initial spinner/loading state
  container.innerHTML = `<div class="fd-main"><div style="text-align:center;margin:3em auto;font-size:1.28em;color:#2566b2;font-weight:700;">Loading group balances&hellip;</div></div>`;
  try {
    const friendsResult = await fetchFriendsList();
    renderDashboard(friendsResult);
  } catch (e) {
    // Error display handled above
  }
}
