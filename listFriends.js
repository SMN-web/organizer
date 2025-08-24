import { showSpinner, hideSpinner, delay } from './spinner.js';

// ---------- Blocked Users Modal ----------
export function showBlockedUsers(container, user) {
  container.innerHTML = `<div style="text-align:center;font-size:1.13em;padding-top:2.6em;">Loading blocked users...</div>`;
  (async function() {
    let error = '', blocks = [];
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        container.innerHTML = `<div style="color:#d12020;margin:2em;text-align:center;">Please log in.</div>`;
        return;
      }
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/blocked', {
        headers: { Authorization: "Bearer "+token }
      });
      const text = await res.text();
      try { blocks = JSON.parse(text); }
      catch (e) { error = "Invalid backend: "+text; }
      if (!Array.isArray(blocks)) {
        if (blocks && blocks.error) error = "Backend: " + blocks.error;
        else error = "Unexpected error: " + text;
      }
    } catch (e) { error = "Network: " + e.message; }
    if (error) {
      container.innerHTML = `<div style="color:#d12020;text-align:center;margin-top:2em;">${error}</div>`;
      return;
    }
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;">
        <button style="border:none;background:none;font-size:1.6em;margin-left:-5px;" id="bbBack">&#8592;</button>
        <div style="flex:1;text-align:center;font-weight:600;">Blocked Users</div>
        <div style="width:38px;"></div>
      </div>
      <div id="blockList" style="margin-top:18px;"></div>
    `;
    container.querySelector("#bbBack").onclick = () => window._showFriendsMainView && window._showFriendsMainView();
    const blockList = container.querySelector("#blockList");
    if (!blocks.length) {
      blockList.innerHTML = `<div style="margin:3em 0;color:#888;font-size:1.13em;text-align:center;">You have not blocked anyone.</div>`;
      return;
    }
    blocks.forEach(bu => {
      const row = document.createElement("div");
      row.style = "display:flex;align-items:center;gap:15px;padding:10px 0 10px 0;border-bottom:1px solid #efefef;";
      row.innerHTML = `
        <span style="font-size:1.05em;flex:1 1 0;">${bu.name || bu.username} <span style="color:#999;">@${bu.username}</span></span>
        <button class="blockUnblock" style="background:#e74c3c;color:#fff;padding:6px 13px;border:none;border-radius:7px;font-size:1em;">Unblock</button>
      `;
      row.querySelector('.blockUnblock').onclick = async () => {
        row.querySelector('.blockUnblock').textContent = 'Unblocking...';
        row.querySelector('.blockUnblock').disabled = true;
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/unblock', {
          method:"POST",
          headers: { "Content-Type":"application/json","Authorization":"Bearer "+token },
          body: JSON.stringify({ username: bu.username })
        });
        const out = await resp.json();
        if (out.ok) {
          row.remove();
        } else {
          alert(out.error || "Failed to unblock.");
        }
      };
      blockList.appendChild(row);
    });
  })();
}

// ----------- Main Friends List UI -----------
export function showFriendsList(container, user) {
  container.innerHTML = '';
  showSpinner(container);
  let allFriends = [];
  let fab, modal;

  function addFAB() {
    fab && fab.remove();
    modal && modal.remove();
    fab = document.createElement("button");
    fab.innerHTML = '<span style="font-size:2.2em;line-height:1;">&#8942;</span>';
    fab.style = `
      position:fixed;bottom:28px;right:22px;
      background:#3498db;color:#fff;border:none;
      border-radius:50%;width:52px;height:52px;
      box-shadow:0 4px 15px #0001;
      z-index:99999;
      display:flex;align-items:center;justify-content:center;
      font-size:2em;
      transition:box-shadow 0.14s;
      cursor:pointer;user-select:none;
    `;
    fab.id = "_friendActionsFab";
    fab.ontouchstart = () => {};
    document.body.appendChild(fab);
    fab.onclick = () => {
      modal && modal.remove();
      modal = document.createElement("div");
      modal.id = "mobActionsModal";
      modal.style = `
        position:fixed;left:0;right:0;bottom:0;
        background:#fff;border-radius:14px 14px 0 0;
        min-height:110px;z-index:101000;box-shadow:0 1px 16px #0002;
        padding:9px 0 5px 0;text-align:center;
        animation:slideUp .18s;
        font-size:1.1em;
      `;
      modal.innerHTML = `
        <div style="margin:7px auto 2px auto;max-width:130px;border-radius:5px;height:4px;background:#ddd;"></div>
        <button id="mobBlockedBtn" style="border:none;background:none;font-size:1.15em;color:#e74c3c;padding:11px 0;width:100%;">View Blocked Users</button>
      `;
      document.body.appendChild(modal);
      document.body.style.overflowY = "hidden";
      setTimeout(() => {
        function esc(e) {
          if (!modal.contains(e.target)) {
            modal.remove();
            document.body.style.overflowY = "";
            document.removeEventListener('touchstart', esc, true);
          }
        }
        document.addEventListener('touchstart', esc, true);
      }, 20);
      modal.querySelector("#mobBlockedBtn").onclick = () => {
        modal.remove();
        document.body.style.overflowY = "";
        window._showFriendsMainView = () => showFriendsList(container, user);
        showBlockedUsers(container, user);
        fab && fab.remove();
      };
    };
  }

  function createDropdown(friend, parentRow) {
    for (let el of document.querySelectorAll('.friendDropdown')) el.remove();
    const dd = document.createElement('div');
    dd.className = 'friendDropdown';
    dd.style = `
      position:absolute;top:40px;right:0;
      min-width:130px;max-width:80vw;
      background:#fff;
      border:1px solid #eee;
      box-shadow:0 2px 12px #0002;
      border-radius:10px;
      padding:7px 0;
      font-size:1em;
      z-index:999999;
      word-break:break-word;
      overflow:hidden;`;
    dd.innerHTML = `
      <div style="padding:11px 17px;cursor:pointer;" class="ddUnfriend">Unfriend</div>
      <div style="padding:11px 17px;cursor:pointer;color:#b22;" class="ddBlock">Block</div>
    `;
    dd.querySelector('.ddUnfriend').onclick = async () => {
      dd.innerHTML = `<div style="padding:13px;text-align:center;">Unfriending...</div>`;
      showSpinner(parentRow); await delay(800);
      try {
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/unfriend', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: friend.username })
        });
        hideSpinner(parentRow);
        const out = await resp.json();
        if (out.ok) {
          parentRow.remove();
        } else {
          dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        hideSpinner(parentRow);
        dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
    };
    dd.querySelector('.ddBlock').onclick = async () => {
      dd.innerHTML = `<div style="padding:13px;text-align:center;">Blocking...</div>`;
      showSpinner(parentRow); await delay(800);
      try {
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/block', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: friend.username })
        });
        hideSpinner(parentRow);
        const out = await resp.json();
        if (out.ok) {
          parentRow.remove();
        } else {
          dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${out.error || "Error"}</div>`;
        }
      } catch (e) {
        hideSpinner(parentRow);
        dd.innerHTML = `<div style="padding:13px;text-align:center;color:#d12020;">${e.message}</div>`;
      }
    };
    setTimeout(() => {
      function handle(e) {
        if (!dd.contains(e.target)) {
          dd.remove();
          document.removeEventListener('touchstart', handle);
        }
      }
      document.addEventListener('touchstart', handle);
    }, 1);
    parentRow.appendChild(dd);
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

    addFAB();

    if (errMsg) {
      container.innerHTML = `
        <div style="font-weight:600;font-size:1.13em;margin-bottom:1em;">My Friends</div>
        <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>
      `;
      return;
    }
    allFriends = list;
    render('');
  }

  function render(filterTerm = "") {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:9px;text-align:center;">
        My Friends
      </div>
      <input id="friendFilter" type="text" placeholder="Filter by name or username" style="width:98%;max-width:330px;margin-bottom:17px;padding:0.5em 1em;border-radius:7px;border:1px solid #dde;display:block;margin-left:auto;margin-right:auto;">
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
      // Mobile (touch-first) menu handler
      row.querySelector('.friendMoreBtn').ontouchstart = e => {
        createDropdown(friend, row);
        e.stopPropagation();
      };
      // fallback for desktop
      row.querySelector('.friendMoreBtn').onclick = e => {
        createDropdown(friend, row);
        e.stopPropagation();
      };
      friendList.appendChild(row);
    });
  }

  fetchFriendsList();
}
