import { showDashboard } from './dashboard.js';
import { showManageSpend } from './manageSpend.js';
import { showFriends } from './friends.js';
import { showUserProfile } from './userProfile.js';
import { fetchNotificationsBadge, mountNotifications } from './notifications.js';
import { sendHeartbeat } from './heartbeat.js';

import { showPaymentsPanel } from './payments.js'; // <<====== NEW: Use the main tabbed panel

let heartbeatTimer = null;

export async function showUserPanel(container, auth) {
  container.innerHTML = `
    <div style="position:relative; width:100%; min-height:100vh;">
      <button id="menuBtn"
        style="position:absolute;top:0;left:0;background:none;border:none;padding:15px 23px 14px 15px;font-size:2em;cursor:pointer;z-index:102">
        &#9776;
      </button>
      <span id="notifyBell"
        style="position:absolute;top:0;right:0;background:none;padding:15px 17px 14px 15px;z-index:103;cursor:pointer;">
        <span id="notifyIcon"
          style="display:inline-block;vertical-align:middle;position:relative;font-size:1.4em;">
          &#128276;<span id="notifyCount"
          style="position:absolute;top:-8px;right:-8px;background:#d12020;color:#fff;
            min-width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;
            border-radius:50%;font-size:0.83em;padding:0 4px;font-weight:600;">
          </span>
        </span>
      </span>
      <div id="mainContent"></div>
      <div id="simpleMenu"
        style="opacity:0;pointer-events:none;position:fixed;left:50%;top:90px;transform:translateX(-50%) scale(0.98);
        width:90vw;max-width:340px;background:#fff;border-radius:12px;box-shadow:0 4px 24px #0002;border:1px solid #eee;
        z-index:150;transition:opacity 0.22s cubic-bezier(.45,1.6,.41,1),transform 0.17s cubic-bezier(.45,1.6,.41,1);display:flex;flex-direction:column;">
        <div id="userHeader" style="display:flex;align-items:center;padding:18px 18px 16px 18px;cursor:pointer;">
          <span id="avatarCircle"
            style="background:#e1e6ef;color:#355;font-weight:700;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;font-size:1.2em;margin-right:13px;">
          </span>
          <span id="menuName" style="font-size:1.12em;font-weight:600;"></span>
        </div>
        <div style="border-bottom:1px solid #ececec;"></div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="dashboard">Dashboard</div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="spend">Manage Spend</div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="payments">Payments</div>
        <div style="padding:16px 18px;cursor:pointer;" id="friends">Friends</div>
        <div style="flex:1;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px 14px 16px; border-top:1px solid #f3f3f3;">
          <a id="logoutBtn"
            style="color:#246bdb; font-size:1em; font-weight:700; text-decoration:underline;
              background:none; border:none; cursor:pointer; user-select:auto;">Logout</a>
          <select id="currencyDropdown"
            style="padding:4px 14px 4px 9px; font-size:1em; border-radius:7px; border:1.3px solid #cdd5de;
              outline:none; cursor:pointer; background:#f6f8fa; min-width:68px;">
            <option value="QAR">QAR</option>
            <option value="INR">INR</option>
          </select>
        </div>
      </div>
      <div id="loadingOverlay"
        style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(255,255,255,0.98);display:flex;align-items:center;justify-content:center;z-index:999;">
        <div class="spinner" style="width:44px;height:44px;border:5px solid #eee;border-top:5px solid #3498db;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      </div>
    </div>
    <style>
      @keyframes spin { 0% { transform: rotate(0deg);} 100% {transform: rotate(360deg);}}
    </style>
  `;

  const loadingOverlay = container.querySelector("#loadingOverlay");
  const menuBtn = container.querySelector("#menuBtn");
  const simpleMenu = container.querySelector("#simpleMenu");
  const avatarCircle = container.querySelector("#avatarCircle");
  const menuName = container.querySelector("#menuName");
  const mainContent = container.querySelector("#mainContent");
  const userHeader = container.querySelector("#userHeader");
  const logoutBtn = container.querySelector("#logoutBtn");
  const currencyDropdown = container.querySelector("#currencyDropdown");

  // --- CURRENCY DROPDOWN logic ---
  currencyDropdown.value = localStorage.getItem('currency') || "QAR";
  currencyDropdown.onchange = () => {
    localStorage.setItem('currency', currencyDropdown.value);
  };

  // --- HEARTBEAT LOGIC (unchanged) ---
  async function getFreshToken() {
    if (!auth.currentUser) throw new Error("Not logged in");
    return await auth.currentUser.getIdToken(true);
  }
  async function doHeartbeat() {
    try {
      const token = await getFreshToken();
      await sendHeartbeat(token);
    } catch (e) {}
  }
  function startHeartbeat() {
    clearHeartbeat();
    doHeartbeat();
    heartbeatTimer = setInterval(doHeartbeat, 2 * 60 * 1000);
  }
  function clearHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  startHeartbeat();
  window.addEventListener("hashchange", clearHeartbeat, { once: true });

  // Fetch user info (name, initials, email)
  let userDisplayName = "Unknown";
  let userInitials = "??";
  let userEmail = "";
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
        userEmail = data.email || "";
        userInitials = (data.name.match(/[A-Z]/gi) || []).join('').toUpperCase().slice(0,2) || "??";
      }
    } catch (e) {}
    menuName.textContent = userDisplayName;
    avatarCircle.textContent = userInitials;
  }
  await fetchNameAndAvatar();

  const userContext = {
    name: userDisplayName,
    email: userEmail,
    firebaseUser: auth.currentUser
  };

  await fetchNotificationsBadge(userContext, document.getElementById('notifyBell'));

  // --- Loading spinner ---
  menuBtn.disabled = true;
  simpleMenu.style.pointerEvents = "none";
  setTimeout(() => {
    loadingOverlay.style.display = "none";
    menuBtn.disabled = false;
    simpleMenu.style.pointerEvents = "";
  }, 1900);

  // --- Set up tab dispatchers ---
  const TAB_KEYS = {
    dashboard: showDashboard,
    spend: showManageSpend,
    friends: showFriends,
    userprofile: showUserProfile,
    payments: showPaymentsPanel // <<<< ***** CHANGE ONLY HERE
  };

  let lastTab = localStorage.getItem('lastTab') || 'dashboard';
  let tabToLoad = lastTab;
  if (!localStorage.getItem('userSignedIn')) {
    tabToLoad = 'dashboard';
    localStorage.setItem('userSignedIn', '1');
  }
  (TAB_KEYS[tabToLoad] || showDashboard)(mainContent, userContext);

  // --- Menu logic (unchanged) ---
  menuBtn.onclick = () => {
    simpleMenu.style.opacity = "1";
    simpleMenu.style.transform = "translateX(-50%) scale(1)";
    simpleMenu.style.pointerEvents = "auto";
  };
  document.addEventListener("click", function handler(e) {
    if (!simpleMenu.contains(e.target) && e.target !== menuBtn) closeMenu();
  });

  function selectTab(key) {
    closeMenu();
    localStorage.setItem('lastTab', key);
    (TAB_KEYS[key] || showDashboard)(mainContent, userContext);
  }

  container.querySelector("#dashboard").onclick = () => selectTab('dashboard');
  container.querySelector("#spend").onclick = () => selectTab('spend');
  container.querySelector("#payments").onclick = () => selectTab('payments');
  container.querySelector("#friends").onclick = () => selectTab('friends');
  userHeader.onclick = () => selectTab('userprofile');

  // --- Logout logic (unchanged) ---
  logoutBtn.onclick = async (e) => {
    e.preventDefault();
    localStorage.clear();
    await auth.signOut();
    location.reload();
  };

  function closeMenu() {
    simpleMenu.style.opacity = "0";
    simpleMenu.style.transform = "translateX(-50%) scale(0.98)";
    simpleMenu.style.pointerEvents = "none";
  }

  // --- Notification logic (unchanged) ---
  function showFriendsInbox(tabContainer, userContext) {
    showFriends(tabContainer, userContext);
    const t0 = Date.now();
    function tryClickInbox() {
      const inboxBtn = tabContainer.querySelector("#tabInbox");
      if (inboxBtn) {
        inboxBtn.click();
      } else if (Date.now() - t0 < 2500) {
        setTimeout(tryClickInbox, 40);
      }
    }
    tryClickInbox();
  }

  mountNotifications(
    document.getElementById('notifyBell'),
    userContext,
    (type) => {
      if (type === "friend_request") showFriendsInbox(mainContent, userContext);
    }
  );
}
