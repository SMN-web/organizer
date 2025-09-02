import { showSpinner, hideSpinner } from './spinner.js';

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
  let current = 0;
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
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') throw new Error("Not logged in");
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

  async function loadTimeline(friendName) {
    showSpinner(container);
    timeline = [];
    try {
      const token = await user.firebaseUser.getIdToken(true);
      const url = `https://pa-ca.nafil-8895-s.workers.dev/api/transactions?friend=${encodeURIComponent(friendName)}`;
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

  async function sendPayment(toUser, maxOwed) {
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
        body: JSON.stringify({ to_user: toUser, amount })
      });
      const result = await resp.json();
      if (!result.ok && result.error) throw new Error(result.error);
      await loadTimeline(toUser);
      await loadFriends();
      renderUserView();
    } catch (e) {
      hideSpinner(container);
      alert(e && e.message ? e.message : e);
    }
    hideSpinner(container);
  }

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${Math.abs(net)} ${CURRENCY}</span>`;
  }
  function statusPill(status) {
    if (status === "pending") return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted") return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected") return `<span class="status-pill rejected">Rejected</span>`;
    if (status === "canceled") return `<span class="status-pill canceled">Canceled</span>`;
    return "";
  }
  function timeAgo(ts) {
    if (!ts) return "";
    const then = new Date(ts), now = new Date();
    const diff = Math.floor((now - then) / 1000);
    if (isNaN(diff)) return "";
    if (diff < 60) return "just now";
    const min = Math.floor(diff / 60); if (min < 60) return min + "m ago";
    const h = Math.floor(min / 60); if (h < 24) return h + "h ago";
    const d = Math.floor(h / 24); return d + "d ago";
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
        current = Number(row.dataset.idx);
        currentFriend = flist[current];
        view = "user";
        await loadTimeline(currentFriend.name);
        renderUserView();
      }
    );
  }

  function renderUserView() {
    container.innerHTML = `
      <div class="paypage-wrap" style="position:relative">
        <div class="paypage-padding-top"></div>
        <div class="paypage-header-row paypad-extra">
          <button class="paypage-back">&larr;</button>
          <span class="paypage-avatar user">${currentFriend.initials || currentFriend.name[0]}</span>
          <span class="paypage-username user">${currentFriend.name}</span>
          ${netPill(currentFriend.net)}
        </div>
        <div class="user-header-divider"></div>
        <div class="paypage-chat">
          ${timeline.length === 0 ? 
            `<div style="color:#888;text-align:center;padding:40px 0;">No transactions yet with ${currentFriend.name}.</div>` :
            timeline.map((ev, idx) => `
              <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
                <div class="paypage-bubble ${ev.dir === "from" ? "bubble-recv" : "bubble-send"}">
                  <div>
                    <span class="bubble-amt ${ev.dir==="from"?"amt-recv":"amt-send"}">${ev.amount} ${CURRENCY}</span>
                    <span class="bubble-label">${ev.dir==="from"?"Received":"Paid"}</span>
                    ${statusPill(ev.status)}
                  </div>
                  <div class="bubble-meta">
                    <span>${timeAgo(ev.last_updated)}</span>
                    ${
                      ev.status==="pending" && ev.dir==="to"
                      ? `<button class="bubble-cancel" disabled>Cancel</button>`
                      : ""
                    }
                  </div>
                </div>
              </div>
          `).join('')}
        </div>
        <div class="paypage-actionsbar">
          <button class="paypage-btn pay"${currentFriend.net < 0 ? "" : " disabled"}>Pay</button>
          <button class="paypage-btn remind" disabled>Remind</button>
        </div>
      </div>
    `;
    container.querySelector('.paypage-back').onclick = async () => {
      // Refresh friend list after possible payment
      await loadFriends();
      view = "friends"; 
      renderMain(); 
    };
    // Enable Pay only if net < 0 (owe money!)
    container.querySelector('.paypage-btn.pay').onclick = async () => {
      if (currentFriend.net >= 0) return;
      await sendPayment(currentFriend.name, Math.abs(currentFriend.net));
    };
  }
}
