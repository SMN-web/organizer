// friendsMenu.js
export function showFriendsMenu(container, user) {
  function removeModal() {
    let modal = document.getElementById('mobActionsModal');
    if (modal) modal.remove();
  }

  const dotsBtn = document.createElement("button");
  dotsBtn.type = "button";
  dotsBtn.className = "friendDots";
  dotsBtn.innerHTML = '<span style="font-size:2em;font-weight:700;color:#232323;">&#8942;</span>';
  dotsBtn.style = `
    background:none;border:none;margin:0 2px 0 0;padding:0;
    cursor:pointer;outline:none;line-height:1;
    display:flex;align-items:center;justify-content:center;
    min-width:30px;min-height:30px;height:34px;
  `;

  dotsBtn.onclick = () => {
    removeModal();
    const modal = document.createElement('div');
    modal.id = 'mobActionsModal';
    modal.style = `
      position:fixed;left:50%;top:92px;transform:translateX(-50%);
      background:#fff;border-radius:14px;box-shadow:0 1px 16px #0002;border:1px solid #eee;
      min-width:170px;max-width:90vw;padding:14px 0 6px 0;z-index:130000;
      text-align:center;font-size:1.13em;`;
    modal.innerHTML = `<div style="padding:17px">Custom message shown!</div>`;
    document.body.appendChild(modal);

    setTimeout(() => {
      function esc(ev) {
        if (!modal.contains(ev.target) && ev.target !== dotsBtn) {
          modal.remove();
          document.removeEventListener('mousedown', esc, true);
          document.removeEventListener('touchstart', esc, true);
        }
      }
      document.addEventListener('mousedown', esc, true);
      document.addEventListener('touchstart', esc, true);
    }, 10);
  };
  return dotsBtn;
}
