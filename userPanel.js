import { showManageSpend } from './manageSpend.js';

export async function showUserPanel(container, auth) {

  // Initial skeleton for panel, menu, and the content area
  container.innerHTML = `
    <div style="position:relative; width:100%;">
      <button id="menuBtn"
        style="position:absolute;top:0;left:0;background:none;border:none;padding:15px 23px 14px 15px;font-size:2em;cursor:pointer;z-index:101">
        &#9776;
      </button>
      <div id="mainContent">
        <div id="messageBox"
          style="padding-top:60px;min-height:2.6em;display:flex;align-items:center;justify-content:center;color:#27ae60;font-size:1.18em;text-align:center;">
        </div>
      </div>
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
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="friends">Friend List</div>
        <div style="padding:16px 18px;cursor:pointer;" id="managefriends">Friends Manage</div>
      </div>
    </div>
  `;

  const menuBtn = container.querySelector("#menuBtn");
  const simpleMenu = container.querySelector("#simpleMenu");
  const avatarCircle = container.querySelector("#avatarCircle");
  const menuName = container.querySelector("#menuName");
  const mainContent = container.querySelector("#mainContent");
  const messageBox = container.querySelector("#messageBox");

  // --- Fast Name Fetch: Get ON PAGE LOAD (not menu open) ---
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
      } else {
        userDisplayName = "Unknown";
        userInitials = "??";
      }
    } catch (e) {
      userDisplayName = "Unknown";
      userInitials = "??";
    }
    // Always set these in the menu, even if menu is not visible yet
    menuName.textContent = userDisplayName;
    avatarCircle.textContent = userInitials;
  }

  // Immediately fetch name/avatar on load
  await fetchNameAndAvatar();

  // --- Menu logic ---
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    simpleMenu.style.opacity = "1";
    simpleMenu.style.transform = "translateX(-50%) scale(1)";
    simpleMenu.style.pointerEvents = "auto";
    // Name is already set, so it shows instantly
  };
  document.addEventListener("click", function handler(e) {
    if (!simpleMenu.contains(e.target) && e.target !== menuBtn) closeMenu();
  });

  container.querySelector("#dashboard").onclick = () => { showCentered("Welcome to your Dashboard!"); };
  container.querySelector("#spend").onclick = () => {
    closeMenu();
    showManageSpend(mainContent); // loads Manage Spend module
  };
  container.querySelector("#friends").onclick = () => { showCentered("This is your friend list."); };
  container.querySelector("#managefriends").onclick = () => { showCentered("Manage friends and connections here."); };

  function showCentered(msg) {
    mainContent.innerHTML = `
      <div id="messageBox"
        style="padding-top:60px;min-height:2.5em;display:flex;align-items:center;justify-content:center;color:#27ae60;font-size:1.18em;text-align:center;">
        ${msg}
      </div>
    `;
    closeMenu();
  }

  function closeMenu() {
    simpleMenu.style.opacity = "0";
    simpleMenu.style.transform = "translateX(-50%) scale(0.98)";
    simpleMenu.style.pointerEvents = "none";
  }
}
