// friendsMenu.js

// Call this from your header three-dot's onClick, passing the event
export function showFriendsMenuDropdown(triggerEvent) {
  // Remove any previously open menu
  for (let el of document.querySelectorAll('.headerMenuDropdown')) el.remove();

  const rect = triggerEvent.target.getBoundingClientRect();
  const scrollY = window.scrollY, scrollX = window.scrollX;

  const menu = document.createElement('div');
  menu.className = 'headerMenuDropdown';
  menu.style = `
    position:absolute;
    left:${rect.left + scrollX}px;
    top:${rect.bottom + scrollY + 3}px;
    min-width:180px;max-width:96vw;
    background:#fff;
    border:1.8px solid #e4e4e4;
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
    <div style="padding:18px 22px;font-weight:600;font-size:1.1em;color:#232323;">Menu</div>
    <div style="padding:12px 22px;color:#525;opacity:0.88;">Custom message: Friends menu coming soon!</div>
    <hr style="opacity:.20;margin:7px 0 4px 0;">
    <button style="
      background:none;border:none;padding:9px 22px;width:100%;text-align:left;font-size:1em;cursor:pointer;color:#237"
      onclick="this.closest('.headerMenuDropdown').remove()"
    >Close</button>
  `;

  document.body.appendChild(menu);

  setTimeout(() => {
    function esc(ev) {
      if (!menu.contains(ev.target) && ev.target !== triggerEvent.target) {
        menu.remove();
        document.removeEventListener('mousedown', esc, true);
        document.removeEventListener('touchstart', esc, true);
      }
    }
    document.addEventListener('mousedown', esc, true);
    document.addEventListener('touchstart', esc, true);
  }, 10);
}
