// showBlockedUsers.js

export function showBlockedUsers(container, user) {
  // This REPLACES .innerHTML of the friends panel (matches screenshot #2)
  container.innerHTML = `
    <div style="padding:20px 0 0 0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px;">
        <button id="backBtnBlocked" style="
          color:#222;background:none;border:none;font-size:1.10em;padding:0 7px 0 2px;cursor:pointer;">&#8592; Back</button>
        <span style="font-size:1.27em;font-weight:600;flex:1 1 auto;text-align:center;">
          <span style="font-size:1.2em;vertical-align:middle;">🔓</span> Blocked Users
        </span>
        <span style="width:39px;"></span>
      </div>
      <div style="margin:28px 5px 0 5px;padding:26px 14px 25px 14px;
        background:#fcfcfc;border-radius:13px;box-shadow:0 1.5px 14px #0001;">
        <div style="color:#444;font-size:1.09em;text-align:center;margin-bottom:7px;">
          Custom message: Here is where your blocked users will appear.
        </div>
        <div style="color:#777;font-size:1em;text-align:center;opacity:.92;">
          You can integrate your actual unblock logic here.<br>
          This remains inside your friends panel, matching your app style!
        </div>
      </div>
    </div>
  `;
  container.querySelector("#backBtnBlocked").onclick = () => {
    if (window._showFriendsMainView) window._showFriendsMainView();
  };
}
