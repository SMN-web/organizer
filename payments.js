import { showSpinner, hideSpinner } from './spinner.js';
import { showTransferPopup } from './transfer.js';

function parseDBDatetimeAsUTC(dt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return new Date(dt);
  return new Date(Date.UTC(+m[1], m[5]-1, +m[6], +m[7], +m[8], +m[9]));
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
            <span class="paypage-avatar">${f.initials || (f.name||"")}</span>
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
        timelineRows.push(`<div class="date-divider">${groupLabel}</div>`);
        lastDate = groupLabel;
      }
      if (ev.status === 'canceled' && ev.dir === 'from') return;

      // Main label, two-line split
      let label = "";
      if (ev.dir === "to") {
        if (ev.status === "pending") label = "Payment sent, awaiting approval.";
        else if (ev.status === "accepted") label = "Payment sent & accepted.";
        else if (ev.status === "rejected") label = "Payment sent & rejected!";
        else if (ev.status === "canceled") label = "Payment cancelled.";
      } else {
        if (ev.status === "pending") label = "Payment received, awaiting your approval.";
        else if (ev.status === "accepted") label = "Payment received and accepted.";
        else if (ev.status === "rejected") label = "Payment received but you rejected!";
        else if (ev.status === "canceled") label = "Payment cancelled.";
      }

      // Status badge logic
      let statusPillHtml = "";
      if (ev.status === "accepted") statusPillHtml = `<span class="status-pill accepted">Accepted</span>`;
      else if (ev.status === "rejected") statusPillHtml = `<span class="status-pill rejected">Rejected</span>`;
      else if (ev.status === "pending") statusPillHtml = `<span class="status-pill pending">Pending</span>`;
      else if (ev.status === "canceled") statusPillHtml = `<span class="status-pill cancelled">Cancelled</span>`;
      
      // Actions if needed
      let actions = "";
      if (ev.status === "pending") {
        if (ev.dir === "to") actions = `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>`;
        else actions = `<button class="bubble-accept" data-idx="${idx}">Accept</button><button class="bubble-reject" data-idx="${idx}">Reject</button>`;
      }

      timelineRows.push(`
        <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
          <div class="paypage-bubble ${ev.dir === "from" ? "" : "bubble-send"}">
            <div>
              <div class="bubble-label">${label}</div>
              <div class="bubble-amount-row">
                <div class="bubble-amount">${ev.amount} ${CURRENCY}</div>
                ${statusPillHtml}
              </div>
            </div>
            <div class="bubble-meta">
              <span>${getTimeLocalAMPM(dtObj)}</span>
              ${actions}
            </div>
          </div>
        </div>
      `);
    });

    container.innerHTML = `
      <div style="position:relative">
        <div class="header-row">
          <span class="avatar user">${currentFriend.initials || currentFriend.name}</span>
          <span class="username user">${currentFriend.name}</span>
          <span class="status-badge settled">Settled</span>
          <span class="options">&#8942;</span>
          <div class="paypage-menu-dropdown" style="display:none;right:0;"></div>
        </div>
        <div>${timelineRows.join('')}</div>
        <div class="paypage-actionsbar">
          <button class="paypage-btn pay">Pay</button>
          <button class="paypage-btn transfer">Transfer</button>
        </div>
      </div>
    `;

    // Revised three-dot dropdown logic, ONLY “Profile”
    const menuBtn = container.querySelector('.options');
    const dropdown = container.querySelector('.paypage-menu-dropdown');
    dropdown.innerHTML = `<div>Profile</div>`;
    menuBtn.onclick = function(e) {
      dropdown.style.display = 'block';
      dropdown.style.top = (menuBtn.offsetTop + menuBtn.offsetHeight) + 'px';
      dropdown.style.right = '0px';
      document.addEventListener('click', function closeMenu(ev) {
        if (!dropdown.contains(ev.target) && ev.target !== menuBtn) {
          dropdown.style.display = 'none';
          document.removeEventListener('click', closeMenu);
        }
      });
    };
    dropdown.querySelector('div').onclick = () => {
      dropdown.style.display = 'none';
      alert(`Username: ${currentFriend.username}\nName: ${currentFriend.name}`);
    };

    container.querySelector('.paypage-back')?.onclick = async () => {
      await loadFriends();
      view = "friends";
      renderMain();
    };

    // Action buttons
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
    // Chat bubble actions
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
