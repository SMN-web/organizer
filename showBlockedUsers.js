export function showBlockedUsers(container, user) {
  // Remove any old modal
  let modal = document.getElementById('blockedUsersModal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'blockedUsersModal';
  modal.style = `
    position:fixed;left:0;top:0;width:100vw;height:100vh;
    background:rgba(245,245,245,0.98);
    z-index:1200000;
    display:flex;flex-direction:column;align-items:center;justify-content:flex-start;
    font-family:inherit;
  `;

  modal.innerHTML = `
    <div style="margin:44px auto 0 auto;width:98vw;max-width:420px;background:#fff;border-radius:15px;box-shadow:0 4px 26px #0002;padding:27px 22px 28px 22px;position:relative;">
      <button id="backBtnBlocked" style="position:absolute;left:12px;top:11px;padding:7px 11px;border:none;background:none;font-size:1.23em;cursor:pointer;color:#222;border-radius:7px;transition:background .13s" onmouseover="this.style.background='#f4f4f6'" onmouseout="this.style.background='none'">&#8592; Back</button>
      <div style="margin:0 auto 0 auto;max-width:300px;text-align:center;">
        <div style="font-size:2em;margin-bottom:.55em;">🔓</div>
        <div style="font-size:1.17em;font-weight:600;margin-bottom:0.52em;">Blocked Users</div>
        <div style="color:#666;font-size:1.06em;opacity:.91;">Custom message: Here is where your blocked users will appear.<br><br>You can integrate your actual unblock logic here.</div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#backBtnBlocked").onclick = () => {
    modal.remove();
    if (window._showFriendsMainView) window._showFriendsMainView();
  };
}
