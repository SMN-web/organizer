// showBlockedUsers.js

// Render a "sheet" (modal card) INSIDE the friends container
export function showBlockedUsersSheet(container, user) {
  // Remove any old sheet in container
  let old = container.querySelector('.blockedUsersSheet');
  if (old) old.remove();

  // Parent must be relative for absolute positioning
  container.style.position = "relative";

  const sheet = document.createElement('div');
  sheet.className = "blockedUsersSheet";
  sheet.style = `
    position:absolute;
    left:0; top:0; width:100%; height:100%; min-height:320px;
    background:rgba(252,252,253,0.97);
    z-index:4100;
    display:flex;align-items:start;justify-content:center;
    padding-top:28px;
    border-radius:14px;
    box-shadow:0 2px 18px #0001, 0 1px 2px #0001;
    transition:box-shadow .18s;
  `;

  sheet.innerHTML = `
    <div style="
      width:97vw;max-width:415px;
      background:#fff;
      border-radius:15px;
      box-shadow:0 4px 24px #0002;
      padding:29px 17px 29px 17px;
      position:relative;
      margin:auto;">
      <button id="backBtnBlocked" style="
        position:absolute;left:12px;top:15px;padding:6px 11px 7px 8px;border:none;
        background:none;font-size:1.19em;cursor:pointer;color:#222;border-radius:6px;
        transition:background .13s;line-height:1;" aria-label="Back"
        onmouseover="this.style.background='#f4f4f6'" onmouseout="this.style.background='none'">&#8592;</button>
      <div style="font-size:2em;margin-bottom:.18em;line-height:1.21;">🔒</div>
      <div style="font-size:1.15em;font-weight:600;margin-bottom:.38em;">Blocked Users</div>
      <div style="color:#444;font-size:0.98em;text-align:center;margin-bottom:4px;">
        Custom message: Here is where your blocked users will appear.
      </div>
      <div style="color:#7a7a7a;font-size:.94em;text-align:center;opacity:.95;">
        You can integrate your actual unblock logic here.
      </div>
    </div>
  `;

  container.appendChild(sheet);

  sheet.querySelector("#backBtnBlocked").onclick = () => {
    sheet.remove();
    if (container.querySelector('.blockedUsersSheet')) {
      container.querySelector('.blockedUsersSheet').remove();
    }
    // Optionally re-render panel
    if (window._showFriendsMainView) window._showFriendsMainView();
  };
}
