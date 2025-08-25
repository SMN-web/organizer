import { showSpinner, hideSpinner, delay } from './spinner.js';
import { showFriendsMenu } from './friendsMenu.js';

export function showFriendsList(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let allFriends = [];

  function renderHeader() {
    const old = container.querySelector('.panelHeaderRow');
    if (old) old.remove();

    const headerRow = document.createElement('div');
    headerRow.className = "panelHeaderRow";
    headerRow.style = `
      display:flex;justify-content:space-between;align-items:center;
      margin-bottom:10px;min-height:36px;padding-top:8px;padding-bottom:2px;
    `;
    const titleEl = document.createElement('div');
    titleEl.textContent = "My Friends";
    titleEl.style = "font-weight:600;font-size:1.13em;line-height:1.6;letter-spacing:.03em;";

    const menuBtn = showFriendsMenu(container, user);
    headerRow.appendChild(titleEl);
    headerRow.appendChild(menuBtn);

    container.prepend(headerRow);
  }

  // Overlay dropdown menu absolutely, always on top, closes on outside click
  function createDropdown(friend, parentRow, event) {
    // Remove existing
    for (let el of document.querySelectorAll('.friendDropdown')) el.remove();

    // Position the dropdown overlay relative to viewport
    const rect = event.target.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const dd = document.createElement('div');
    dd.className = 'friendDropdown';
    dd.style = `
      position:absolute;
      top:${rect.bottom + scrollY + 4}px;
      left:${rect.left + scrollX - 110 + rect.width}px;
      min-width:130px;
      background:#fff;
      border:1px solid #eee;
      box-shadow:0 2px 12px #0003;
      border-radius:10px;
      padding:7px 0;
      font-size:1em;
      z-index:120000;
      overflow:hidden;
      word-break:break-word;
    `;
    dd.innerHTML = `
      <div style="padding:11px 17px;cursor:pointer;" class="ddUnfriend">Unfriend</div>
      <div style="padding:11px 17px;cursor:pointer;color:#b22;" class="ddBlock">Block</div>
    `;

    document.body.appendChild(dd);

    dd.querySelector('.ddUnfriend').onclick = async () => {
      dd.innerHTML = `<div style="padding:13px;text-align:center;">Unfriending...</div>`;
      showSpinner(dd); await delay(500);
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
          dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
      setTimeout(() => dd.remove(), 800);
    };
    dd.querySelector('.ddBlock').onclick = async () => {
      dd.innerHTML = `<div style="padding:13px;text-align:center;">Blocking...</div>`;
      showSpinner(dd); await delay(500);
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
          dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
      setTimeout(() => dd.remove(), 800);
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
    }, 50);
  }

  function render(filterTerm = "") {
    renderHeader();

    const filterHtml = `
      <input id="friendFilter" type="text" placeholder="Filter by name or username"
        style="width:98%;max-width:330px;margin-bottom:17px;padding:0.5em 1em;border-radius:7px;
        border:1px solid #dde;display:block;margin-left:auto;margin-right:auto;">
      <div id="friendList" style="max-height:54vh;overflow-y:auto;"></div>
    `;
    const headerRowHtml = container.querySelector('.panelHeaderRow').outerHTML;
    container.innerHTML = headerRowHtml + filterHtml;

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
        <div class="friendNameClickable" style="cursor:pointer;flex:1 1 0;display:flex;flex-direction:column;">
          <span style="font-size:1.07em;font-weight:500;">${friend.name || friend.username}</span>
          <span style="font-size:0.97em;color:#888;margin-top:-1px;">@${friend.username}</span>
        </div>
        <span class="friendMoreBtn" style="font-size:1.45em;cursor:pointer;color:#bbb;padding:4px 8px;">&#8942;</span>
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
      renderHeader();
      container.innerHTML += `
        <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>
      `;
      return;
    }
    allFriends = list;
    render('');
  }

  fetchFriendsList();
}
