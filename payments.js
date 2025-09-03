import { showSpinner, hideSpinner } from './spinner.js';
import { showTransferPopup } from './transfer.js';

// Modal utility
function showModal({title, content, inputType, inputPlaceholder, inputValue, onOk, onCancel, okText="OK", cancelText="Cancel", showCancel=true}) {
  let modal = document.createElement('div');
  modal.className = "modal-backdrop";
  document.body.appendChild(modal);
  modal.innerHTML = `
    <div class="modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      ${title ? `<h3>${title}</h3>` : ""}
      <div style="margin-bottom:1em;">${content || ''}</div>
      ${inputType ? `<input id="modal-input" type="${inputType}" placeholder="${inputPlaceholder||''}" value="${inputValue||''}" autofocus>` : ''}
      <div class="modal-btn-row">
        ${showCancel ? `<button class="modal-btn modal-btn-alt" id="modal-cancel">${cancelText}</button>` : ''}
        <button class="modal-btn" id="modal-ok">${okText}</button>
      </div>
    </div>`;
  modal.querySelector('.modal-close').onclick = close;
  if (showCancel) modal.querySelector('#modal-cancel').onclick = () => { close(); if (onCancel) onCancel(); };
  modal.querySelector('#modal-ok').onclick = () => {
    if (inputType) {
      const v = modal.querySelector('#modal-input').value;
      close();
      onOk && onOk(v);
    } else {
      close();
      onOk && onOk();
    }
  };
  function close() { document.body.removeChild(modal); }
  if (inputType) modal.querySelector('#modal-input').focus();
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

  async function sendPayment(toUsername, amount) {
    const currency = localStorage.getItem('currency') || "QAR";
    showSpinner(container);
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/expense_payment', {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ to_user: toUsername, amount, currency })
      });
      const result = await resp.json();
      if (!result.ok && result.error) {
        showModal({ content: result.error, okText: "OK", showCancel: false });
        hideSpinner(container);
        return;
      }
      await loadTimeline(toUsername);
      await loadFriends();
      renderUserView();
    } catch (e) {
      hideSpinner(container);
      showModal({ content: e && e.message ? e.message : e, okText: "OK", showCancel: false });
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
    if (!ok) showModal({ content: err, okText: "OK", showCancel: false });
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
        timelineRows.push(`<div class="paypage-date-divider pay-date-header">${groupLabel}</div>`);
        lastDate = groupLabel;
      }
      if (ev.status === 'canceled' && ev.dir === 'from') return;

      let label =
        ev.dir === "to"
          ? ev.status === "pending"    ? "Payment sent, awaiting approval."
            : ev.status === "accepted" ? "Payment sent & accepted."
            : ev.status === "rejected" ? "Payment sent & rejected!"
            : "Payment cancelled."
          : ev.status === "pending"    ? "Payment received, awaiting your approval."
            : ev.status === "accepted" ? "Payment received and accepted."
            : ev.status === "rejected" ? "Payment received but you rejected!"
            : "Payment cancelled.";

      let statusPill =
        ev.status === "accepted" ? `<span class="status-pill accepted">Accepted</span>`
        : ev.status === "rejected" ? `<span class="status-pill rejected">Rejected</span>`
        : ev.status === "pending"  ? `<span class="status-pill pending">Pending</span>`
        : `<span class="status-pill cancelled">Cancelled</span>`;

      let actions = "";
      if (ev.status === "pending") {
        actions =
          ev.dir === "to" ?
            `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>` :
            `<button class="bubble-accept" data-idx="${idx}">Accept</button>
             <button class="bubble-reject" data-idx="${idx}">Reject</button>`;
      }

      timelineRows.push(`
        <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
          <div class="paypage-bubble ${ev.dir === "from" ? "" : "bubble-send"}">
            <div class="bubble-label">${label}</div>
            <div class="bubble-amount-row">
              <span class="bubble-amount">${ev.amount} ${CURRENCY}</span>
              ${statusPill}
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
      <div class="paypage-wrap" style="position:relative">
        <div class="paypage-padding-top"></div>
        <div class="paypage-header-row paypad-extra" style="display:flex;align-items:center;">
          <button class="paypage-back">&larr;</button>
          <span class="paypage-avatar user">${currentFriend.initials || currentFriend.name[0]}</span>
          <span class="paypage-username user">${currentFriend.name}</span>
          ${netPill(currentFriend.net)}
          <button class="paypage-menu-3dots" style="margin-left:auto;padding:0 12px 0 0;font-size:2em;background:none;border:none;cursor:pointer;">&#x22ee;</button>
          <div class="paypage-menu-dropdown" style="display:none;position:absolute;right:0;"></div>
        </div>
        <div class="user-header-divider"></div>
        <div class="paypage-chat">${timelineRows.join('')}</div>
        <div class="paypage-actionsbar">
          <button class="paypage-btn pay">Pay</button>
          <button class="paypage-btn transfer">Transfer</button>
        </div>
      </div>
    `;

    // Three-dot dropdown menu for profile modal
    const menuBtn = container.querySelector('.paypage-menu-3dots');
    const dropdown = container.querySelector('.paypage-menu-dropdown');
    dropdown.innerHTML = `<div>Profile</div>`;
    if (menuBtn) {
      menuBtn.onclick = function (e) {
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
    }
    dropdown.querySelector('div').onclick = () => {
      dropdown.style.display = 'none';
      showModal({
        title: "Profile",
        content: `
          <div class="modal-profile-label">Username</div>
          <div class="modal-profile-value">${currentFriend.username || ''}</div>
          <div class="modal-profile-label">Name</div>
          <div class="modal-profile-value">${currentFriend.name || ''}</div>
        `,
        okText: "Close",
        showCancel: false
      });
    };

    container.querySelector('.paypage-back').onclick = async () => {
      await loadFriends();
      view = "friends";
      renderMain();
    };

    // Pay button uses YOUR modal (not prompt)
    const payBtn = container.querySelector('.paypage-btn.pay');
    if (payBtn) {
      payBtn.onclick = () => {
        if (currentFriend.net >= 0) {
          showModal({ content: "You owed nothing to this person.", okText: "OK", showCancel: false });
          return;
        }
        const maxOwed = Math.abs(currentFriend.net);
        showModal({
          title: "Send Payment",
          inputType: "number",
          inputPlaceholder: `Amount (max ${maxOwed})`,
          inputValue: maxOwed,
          okText: "Pay",
          cancelText: "Cancel",
          onOk: (v) => {
            const amount = Math.round(Number(v));
            if (isNaN(amount) || amount <= 0 || amount > maxOwed) {
              showModal({ title: "Error", content: "Enter a valid positive amount within max limit.", okText:"OK", showCancel: false });
              return;
            }
            sendPayment(currentFriend.username, amount);
          }
        });
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
    // All confirmations (cancel/accept/reject) use your modal
    container.querySelectorAll('.bubble-cancel').forEach(btn =>
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        const paymentId = timeline[idx].payment_id;
        showModal({
          title: "Cancel Payment",
          content: "Are you sure you want to cancel this payment?",
          okText: "Yes", cancelText: "No",
          onOk: async () => {
            await paymentAction(paymentId, "cancel");
            await loadTimeline(currentFriend.username);
            renderUserView();
          }
        });
      }
    );
    container.querySelectorAll('.bubble-accept').forEach(btn =>
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        const paymentId = timeline[idx].payment_id;
        showModal({
          title: "Accept Payment",
          content: "Do you want to accept this payment?",
          okText: "Yes", cancelText: "No",
          onOk: async () => {
            await paymentAction(paymentId, "accept");
            await loadTimeline(currentFriend.username);
            renderUserView();
          }
        });
      }
    );
    container.querySelectorAll('.bubble-reject').forEach(btn =>
      btn.onclick = async () => {
        const idx = Number(btn.dataset.idx);
        const paymentId = timeline[idx].payment_id;
        showModal({
          title: "Reject Payment",
          content: "Do you want to reject this payment?",
          okText: "Yes", cancelText: "No",
          onOk: async () => {
            await paymentAction(paymentId, "reject");
            await loadTimeline(currentFriend.username);
            renderUserView();
          }
        });
      }
    );
  }
}
