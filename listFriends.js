import { showSpinner, hideSpinner, delay } from './spinner.js';
import { showFriendsMenuDropdown } from './friendsMenu.js';

export function showFriendsList(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let allFriends = [];

  // Per-friend dropdown menu (unchanged from before)
  function createDropdown(friend, parentRow, event) {
    for (let el of document.querySelectorAll('.friendDropdown')) el.remove();
    const rect = event.target.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const dd = document.createElement('div');
    dd.className = 'friendDropdown';
    dd.style = `
      position:absolute;
      top:${rect.bottom + scrollY + 4}px;
      left:${rect.left + scrollX - 115 + rect.width}px;
      min-width:142px;
      background:#fff;
      border:1px solid #eee;
      box-shadow:0 2px 16px #0003;
      border-radius:11px;
      padding:7px 0;
      font-size:1.08em;
      z-index:120000;
      overflow:hidden;
      word-break:break-word;
      animation:fadein .13s;
      font-family:inherit;
    `;
    dd.innerHTML = `
      <div style="padding:15px 22px;cursor:pointer;transition:background .16s;" class="ddUnfriend" onmouseover="this.style.background='#f5f7fa'" onmouseout="this.style.background='none'">Unfriend</div>
      <div style="padding:15px 22px;cursor:pointer;color:#d22;transition:background .16s;" class="ddBlock" onmouseover="this.style.background='#f3e1e1'" onmouseout="this.style.background='none'">Block</div>
    `;

    document.body.appendChild(dd);

    dd.querySelector('.ddUnfriend').onclick = async () => {
      dd.innerHTML = `<div style="padding:18px;text-align:center;">Unfriending...</div>`;
      showSpinner(dd); await delay(420);
      try {
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/unfriend', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: friend.username })
        });
        const out = await resp.json();
        if (out.ok) {
          parentRow.remove();
        } else {
          dd.innerHTML = `<div style="padding:18px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        dd.innerHTML = `<div style="padding:18px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
      setTimeout(() => dd.remove(), 880);
    };

    dd.querySelector('.ddBlock').onclick = async () => {
      dd.innerHTML = `<div style="padding:18px;text-align:center;">Blocking...</div>`;
      showSpinner(dd); await delay(420);
      try {
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/block', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: friend.username })
        });
        const out = await resp.json();
        if (out.ok) {
          parentRow.remove();
        } else {
          dd.innerHTML = `<div style="padding:18px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        dd.innerHTML = `<div style="padding:18px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
      setTimeout(() => dd.remove(), 880);
    };

    setTimeout(() => {
      function hideMenu(ev) {
        if (dd && !dd.contains(ev.target)) {
          dd.remove();
          document.removeEventListener('mousedown', hideMenu, true);
          document.removeEventListener('touchstart', hideMenu, true);
        }
      }
      document.addEventListener('mousedown', hideMenu, true);
      document.addEventListener('touchstart', hideMenu, true);
    }, 40);
  }

  function render(filterTerm = "") {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;">
        <span style="font-weight:600;font-size:1.13em;line-height:1.6;letter-spacing:.03em;">My Friends</span>
        <button id="headerDotsBtn" style="
          background:none;border:none;padding:2px 2px 2px 13px;display:flex;align-items:center;cursor:pointer;" aria-label="Panel menu">
          <span style="font-size:2em;font-weight:700;color:#232323;">&#8942;</span>
        </button>
      </div>
      <input id="friendFilter" type="text" placeholder="Filter by name or username"
        style="width:98%;max-width:330px;margin-bottom:17px;padding:0.5em 1em;border-radius:7px;
        border:1px solid #dde;display:block;margin-left:auto;margin-right:auto;">
      <div id="friendList" style="max-height:54vh;overflow-y:auto;"></div>
    `;
    container.querySelector("#headerDotsBtn").onclick = e => showFriendsMenuDropdown(e);

    const friendList = container.querySelector("#friendList");
    container.querySelector('#friendFilter').oninput = e => render(e.target.value);

    let friends = allFriends;
    if (filterTerm) {
      const t = filterTerm.toLowerCase();
      friends = allFriends.filter(f =>
        (f.name||'').toLowerCase().includes(t) ||
        (f.username||'').toLowerCase().includes(t)
      );
    }
    if (!friends || friends.length === 0) {
      friendList.innerHTML = `
        <div style="margin:2em 0;color:#888;font-size:1.13em;text-align:center;">
          <div style="font-size:2em;margin-bottom:0.6em;">🙂</div>
          You have no friends yet.<br>
          Send a friend request to get started!
        </div>
      `;
      return;
    }
    friends.forEach(friend => {
      const row = document.createElement("div");
      row.style = `
        position:relative;margin:13px 0;display:flex;align-items:center;gap:18px;
        padding:10px 0 10px 0;overflow-wrap:break-word;word-break:break-word;
      `;
      row.innerHTML = `
        <div style="flex:1 1 0;display:flex;flex-direction:column;">
          <span style="font-size:1.07em;font-weight:500;">${friend.name || friend.username}</span>
          <span style="font-size:0.97em;color:#888;margin-top:-1px;">@${friend.username}</span>
        </div>
        <button class="friendMoreBtn" style="
          background:none;border:none;padding:4px 8px 4px 8px;
          color:#222;font-size:1.38em;line-height:1;display:flex;align-items:center;cursor:pointer;
        " aria-label="Friend actions">&#8942;</button>
      `;
      const moreBtn = row.querySelector('.friendMoreBtn');
      moreBtn.onclick = moreBtn.ontouchstart = (e) => {
        e.preventDefault(); e.stopPropagation();
        createDropdown(friend, row, e);
      };
      friendList.appendChild(row);
    });
  }

  async function fetchFriendsList() {
    showSpinner(container);
    let errMsg = '';
    let list = [];
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        hideSpinner(container);
        container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view friends.</div>`;
        return;
      }
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/list', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const text = await res.text();
      await delay(600);
      try { list = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
      if (!Array.isArray(list)) {
        if (list && list.error) errMsg = "Backend error: " + list.error;
        else errMsg = "Unexpected backend error: " + text;
      }
    } catch (e) { errMsg = "Network error: " + e.message; }
    hideSpinner(container);

    if (errMsg) {
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;">
          <span style="font-weight:600;font-size:1.13em;line-height:1.6;letter-spacing:.03em;">My Friends</span>
          <button id="headerDotsBtn" style="
            background:none;border:none;padding:2px 2px 2px 13px;display:flex;align-items:center;cursor:pointer;" aria-label="Panel menu">
            <span style="font-size:2em;font-weight:700;color:#232323;">&#8942;</span>
          </button>
        </div>
        <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>
      `;
      container.querySelector("#headerDotsBtn").onclick = e => showFriendsMenuDropdown(e, container, user);
      return;
    }
    allFriends = list;
    render('');
  }

  fetchFriendsList();
}
