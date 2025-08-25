import { showBlockedUsers } from './showBlockedUsers.js';

export function showFriendsMenu(container, user) {
  const dotsBtn = document.createElement("button");
  dotsBtn.type = "button";
  dotsBtn.className = "friendDots";
  dotsBtn.innerHTML = '<span style="font-size:2em;font-weight:700;color:#232323;letter-spacing:2px;padding-right:2px;">&#8942;</span>';
  dotsBtn.style = `
    background:none;border:none;margin:0 2px 0 0;padding:0;
    cursor:pointer;outline:none;line-height:1;
    display:flex;align-items:center;justify-content:center;
    min-width:30px;min-height:30px;height:34px;
  `;

  dotsBtn.onclick = () => {
    let modal = document.getElementById("mobActionsModal");
    if (modal) modal.remove();

    modal = document.createElement("div");
    modal.id = "mobActionsModal";
    modal.style = `
      position:fixed;left:50%;top:92px;transform:translateX(-50%);
      background:#fff;border-radius:14px;box-shadow:0 1px 16px #0002;border:1px solid #eee;
      min-width:170px;max-width:90vw;padding:14px 0 6px 0;z-index:101000;
      text-align:center;font-size:1.13em;animation:fadeinA .14s;
    `;
    modal.innerHTML = `
      <button id="mobBlockedBtn"
        style="border:none;background:none;font-size:1em;color:#222;padding:11px 26px;width:100%;font-weight:bold;">
        View Blocked Users
      </button>
      <!-- Add more menu items here easily -->
    `;
    document.body.appendChild(modal);

    setTimeout(() => {
      function esc(e) {
        if (!modal.contains(e.target) && e.target !== dotsBtn) {
          modal.remove();
          document.removeEventListener('touchstart', esc, true);
          document.removeEventListener('mousedown', esc, true);
        }
      }
      document.addEventListener('touchstart', esc, true);
      document.addEventListener('mousedown', esc, true);
    }, 20);

    modal.querySelector("#mobBlockedBtn").onclick = () => {
      modal.remove();
      window._showFriendsMainView = () => import('./listFriends.js').then(m => m.showFriendsList(container, user));
      showBlockedUsers(container, user);
    };
  };

  return dotsBtn;
}
