import { showSpinner, hideSpinner } from './spinner.js';
import { showTransferPopup } from './transfer.js';

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
 let selectedFriend = window.selectedFriendForPayments || null;
  window.selectedFriendForPayments = null;  // Clear after use

  
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
  let backendMe = null;
  let timeline = [];
  let errMsg = "";
  const CURRENCY = localStorage.getItem('currency') || "QAR";

  await loadFriends();

  if (selectedFriend) {
    currentFriend = friends.find(f => f.username === selectedFriend);
    if (currentFriend) {
      view = "user";
      await loadTimeline(currentFriend.username);
      renderUserView();
      return;
    }
  }

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
    backendMe = null;
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
      backendMe = data.me;
      timeline = Array.isArray(data.transactions) ? data.transactions : [];
    } catch (e) {
      timeline = [];
      container.innerHTML = `<div style="color:#d12020;padding:2em;">${e.message||e}</div>`;
      return;
    }
    hideSpinner(container);
  }

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

  function renderUserView() {
    if (!backendMe) {
      container.innerHTML = `<div class="paypage-wrap"><div class="paypage-chat">
          <div class="paypage-empty">Current user could not be determined. Please re-login or contact support.</div>
        </div></div>`;
      return;
    }

    let timelineRows = [];
    let lastDate = null;
    const me = backendMe;

    timeline.forEach((ev, idx) => {
      const dtObj = parseDBDatetimeAsUTC(ev.last_updated);
      const displayFrom = ev.from_user_name || ev.from_user || '';
      const displayTo = ev.to_user_name || ev.to_user || '';
      const displaySender = ev.sender_name || ev.sender || '';
      const isTransfer = ev.status === "transfer_settled" && ev.sender;

      let heading = "";
      let bubbleSide = ev.direction === "sender" ? "bubble-right" : "bubble-left";
      let bubbleExtra = isTransfer ? "transfer-bubble" : "";

      if (isTransfer) {
        if (ev.sender === me) {
          bubbleSide = "bubble-right";
          heading = `Transfer from <b>${displayFrom}</b> to <b>${displayTo}</b> (transfer initiated by you)`;
        } else if (ev.from_user === me) {
          bubbleSide = "bubble-left";
          heading = `Payment sent to <b>${displayTo}</b> (on behalf of ${displaySender})`;
        } else if (ev.to_user === me) {
          bubbleSide = "bubble-left";
          heading = `Payment received from <b>${displayFrom}</b> (on behalf of ${displaySender})`;
        } else {
          heading = "Transfer"; // Should never hit
        }
      } else if (ev.from_user === me) {
        bubbleSide = "bubble-right";
        heading = `You sent a payment to <b>${displayTo}</b>`;
      } else if (ev.to_user === me) {
        bubbleSide = "bubble-left";
        heading = `<b>${displayFrom}</b> sent you a payment`;
      }

      let statusPill =
        isTransfer ? `<span class="status-pill accepted">Transferred</span>`
        : ev.status === "accepted"  ? `<span class="status-pill accepted">Accepted</span>`
        : ev.status === "rejected"  ? `<span class="status-pill rejected">Rejected</span>`
        : ev.status === "pending"   ? `<span class="status-pill pending">Pending</span>`
        : ev.status === "canceled"  ? `<span class="status-pill cancelled">Cancelled</span>`
        : "";

      let actions = "";
      if (!isTransfer && ev.status === "pending") {
        if (ev.from_user === me) {
          actions = `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>`;
        } else if (ev.to_user === me) {
          actions = `<button class="bubble-accept" data-idx="${idx}">Accept</button>
                    <button class="bubble-reject" data-idx="${idx}">Reject</button>`;
        }
      }

      timelineRows.push(`
        <div class="paypage-bubble-row ${bubbleSide}">
          <div class="paypage-bubble ${bubbleExtra} ${bubbleSide === "bubble-right" ? "bubble-send" : ""}">
            <div class="bubble-title">${heading}</div>
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

    // All event handlers, for full UI/UX:
    container.querySelector('.paypage-back').onclick = async () => {
      await loadFriends();
      view = "friends";
      renderMain();
    };

    // Three dots menu (profile dropdown/open user actions)
    container.querySelector('.paypage-menu-3dots').onclick = e => {
      e.stopPropagation();
      const menu = container.querySelector('.paypage-menu-dropdown');
      menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      menu.innerHTML = `
        <div class="menu-row" id="profile-view">👤 View Profile</div>
        <div class="menu-row" id="add-note">📝 Add Note</div>
        <div class="menu-row" id="report-user">🚩 Report User</div>
      `;
      document.addEventListener('click', () => { menu.style.display = 'none'; }, { once: true });
      menu.querySelector('#profile-view').onclick = () => showModal({title:"Profile",content:`Name: ${currentFriend.name}<br>Username: ${currentFriend.username}`,okText:"Close"});
      // Add other menu actions as needed
    };
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

    // Actions bar buttons
    container.querySelector('.paypage-btn.pay').onclick = () => {
      showModal({
        title: "Send Payment",
        inputType: "number",
        inputPlaceholder: "Amount to send",
        okText: "Send",
        onOk: async (value) => {
          let amount = Math.round(Number(value));
          if (!amount) { showModal({content:"Enter a valid amount",okText:"OK",showCancel:false}); return; }
          await sendPayment(currentFriend.username, amount);
        }
      });
    };


container.querySelector('.paypage-btn.transfer').onclick = () => {
      showTransferPopup(container, user, currentFriend.username);
    };
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
