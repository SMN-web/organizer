// friendsMenu.js

import { showBlockedUsers } from './showBlockedUsers.js';

export function showFriendsMenuDropdown(e, container, user) {
  for (let el of document.querySelectorAll('.headerMenuDropdown')) el.remove();

  const btn = e?.currentTarget || e?.target || document.getElementById('headerDotsBtn');
  const rect = btn.getBoundingClientRect();
  const scrollY = window.scrollY, scrollX = window.scrollX;

  const menu = document.createElement('div');
  menu.className = 'headerMenuDropdown';
  menu.style = `
    position:absolute;
    left:${rect.left + scrollX}px;
    top:${rect.bottom + scrollY + 3}px;
    min-width:180px;max-width:96vw;
    background:#fff;
    border:1.7px solid #e4e4e4;
    box-shadow:0 6px 34px #0002,0 2px 8px #0001;
    border-radius:14px;
    z-index:999999;
    font-size:1.08em;
    animation:fadein .13s;
    padding:5px 0 7px 0;
    font-family:inherit;
    overflow:hidden;
    text-align:left;
  `;

  menu.innerHTML = `
    <button id="menuUnblock" style="
      background:none;border:none;padding:12px 22px 12px 22px;display:block;width:100%;text-align:left;font-size:1.08em;cursor:pointer;color:#206;"
    >Unblock</button>
  `;
  document.body.appendChild(menu);

  menu.querySelector("#menuUnblock").onclick = () => {
    menu.remove();
    showBlockedUsers(container, user); // this triggers the modal/panel
  };

  // Dismiss on out click/tap
  setTimeout(() => {
    function esc(ev) {
      if (!menu.contains(ev.target) && ev.target !== btn) {
        menu.remove();
        document.removeEventListener('mousedown', esc, true);
        document.removeEventListener('touchstart', esc, true);
      }
    }
    document.addEventListener('mousedown', esc, true);
    document.addEventListener('touchstart', esc, true);
  }, 10);
}
