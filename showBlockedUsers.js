// showBlockedUsers.js

export function showBlockedUsersModal(container, user) {
  let modal = document.getElementById('blockedUsersModal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'blockedUsersModal';
  modal.style = `
    position:fixed;left:0;top:0;width:100vw;height:100vh;
    background:rgba(243,243,243,0.89);
    z-index:999999;
    display:flex;align-items:center;justify-content:center;
    font-family:inherit;
  `;

  modal.innerHTML = `
    <div style="
      width:95vw;max-width:410px;max-height:85vh;overflow-y:auto;
      background:#fff;
      border-radius:15px;
      box-shadow:0 4px 26px #0002;
      padding:26px 18px 22px 18px;
      position:relative;
      text-align:center;">
      <button id="backBtnBlocked" style="
        position:absolute;left:12px;top:13px;padding:7px 10px 7px 8px;border:none;
        background:none;font-size:1.24em;cursor:pointer;color:#222;border-radius:7px;
        transition:background .13s;" aria-label="Back"
        onmouseover="this.style.background='#f4f4f6'" onmouseout="this.style.background='none'">&#8592;</button>
      <div style="font-size:1.7em;margin-bottom:.11em;">🔒</div>
      <div style="font-size:1.15em;font-weight:600;margin-bottom:.33em;">Blocked Users</div>
      <div id="blockList" style="margin-top:1em;min-height:60px;">
        <div style="color:#888;">Loading blocked users...</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#backBtnBlocked").onclick = () => {
    modal.remove();
    if (window._showFriendsMainView)
      window._showFriendsMainView();
  };

  (async function() {
    let blockList = modal.querySelector("#blockList");
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        blockList.innerHTML = `<div style="color:#d12020;text-align:center;font-size:1.15em;margin:1.6em 0;">Please log in.</div>`;
        return;
      }
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/blocked', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const text = await res.text();
      let blocked = [];
      try { blocked = JSON.parse(text); } catch (e) {}
      if (!Array.isArray(blocked)) {
        if (blocked && blocked.error) {
          blockList.innerHTML = `<div style="color:#d12020;text-align:center;">Backend: ${blocked.error}</div>`;
        } else {
          blockList.innerHTML = `<div style="color:#d12020;text-align:center;">Unexpected error.</div>`;
        }
        return;
      }
      if (blocked.length === 0) {
        blockList.innerHTML = `<div style="color:#777;font-size:1.04em;margin:2.5em 0;">No users are currently blocked.</div>`;
        return;
      }
      blockList.innerHTML = '';
      blocked.forEach(bu => {
        const row = document.createElement('div');
        row.style = `
          display:flex;align-items:center;gap:13px;padding:11px 0 11px 0;border-bottom:1px solid #f1f1f1;
        `;
        row.innerHTML = `
          <span style="font-size:1.07em;flex:1 1 0;overflow:hidden;">
            ${bu.name ? bu.name + ' ' : ''}<span style="color:#999;">@${bu.username}</span>
          </span>
          <button class="blockUnblock"
            style="background:#e74c3c;color:#fff;padding:6px 14px;border:none;border-radius:7px;font-size:1em;cursor:pointer;">
            Unblock
          </button>
        `;
        row.querySelector('.blockUnblock').onclick = async () => {
          const btn = row.querySelector('.blockUnblock');
          btn.textContent = 'Unblocking...';
          btn.disabled = true;
          try {
            const token = await user.firebaseUser.getIdToken();
            const resp = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/unblock', {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
              body: JSON.stringify({ username: bu.username })
            });
            const out = await resp.json();
            if (out.ok) {
              row.remove();
              if (!blockList.children.length)
                blockList.innerHTML = `<div style="color:#777;font-size:1.04em;margin:2.5em 0;">No users are currently blocked.</div>`;
            } else {
              btn.textContent = "Unblock";
              btn.disabled = false;
              alert(out.error || "Failed to unblock.");
            }
          } catch (e) {
            btn.textContent = "Unblock";
            btn.disabled = false;
            alert(e.message);
          }
        };
        blockList.appendChild(row);
      });
    } catch (e) {
      blockList.innerHTML = `<div style="color:#d12020;text-align:center;">Network error: ${e.message}</div>`;
    }
  })();
}
