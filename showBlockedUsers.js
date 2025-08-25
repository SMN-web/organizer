import { showSpinner, hideSpinner, delay } from './spinner.js';

export function showBlockedUsersModal(container, user) {
  container.innerHTML = `<div style="text-align:center;font-size:1.13em;padding-top:2.6em;">Loading blocked users...</div>`;
  (async function() {
    let error = '';
    let blocks = [];
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        await delay(400);
        container.innerHTML = `<div style="color:#d12020;margin:2em;text-align:center;">Please log in.</div>`;
        return;
      }
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/blocked', {
        headers: { Authorization: "Bearer " + token }
      });
      const text = await res.text();
      try {
        blocks = JSON.parse(text);
      } catch (e) {
        error = "Invalid backend: " + text;
      }
      if (!Array.isArray(blocks)) {
        if (blocks && blocks.error) error = "Backend: " + blocks.error;
        else error = "Unexpected error: " + text;
      }
    } catch (e) {
      error = "Network: " + e.message;
    }

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
    container.querySelector("#bbBack").onclick = () =>
      window._showFriendsMainView && window._showFriendsMainView();

    const blockList = container.querySelector("#blockList");
    if (!blocks.length) {
      blockList.innerHTML = `<div style="margin:3em 0;color:#888;font-size:1.13em;text-align:center;">You have not blocked anyone.</div>`;
      return;
    }
    blocks.forEach(bu => {
      const row = document.createElement("div");
      row.style = "display:flex;align-items:center;gap:15px;padding:10px 0;border-bottom:1px solid #efefef;";
      row.innerHTML = `
        <span style="font-size:1.05em;flex:1 1 0;">${bu.name || bu.username} <span style="color:#999;">@${bu.username}</span></span>
        <button class="blockUnblock" style="background:#e74c3c;color:#fff;padding:6px 13px;border:none;border-radius:7px;font-size:1em;">Unblock</button>
      `;
      row.querySelector('.blockUnblock').onclick = async () => {
        row.querySelector('.blockUnblock').textContent = 'Unblocking...';
        row.querySelector('.blockUnblock').disabled = true;
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/unblock', {
          method: "POST",
          headers: { "Content-Type":"application/json","Authorization":"Bearer "+token },
          body: JSON.stringify({ username: bu.username })
        });
        const out = await resp.json();
        if (out.ok) {
          row.remove();
          if (!blockList.children.length)
            blockList.innerHTML = `<div style="margin:3em 0;color:#888;font-size:1.13em;text-align:center;">You have not blocked anyone.</div>`;
        } else {
          alert(out.error || "Failed to unblock.");
          row.querySelector('.blockUnblock').textContent = 'Unblock';
          row.querySelector('.blockUnblock').disabled = false;
        }
      };
      blockList.appendChild(row);
    });
  })();
}
