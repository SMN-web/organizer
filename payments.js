import { showSpinner, hideSpinner } from './spinner.js';
import { showTransferPopup } from './transfer.js';

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
function getTimeLocalAMPM(date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

export async function showPaymentsPanel(container, user) {
  const FILTERS = [
    { value: "all", label: "All" },
    { value: "owed", label: "Owed" },
    { value: "get", label: "Received" },
    { value: "settled", label: "Settled" }
  ];
  let view = "friends";
  let searchTerm = "";
  let filter = "all";
  let friends = [];
  let currentFriend = null;
  let timeline = [];
  let errMsg = "";
  const CURRENCY = localStorage.getItem('currency') || "QAR";

  await loadFriends();
  renderMain();

  async function loadFriends() {
    showSpinner(container);
    errMsg = '';
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function')
        throw new Error("Not logged in");
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/settlements/friends', { headers: { Authorization: "Bearer " + token } });
      const data = await resp.json();
      friends = Array.isArray(data) ? data : [];
      if (!Array.isArray(data) && data.error) errMsg = data.error;
    } catch (e) {
      errMsg = e.message || e;
    }
    hideSpinner(container);
    if (errMsg) {
      container.innerHTML = `<div style="color:#d12020;margin:2em;">${errMsg}</div>`;
      throw new Error(errMsg);
    }
  }

  async function loadTimeline(friendUsername) {
    showSpinner(container);
    timeline = [];
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const url = `https://pa-ca.nafil-8895-s.workers.dev/api/transactions?friend=${encodeURIComponent(friendUsername)}`;
      const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
      const data = await resp.json();
      if (!Array.isArray(data)) throw new Error((data && data.error) ? data.error : "Invalid timeline");
      timeline = data;
    } catch (e) {
      timeline = [];
      container.innerHTML = `<div style="color:#d12020;padding:2em;">${e.message||e}</div>`;
      return;
    }
    hideSpinner(container);
  }

  async function sendPayment(toUsername, maxOwed) {
    const currency = localStorage.getItem('currency') || "QAR";
    let amtStr = prompt(`Enter amount to pay (max ${maxOwed}):`, maxOwed);
    if (!amtStr) return;
    let amount = Math.round(Number(amtStr));
    if (isNaN(amount) || amount <= 0 || amount > maxOwed) {
      alert(`Amount must be a positive integer not exceeding ${maxOwed}`);
      return;
    }
    showSpinner(container);
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/expense_payment', {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ to_user: toUsername, amount, currency })
      });
      const result = await resp.json();
      if (!result.ok && result.error) throw new Error(result.error);
      await loadTimeline(toUsername);
      await loadFriends();
      renderUserView();
    } catch (e) {
      hideSpinner(container);
      alert(e && e.message ? e.message : e);
    }
    hideSpinner(container);
  }

  async function remindPayment(toUsername, name, owed, currency) {
    showSpinner(container);
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/remind_payment', {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ to_user: toUsername, name, owed, currency })
      });
      const result = await resp.json();
      if (!result.ok && result.error) throw new Error(result.error);
      alert("Reminder sent!");
    } catch (e) {
      alert(e && e.message ? e.message : e);
    }
    hideSpinner(container);
  }

  async function paymentAction(payment_id, action) {
    showSpinner(container);
    let ok = false, err = "";
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/expense_payment_action', {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id, action })
      });
      const result = await resp.json();
      if (!result.ok) err = result.error;
      else ok = true;
    } catch (e) {
      err = e && e.message ? e.message : e;
    }
    hideSpinner(container);
    if (!ok) alert(err);
  }

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${Math.abs(net)} ${CURRENCY}</span>`;
  }

  function filteredFriends() {
    return friends
      .filter(f => searchTerm === "" || (f.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(f => {
        if (filter === "all") return true;
        if (filter === "owed") return f.net < 0;
        if (filter === "get") return f.net > 0;
        if (filter === "settled") return f.net === 0;
        return true;
      });
  }

  function renderMain() {
    if (view === "friends") {
      container.innerHTML = `
        <div class="paypage-wrap">
          <div class="paypage-padding-top"></div>
          <div class="paypage-searchbar-row">
            <input class="paypage-search" autocomplete="off" placeholder="Search friends..." value="${searchTerm}">
            <select class="paypage-filter">
              ${FILTERS.map(f => `<option value="${f.value}">${f.label}</option>`).join("")}
            </select>
          </div>
          <div class="paypage-friend-list"></div>
        </div>
      `;
      const searchEl = container.querySelector('.paypage-search');
      searchEl.value = searchTerm;
      setTimeout(() => { searchEl.focus(); searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length); }, 5);

      searchEl.addEventListener("input", e => {
        searchTerm = e.target.value;
        updateFriendList();
      });
      searchEl.addEventListener("focus", e => {
        setTimeout(() => { searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length); }, 3);
      });
      container.querySelector('.paypage-filter').value = filter;
      container.querySelector('.paypage-filter').addEventListener("change", e => {
        filter = e.target.value;
        updateFriendList();
      });
      updateFriendList();
    } else {
      renderUserView();
    }
  }

  function updateFriendList() {
    const flist = filteredFriends();
    const el = container.querySelector('.paypage-friend-list');
    el.innerHTML = flist.length === 0
      ? `<div class="paypage-empty">No friends found.</div>`
      : flist.map((f, i) => `
          <div class="paypage-friend-row" data-idx="${i}">
            <span class="paypage-avatar">${f.initials || (f.name||"")[0]}</span>
            <span class="paypage-friend-name">${f.name}</span>
            ${netPill(f.net)}
            <span class="paypage-right-arrow">&#8250;</span>
          </div>
        `).join('');
    el.querySelectorAll('.paypage-friend-row').forEach(row =>
      row.onclick = async () => {
        currentFriend = flist[Number(row.dataset.idx)];
        view = "user";
        await loadTimeline(currentFriend.username);
        renderUserView();
      }
    );
  }

  function renderUserView() {
    let timelineRows = [];
    let lastDate = null;
    timeline.forEach((ev, idx) => {
      const dtObj = parseDBDatetimeAsUTC(ev.last_updated);
      const groupLabel = getDateLabel(dtObj);
      if (groupLabel !== lastDate) {
        timelineRows.push(`<div class="paypage-date-divider" style="text-align:center;color:#888;">${groupLabel}</div>`);
        lastDate = groupLabel;
      }
      let timeStr = getTimeLocalAMPM(dtObj);
      if (ev.status === 'canceled' && ev.dir === 'from') return;
      let label = "";
      if (ev.dir === "to") {
        if (ev.status === "pending")
          label = `Waiting for ${currentFriend.name} to respond to your payment of ${ev.amount} ${CURRENCY}.`;
        else if (ev.status === "accepted")
          label = `${currentFriend.name} accepted your payment of ${ev.amount} ${CURRENCY}.`;
        else if (ev.status === "rejected")
          label = `${currentFriend.name} declined your payment of ${ev.amount} ${CURRENCY}.`;
        else if (ev.status === "canceled")
          label = `You cancelled this payment to ${currentFriend.name}.`;
      } else {
        if (ev.status === "pending")
          label = `${currentFriend.name} sent you ${ev.amount} ${CURRENCY}. Accept or reject?`;
        else if (ev.status === "accepted")
          label = `You received ${ev.amount} ${CURRENCY} from ${currentFriend.name}.`;
        else if (ev.status === "rejected")
          label = `You declined ${ev.amount} ${CURRENCY} from ${currentFriend.name}.`;
        else if (ev.status === "canceled")
          label = `${currentFriend.name} cancelled the payment of ${ev.amount} ${CURRENCY}.`;
      }
      let actions = "";
      if (ev.status === "pending") {
        if (ev.dir === "to") {
          actions = `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>`;
        } else {
          actions = `
            <button class="bubble-accept" data-idx="${idx}">Accept</button>
            <button class="bubble-reject" data-idx="${idx}">Reject</button>
          `;
        }
      }
      let statusPillHtml = "";
      if (ev.status === "accepted" && ev.dir === "to")
        statusPillHtml = `<span class="status-pill accepted">Accepted</span>`;
      if (ev.status === "rejected")
        statusPillHtml = `<span class="status-pill rejected">Rejected</span>`;
      timelineRows.push(`
        <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
          <div class="paypage-bubble ${ev.dir === "from" ? "bubble-recv" : "bubble-send"}">
            <div>
              <span class="bubble-label">${label}</span>
              ${statusPillHtml}
            </div>
            <div class="bubble-meta">
              <span>${timeStr}</span>
              ${actions}
            </div>
          </div>
        </div>
      `);
    });

    // Action bar with corrected button logic
    container.innerHTML = `
      <div class="paypage-wrap" style="position:relative">
        <div class="paypage-padding-top"></div>
        <div class="paypage-header-row paypad-extra" style="display:flex;align-items:center;">
          <button class="paypage-back">&larr;</button>
          <span class="paypage-avatar user">${currentFriend.initials || currentFriend.name[0]}</span>
          <span class="paypage-username user">${currentFriend.name}</span>
          ${netPill(currentFriend.net)}
          <button class="paypage-menu-3dots" style="margin-left:auto;padding:0 12px 0 0;font-size:2em;background:none;border:none;cursor:pointer;">&#x22ee;</button>
        </div>
        <div class="paypage-menu-dropdown" style="display:none;position:absolute;right:18px;top:46px;z-index:5;background:#fff;border:1px solid #bbb;border-radius:5px;min-width:110px;box-shadow:0 2px 8px rgba(0,0,0,0.11)">
          <div style="padding:10px 18px;cursor:pointer;">Profile</div>
          <div style="padding:10px 18px;cursor:pointer;">Block</div>
          <div style="padding:10px 18px;cursor:pointer;">More...</div>
        </div>
        <div class="user-header-divider"></div>
        <div class="paypage-chat">${timelineRows.join('')}</div>
        <div class="paypage-actionsbar" style="display:flex;gap:9px;">
          <button class="paypage-btn pay">Pay</button>
          ${currentFriend.net > 0 ? `<button class="paypage-btn remind">Remind</button>` : ''}
          <button class="paypage-btn transfer">Transfer</button>
        </div>
      </div>
    `;

    // Three-dot menu logic
    container.querySelector('.paypage-menu-3dots').onclick = e => {
      e.stopPropagation();
      const dd = container.querySelector('.paypage-menu-dropdown');
      dd.style.display = dd.style.display === "block" ? "none" : "block";
      document.addEventListener("click", function closeMenu(ev) {
        if (!dd.contains(ev.target)) { dd.style.display = "none"; document.removeEventListener("click", closeMenu);}
      });
    };
    container.querySelectorAll('.paypage-menu-dropdown div').forEach(item =>
      item.onclick = () => alert(item.textContent)
    );
    container.querySelector('.paypage-back').onclick = async () => {
      await loadFriends();
      view = "friends";
      renderMain();
    };
    // Button handlers
    const payBtn = container.querySelector('.paypage-btn.pay');
    if (payBtn) {
      payBtn.onclick = () => {
        if (currentFriend.net >= 0) {
          alert("You owed nothing to this person.");
          return;
        }
        sendPayment(currentFriend.username, Math.abs(currentFriend.net));
      };
    }
    const remindBtn = container.querySelector('.paypage-btn.remind');
    if (remindBtn) {
      remindBtn.onclick = () => {
        if (currentFriend.net <= 0) {
          alert("Nothing owed to you to remind.");
          return;
        }
        remindPayment(currentFriend.username, currentFriend.name, Math.abs(currentFriend.net), CURRENCY);
      };
    }
    const transferBtn = container.querySelector('.paypage-btn.transfer');
    if (transferBtn) {
      transferBtn.onclick = () => {
        showTransferPopup(
          user.username || user.firebaseUser.displayName || user.firebaseUser.email,
          currentFriend.username,
          currentFriend.name,
          Math.abs(currentFriend.net),
          CURRENCY
        );
      };
    }
    // Payment actions in transaction bubbles
    container.querySelectorAll('.bubble-cancel').forEach(btn =>
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        const paymentId = timeline[idx].payment_id;
        if (confirm("Cancel this payment?")) {
          await paymentAction(paymentId, "cancel");
          await loadTimeline(currentFriend.username);
          renderUserView();
        }
      }
    );
    container.querySelectorAll('.bubble-accept').forEach(btn =>
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        const paymentId = timeline[idx].payment_id;
        if (confirm("Accept this payment?")) {
          await paymentAction(paymentId, "accept");
          await loadTimeline(currentFriend.username);
          renderUserView();
        }
      }
    );
    container.querySelectorAll('.bubble-reject').forEach(btn =>
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        const paymentId = timeline[idx].payment_id;
        if (confirm("Reject this payment?")) {
          await paymentAction(paymentId, "reject");
          await loadTimeline(currentFriend.username);
          renderUserView();
        }
      }
    );
  }
}
