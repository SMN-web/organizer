// friendsMenu.js (handles menu, currently just shows a message on selection)
export function showFriendsMenu(container, user) {
  // Remove any preexisting modal (for safety)
  function removeModal() {
    let modal = document.getElementById('mobActionsModal');
    if (modal) modal.remove();
  }

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

  dotsBtn.onclick = e => {
    removeModal();

    const modal = document.createElement('div');
    modal.id = 'mobActionsModal';
    modal.style = `
      position:fixed;left:50%;top:92px;transform:translateX(-50%);
      background:#fff;border-radius:14px;box-shadow:0 1px 16px #0002;border:1px solid #eee;
      min-width:170px;max-width:90vw;padding:14px 0 6px 0;z-index:101000;
      text-align:center;font-size:1.13em;
    `;
    modal.innerHTML = `
      <button id="mobBlockedBtn"
        style="border:none;background:none;font-size:1em;color:#222;padding:11px 26px;width:100%;font-weight:bold;">
        View Blocked Users
      </button>
      <!-- Add more menu items here as needed -->
    `;
    document.body.appendChild(modal);

    setTimeout(() => {
      function esc(ev) {
        if (!modal.contains(ev.target) && ev.target !== dotsBtn) {
          modal.remove();
          document.removeEventListener('touchstart', esc, true);
          document.removeEventListener('mousedown', esc, true);
        }
      }
      document.addEventListener('touchstart', esc, true);
      document.addEventListener('mousedown', esc, true);
    }, 20);

    // For now: just show a custom message on click
    modal.querySelector("#mobBlockedBtn").onclick = () => {
      modal.remove();
      // Show message in container
      container.innerHTML = `
        <div style="margin:3em auto;max-width:330px;text-align:center;">
          <div style="font-size:2.1em;margin-bottom:0.6em;">🔒</div>
          <div style="font-size:1.22em;margin-bottom:0.5em;font-weight:bold;">Blocked Users Coming Soon</div>
          <div style="color:#888;font-size:1.08em;">Your blocked users panel will appear here soon. <br><br>Use the menu above to navigate to future features.</div>
        </div>
      `;
    };
  };

  return dotsBtn;
}
