import { showSpinner, hideSpinner } from './spinner.js';
import { showTransferPopup } from './transfer.js';

// --- Modal Logic ---
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

// --- Main Payments Panel ---
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

  // Initial load
  await loadFriends();
  renderMain();

  // --- Friend list loading ---
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

  // --- Timeline loading ---
  async function loadTimeline(friendUsername) {
    showSpinner(container);
    timeline = [];
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const url = `https://pa-ca.nafil-8895-s.workers.dev/api/transactions?friend=${encodeURIComponent(friendUsername)}`;
      const resp = await fetch(url, { headers: { Authorization: "Bearer " + token } });
      let data;
      try {
        data = await resp.json();
      } catch (jsonErr) {
        timeline = [];
        container.innerHTML = `<div style="color:#d12020;padding:2em;">Failed to read transactions. [Parse error]</div>`;
        return;
      }
      if (!Array.isArray(data)) {
        let msg = (data && data.error) ? data.error : 'Timeline is not available.';
        container.innerHTML = `<div style="color:#d12020;padding:2em;">${msg}</div>`;
        return;
      }
      timeline = data;
    } catch (e) {
      timeline = [];
      container.innerHTML = `<div style="color:#d12020;padding:2em;">${e.message||e}</div>`;
      return;
    }
    hideSpinner(container);
  }

  // --- Payment send ---
  async function sendPayment(toUsername, amount) {
    showSpinner(container);
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const resp = await fetch('https://pa-ca.nafil-8895-s.workers.dev/api/expense_payment', {
        method: "POST",
        headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ to_user: toUsername, amount, currency: CURRENCY })
      });
      const result = await resp.json();
      if (!result.ok && result.error) {
        showModal({ content: result.error, okText: "OK", showCancel: false });
        hideSpinner(container);
        return;
      }
      showModal({
        title: "Payment Sent",
        content: `Payment of ${amount} QAR sent to ${currentFriend.name}.`,
        okText: "OK",
        showCancel: false,
        onOk: async () => {
          await loadTimeline(currentFriend.username);
          await loadFriends();
          const updated = friends.find(f => f.username === currentFriend.username);
          if (updated) currentFriend = updated;
          renderUserView();
        }
      });
    } catch (e) {
      hideSpinner(container);
      showModal({ content: e && e.message ? e.message : e, okText: "OK", showCancel: false });
    }
    hideSpinner(container);
  }

  // --- Payment action (accept, reject, cancel) ---
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
    if (!ok) {
      showModal({ content: err, okText: "OK", showCancel: false });
      return;
    }
    let msg = '';
    if (action === "accept") msg = `Payment has been accepted and will shortly reflect in your account.`;
    else if (action === "cancel") msg = `This payment has been cancelled.`;
    else if (action === "reject") msg = `The payment request has been rejected.`;
    showModal({
      title: "Transaction Complete",
      content: msg,
      okText: "OK",
      showCancel: false,
      onOk: async () => {
        await loadTimeline(currentFriend.username);
        await loadFriends();
        const updated = friends.find(f => f.username === currentFriend.username);
        if (updated) currentFriend = updated;
        renderUserView();
      }
    });
  }

  // --- UI helpers ---
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

  function updateFriendList() {
    const flist = filteredFriends();
    const el = container.querySelector('.paypage-friend-list');
    el.innerHTML = flist.length === 0
      ? `<div class="paypage-empty">No friends found.</div>`
      : flist.map((f, i) => `
          <div class="paypage-friend-row" data-idx="${i}">
            <span class="paypage-avatar">${(f.name||"").substring(0,2).toUpperCase()}</span>
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

  // --- Main user timeline view ---
  function renderUserView() {
    let timelineRows = [];
    let lastDate = null;
    const me = user.username || (user.firebaseUser && user.firebaseUser.displayName) || (user.firebaseUser && user.firebaseUser.email && user.firebaseUser.email.split('@')[0]) || "";

    if (!timeline.length) {
      container.innerHTML = `<div class="paypage-wrap"><div class="paypage-chat">
        <div class="paypage-empty">No transactions found for this friend.</div>
      </div></div>`;
      return;
    }

    timeline.forEach((ev, idx) => {
      const dtObj = parseDBDatetimeAsUTC(ev.last_updated ?? ev.updated_at ?? ev.created_at ?? "");
      const groupLabel = getDateLabel(dtObj);
      if (groupLabel !== lastDate) {
        timelineRows.push(`<div class="paypage-date-divider pay-date-header">${groupLabel}</div>`);
        lastDate = groupLabel;
      }

      const displayFrom = ev.from_user_name || ev.from_user || '';
      const displayTo = ev.to_user_name || ev.to_user || '';
      const displaySender = ev.sender_name || ev.sender || '';

      const isTransfer = ev.status === "transfer_settled" && ev.sender;
      // Bubble side: right for sender, left for receiver
      const bubbleSide = ev.direction === "sender" ? "bubble-right" : "bubble-left";
      const bubbleExtra = isTransfer ? "transfer-bubble" : "";

      let heading = "";
      if (isTransfer) {
        if (ev.direction === "sender") {
          heading = `<span class="bubble-title">Transfer initiated by you for <b>${displayFrom}</b> to <b>${displayTo}</b></span>`;
        } else {
          heading = `<span class="bubble-title">Transfer you participated in as <b>${displayFrom === me ? 'debtor' : 'receiver'}</b> (Initiated by ${displaySender})</span>`;
        }
      } else {
        if (ev.direction === "sender") {
          heading = `<span class="bubble-title">You sent a payment to <b>${displayTo}</b></span>`;
        } else if (ev.direction === "receiver") {
          heading = `<span class="bubble-title"><b>${displayFrom}</b> sent you a payment</span>`;
        } else {
          heading = `<span class="bubble-title">Payment activity</span>`;
        }
      }

      let label = "";
      if (isTransfer) {
        label = "This transfer was processed and settled successfully.";
      } else if (ev.direction === "sender") {
        label = ev.status === "pending"
          ? "Your payment is awaiting the recipient’s approval."
          : ev.status === "accepted"
            ? "Your payment was accepted and credited to the recipient."
            : ev.status === "rejected"
              ? "Your payment was rejected by the recipient."
              : ev.status === "canceled"
                ? "You canceled this payment before it was acted on."
                : "Payment update.";
      } else if (ev.direction === "receiver") {
        label = ev.status === "pending"
          ? "This payment is pending your review and acceptance."
          : ev.status === "accepted"
            ? "You have accepted and received the payment."
            : ev.status === "rejected"
              ? "You rejected this payment."
              : ev.status === "canceled"
                ? "The sender canceled this payment."
                : "Payment update.";
      }

      let statusPill =
        isTransfer ? `<span class="status-pill transfer-pill">Transfer</span>`
        : ev.status === "accepted"  ? `<span class="status-pill accepted">Accepted</span>`
        : ev.status === "rejected"  ? `<span class="status-pill rejected">Rejected</span>`
        : ev.status === "pending"   ? `<span class="status-pill pending">Pending</span>`
        : ev.status === "canceled"  ? `<span class="status-pill cancelled">Cancelled</span>`
        : "";

      let actions = "";
      if (!isTransfer && ev.status === "pending") {
        if (ev.direction === "sender") {
          actions = `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>`;
        } else if (ev.direction === "receiver") {
          actions = `<button class="bubble-accept" data-idx="${idx}">Accept</button>
                    <button class="bubble-reject" data-idx="${idx}">Reject</button>`;
        }
      }

      timelineRows.push(`
        <div class="paypage-bubble-row ${bubbleSide}">
          <div class="paypage-bubble ${bubbleExtra} ${bubbleSide === "bubble-right" ? "bubble-send" : ""}">
            ${heading}
            <div class="bubble-label">${label}</div>
            <div class="bubble-amount-row">
              <span class="bubble-amount">${ev.amount} ${ev.currency || CURRENCY}</span>
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
          <button class="paypage-back" style="font-size:1.5em;font-weight:800;padding:0 7px 0 0;">&#8592;</button>
          <span class="paypage-avatar user">${(currentFriend.name||"").substring(0,2).toUpperCase()}</span>
          <span class="paypage-username user">${currentFriend.name}</span>
          ${netPill(currentFriend.net)}
          <button class="paypage-menu-3dots" style="margin-left:auto;padding:0 12px 0 0;font-size:2em;background:none;border:none;cursor:pointer;">&#x22ee;</button>
          <div class="paypage-menu-dropdown" style="display:none;position:absolute;right:0;"></div>
        </div>
        <div class="user-header-divider"></div>
        <div class="paypage-chat" style="padding-bottom:98px">${timelineRows.join('')}</div>
        <div class="paypage-actionsbar">
          <button class="paypage-btn pay">Pay</button>
          <button class="paypage-btn transfer">Transfer</button>
        </div>
      </div>
    `;

    // --- Profile modal in menu ---
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

    // --- Back (to friends list) ---
    container.querySelector('.paypage-back').onclick = async () => {
      await loadFriends();
      view = "friends";
      renderMain();
    };

    // --- Pay Button ---
    const payBtn = container.querySelector('.paypage-btn.pay');
    if (payBtn) {
      payBtn.onclick = () => {
        if (currentFriend.net >= 0) {
          showModal({ content: "You owe nothing to this person.", okText: "OK", showCancel: false });
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

    // --- Transfer Button ---
    const transferBtn = container.querySelector('.paypage-btn.transfer');
    if (transferBtn) {
      transferBtn.onclick = () => {
        showTransferPopup(container, user, currentFriend.username);
      };
    }

    // --- Bubble Action Buttons ---
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
          }
        });
      }
    );
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
}
