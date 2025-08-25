// showBlockedUsers.js

export function showBlockedUsersSheet(container, user) {
  // Remove previous sheet
  const prev = document.getElementById('blockedUsersSheetModal');
  if (prev) prev.remove();

  // Get friends panel coordinates
  const rect = container.getBoundingClientRect();
  const scrollY = window.scrollY, scrollX = window.scrollX;

  console.log('Blocked users sheet overlay position:', rect.left + scrollX, rect.top + scrollY);

  // Create overlay just above this friends panel section
  const sheet = document.createElement("div");
  sheet.id = "blockedUsersSheetModal";
  sheet.style = `
    position:absolute;
    left:${rect.left + scrollX}px;
    top:${rect.top + scrollY}px;
    width:${rect.width}px;
    height:${rect.height}px;
    z-index:999999;
    background:rgba(252,252,253,0.98);
    display:flex;align-items:flex-start;justify-content:center;
    pointer-events:auto;
    font-family:inherit;
  `;
  sheet.innerHTML = `
    <div style="
      margin:43px auto 0 auto;
      width:96vw;max-width:420px;
      background:#fff;
      border-radius:15px;
      box-shadow:0 4px 26px #0002;
      padding:29px 17px 33px 17px;
      position:relative;
      text-align:center;">
      <button id="backBtnBlocked" style="
        position:absolute;left:12px;top:14px;padding:7px 12px 6px 8px;border:none;
        background:none;font-size:1.3em;cursor:pointer;color:#222;border-radius:6px;
        transition:background .13s;line-height:1;" aria-label="Back"
        onmouseover="this.style.background='#f4f4f6'" onmouseout="this.style.background='none'">&#8592;</button>
      <div style="font-size:2em;margin-bottom:.22em;line-height:1.2;">🔒</div>
      <div style="font-size:1.18em;font-weight:600;margin-bottom:.38em;">Blocked Users</div>
      <div style="color:#444;font-size:0.99em;text-align:center;margin-bottom:5px;">
        Custom message: Here is where your blocked users will appear.
      </div>
      <div style="color:#7a7a7a;font-size:.94em;text-align:center;opacity:.95;">
        You can integrate your actual unblock logic here.
      </div>
    </div>
  `;
  document.body.appendChild(sheet);

  // Debug log to confirm append
  console.log('Blocked users modal appended');

  sheet.querySelector("#backBtnBlocked").onclick = () => {
    sheet.remove();
    if (window._showFriendsMainView) window._showFriendsMainView();
  };

  // Safety: Remove on navigation/resize
  const removeSheet = () => { if (sheet) sheet.remove(); window.removeEventListener("resize", removeSheet); };
  window.addEventListener("resize", removeSheet);
}
