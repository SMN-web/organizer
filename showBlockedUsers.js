// showBlockedUsers.js 12.13

export function showBlockedUsers(container, user) {
  // Replaces the friends panel container (no overlay/modal)
  container.innerHTML = `
    <div style="padding:19px 0 0 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
        <button id="backBtnBlocked" style="
          color:#222;background:none;border:none;font-size:1em;padding:0 7px 0 2px;cursor:pointer;">&#8592; Back</button>
        <span style="font-size:1.18em;font-weight:600;flex:1 1 auto;text-align:center;">
          <span style="font-size:1.09em;vertical-align:middle;">🔒</span> Blocked Users
        </span>
        <span style="width:36px;"></span>
      </div>
      <div style="margin:28px 5px 0 5px;padding:21px 13px 20px 13px;
        background:#fcfcfc;border-radius:12px;box-shadow:0 1.5px 14px #0001;">
        <div style="color:#464646;font-size:0.99em;text-align:center;margin-bottom:7px;">
          Custom message: Here is where your blocked users will appear.
        </div>
        <div style="color:#7a7a7a;font-size:.95em;text-align:center;opacity:.94;">
          You can integrate your actual unblock logic here.<br>
          This appears inside the My Friends panel, styled with your app.
        </div>
      </div>
    </div>
  `;
  container.querySelector("#backBtnBlocked").onclick = () => {
    if (window._showFriendsMainView) window._showFriendsMainView();
  };
}
