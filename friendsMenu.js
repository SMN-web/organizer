// friendsMenu.js
export function showFriendsMenu(container, user) {
  // Remove any previous menu
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

    modal.querySelector("#mobBlockedBtn").onclick = () => {
      modal.remove();
      container.innerHTML = `
        <div style="margin:3em auto;max-width:330px;text-align:center;">
          <div style="font-size:2.1em;margin-bottom:0.6em;">🔒</div>
          <div style="font-size:1.22em;margin-bottom:0.5em;font-weight:bold;">Blocked Users Coming Soon</div>
          <div style="color:#888;font-size:1.08em;">Your blocked users panel will appear here soon.<br><br>Use the menu above to navigate to future features.</div>
        </div>
        <div style="text-align:center;margin-top:2.2em;">
          <button id="backToFriendsPanel" style="border:none;background:#eee;border-radius:8px;padding:0.7em 1.5em;font-size:1.06em;"
          >Back</button>
        </div>
      `;
      container.querySelector("#backToFriendsPanel").onclick = () => {
        location.reload(); // Replace with: showFriendsList(container, user) if available!
      };
    };
  };

  return dotsBtn;
}
