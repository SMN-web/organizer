import { showSpinner, hideSpinner, delay } from './spinner.js';

export function showListFriends(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let allFriends = [];

  function createDropdown(friend, parentRow, onActionDone) {
    // Remove old
    for (let el of document.querySelectorAll('.friendDropdown')) el.remove();
    const dd = document.createElement('div');
    dd.className = 'friendDropdown';
    dd.style = `
      position:absolute;top:40px;left:0;
      min-width:140px;max-width:88vw;
      background:#fff;
      border:1px solid #eee;
      box-shadow:0 2px 12px #0001;
      border-radius:8px;
      padding:7px 0;
      font-size:1em;
      z-index:9999;
      word-break:break-word;
      overflow:hidden;
    `;
    dd.innerHTML = `
      <div style="padding:11px 17px;cursor:pointer;" class="ddUnfriend">Unfriend</div>
      <div style="padding:11px 17px;cursor:pointer;color:#b22;" class="ddBlock">Block</div>
    `;

    dd.querySelector('.ddUnfriend').onclick = async () => {
      dd.innerHTML = `<div style="padding:13px;text-align:center;">Unfriending...</div>`;
      showSpinner(container); await delay(1000);
      try {
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/unfriend', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: friend.username })
        });
        hideSpinner(container);
        const out = await resp.json();
        if (out.ok) {
          parentRow.remove();
          onActionDone && onActionDone('unfriend');
        } else {
          dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        hideSpinner(container);
        dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
    };

    dd.querySelector('.ddBlock').onclick = async () => {
      dd.innerHTML = `<div style="padding:13px;text-align:center;">Blocking...</div>`;
      showSpinner(container); await delay(1000);
      try {
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/block', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: friend.username })
        });
        hideSpinner(container);
        const out = await resp.json();
        if (out.ok) {
          parentRow.remove();
          onActionDone && onActionDone('block');
        } else {
          dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        hideSpinner(container);
        dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
    };

    setTimeout(() => {
      function handle(e) {
        if (!dd.contains(e.target)) {
          dd.remove();
          document.removeEventListener('mousedown', handle);
        }
      }
      document.addEventListener('mousedown', handle);
    }, 1);

    parentRow.appendChild(dd);
  }

  async function fetchFriendsList() {
    showSpinner(container);
    const start = Date.now();
    let list = [], errMsg = '';
    try {
      if (!user?.firebaseUser) throw new Error('Please log in.');
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/list', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const text = await res.text();
      await delay(Math.max(0, 1200 - (Date.now() - start)));
      try { list = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
      if (!Array.isArray(list)) {
        if (list && list.error) errMsg = "Backend error: " + list.error;
        else errMsg = "Unexpected backend error: " + text;
      }
    } catch (e) { errMsg = "Network error: " + e.message; }
    hideSpinner(container);

    if (errMsg) {
      container.innerHTML = `<div style="color:#d12020;font-size:1.1em;margin:1.5em 0;">${errMsg}</div>`;
      return;
    }
    allFriends = list;
    render();
  }

  function render(filterTerm = "") {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:9px;">
        My Friends
      </div>
      <input id="friendFilter" type="text" placeholder="Filter by name or username" style="width:98%;max-width:330px;margin-bottom:17px;padding:0.5em 1em;border-radius:7px;border:1px solid #dde;">
      <div id="friendList" style="max-height:54vh;overflow-y:auto;"></div>
    `;
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
    if (friends.length === 0) {
      friendList.innerHTML = `<div style="margin:2em 0;color:#888;">No friends found.</div>`;
      return;
    }
    friends.forEach(friend => {
      const row = document.createElement("div");
      row.style =
        "position:relative;margin:13px 0;display:flex;align-items:center;gap:18px;padding:10px 0 10px 0;overflow-wrap:break-word;word-break:break-word;";
      row.innerHTML = `
        <div class="friendNameClickable" style="cursor:pointer;flex:1 1 0;display:flex;flex-direction:column;">
          <span style="font-size:1.07em;font-weight:500;">${friend.name || friend.username}</span>
          <span style="font-size:0.97em;color:#888;margin-top:-1px;">@${friend.username}</span>
        </div>
        <span style="font-size:1.25em;cursor:pointer;color:#bbb;">&#8942;</span>
      `;
      row.querySelector('.friendNameClickable').onclick = e => {
        createDropdown(friend, row);
      };
      row.querySelector('span[style*="cursor:pointer;color:#bbb"]').onclick = e => {
        createDropdown(friend, row);
      };
      friendList.appendChild(row);
    });
  }

  fetchFriendsList();
}
