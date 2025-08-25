// friendsMenu.js

import { showBlockedUsers } from './showBlockedUsers.js';

// e: click event from header three-dot; container: inner panel container; user: user context
export function showFriendsMenuDropdown(e, container, user) {
  for (let el of document.querySelectorAll('.headerMenuDropdown')) el.remove();

  const btn = e?.currentTarget || e?.target || document.getElementById('headerDotsBtn');
  const rect = btn.getBoundingClientRect();
  const scrollY = window.scrollY, scrollX = window.scrollX;

  // Ensure menu doesn't overflow screen right edge
  const menuWidth = 170;
  const padding = 16;
  let left = rect.left + scrollX;
  if (left + menuWidth + padding > window.innerWidth) {
    left = window.innerWidth - menuWidth - padding;
  }

  const menu = document.createElement('div');
  menu.className = 'headerMenuDropdown';
  menu.style = `
    position:absolute;
    left:${left}px;
    top:${rect.bottom + scrollY + 6}px;
    min-width:${menuWidth}px;max-width:96vw;
    background:#fff;
    border:1.6px solid #e4e4e4;
    box-shadow:0 6px 34px #0002,0 2px 8px #0001;
    border-radius:13px;
    z-index:999999;
    font-size:0.96em;
    padding:4px 0 6px 0;
    font-family:inherit;
    overflow:hidden;
    text-align:left;
  `;

  menu.innerHTML = `
    <button id="menuUnblockUser" style="
      background:none;border:none;padding:12px 22px 12px 22px;display:block;width:100%;text-align:left;
      font-size:0.95em;cursor:pointer;color:#1761a0;letter-spacing:0.01em;">
      Unblock User
    </button>
  `;
  document.body.appendChild(menu);

  menu.querySelector("#menuUnblockUser").onclick = () => {
    menu.remove();
    showBlockedUsers(container, user); // Now renders inline in the panel!
  };

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
