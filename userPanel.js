import { showDashboard } from './dashboard.js';
import { showManageSpend } from './manageSpend.js';
import { showFriends } from './friends.js';

export async function showUserPanel(container, auth) {
  container.innerHTML = `
    <div style="position:relative; width:100%;">
      <button id="menuBtn"
        style="position:absolute;top:0;left:0;background:none;border:none;padding:15px 23px 14px 15px;font-size:2em;cursor:pointer;z-index:101">
        &#9776;
      </button>
      <div id="mainContent"></div>
      <div id="simpleMenu"
        style="opacity:0; pointer-events:none; position:fixed; left:50%; top:90px; transform:translateX(-50%) scale(0.98);
        width:90vw; max-width:340px; background:#fff; border-radius:12px; box-shadow:0 4px 24px #0002; border:1px solid #eee;
        z-index:150; transition:opacity 0.22s cubic-bezier(.45,1.6,.41,1), transform 0.17s cubic-bezier(.45,1.6,.41,1);">
        <div id="userHeader" style="display:flex;align-items:center;padding:18px 18px 16px 18px;">
          <span id="avatarCircle"
            style="background:#e1e6ef;color:#355;font-weight:700;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;font-size:1.2em;margin-right:13px;">
          </span>
          <span id="menuName" style="font-size:1.12em;font-weight:600;"></span>
        </div>
        <div style="border-bottom:1px solid #ececec;"></div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="dashboard">Dashboard</div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="spend">Manage Spend</div>
        <div style="padding:16px 18px;cursor:pointer;" id="friends">Friends</div>
      </div>
    </div>
  `;

  const menuBtn = container.querySelector("#menuBtn");
  const simpleMenu = container.querySelector("#simpleMenu");
  const avatarCircle = container.querySelector("#avatarCircle");
  const menuName = container.querySelector("#menuName");
  const mainContent = container.querySelector("#mainContent");

  // Name/avatar fetching on load
  let userDisplayName = "Unknown";
  let userInitials = "??";
  async function fetchNameAndAvatar() {
    try {
      if (!auth.currentUser) throw new Error("No logged in user");
      await auth.currentUser.reload();
      const token = await auth.currentUser.getIdToken(true);
      const resp = await fetch("https://us-api.nafil-8895-s.workers.dev/api/userpanel", {
        headers: { Authorization: "Bearer " + token },
        mode: "cors",
      });
      const data = await resp.json();
      if (resp.status === 200 && data.name) {
        userDisplayName = data.name;
        userInitials = (data.name.match(/[A-Z]/gi) || []).join('').toUpperCase().slice(0,2) || "??";
      }
    } catch (e) {}
    menuName.textContent = userDisplayName;
    avatarCircle.textContent = userInitials;
  }
  await fetchNameAndAvatar();

  // Load dashboard by default
  showDashboard(mainContent, { name: userDisplayName });

  // Menu logic
  menuBtn.onclick = () => {
    simpleMenu.style.opacity = "1";
    simpleMenu.style.transform = "translateX(-50%) scale(1)";
    simpleMenu.style.pointerEvents = "auto";
  };
  document.addEventListener("click", function handler(e) {
    if (!simpleMenu.contains(e.target) && e.target !== menuBtn) closeMenu();
  });
  container.querySelector("#dashboard").onclick = () => {
    closeMenu();
    showDashboard(mainContent, { name: userDisplayName });
  };
  container.querySelector("#spend").onclick = () => {
    closeMenu();
    showManageSpend(mainContent, { name: userDisplayName });
  };
  container.querySelector("#friends").onclick = () => {
    closeMenu();
    showFriends(mainContent, { name: userDisplayName });
  };

  function closeMenu() {
    simpleMenu.style.opacity = "0";
    simpleMenu.style.transform = "translateX(-50%) scale(0.98)";
    simpleMenu.style.pointerEvents = "none";
  }
}
