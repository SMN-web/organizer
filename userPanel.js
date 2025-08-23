export async function showUserPanel(container, auth) {
  container.innerHTML = `
    <div style="padding:0; margin:0; position:relative;">
      <button id="menuBtn"
        style="position:absolute;top:0;left:0;background:none;border:none;padding:14px 20px 14px 22px;font-size:2em;cursor:pointer;z-index:101">
        &#9776;
      </button>
      <div id="simpleMenu" style="display:block;">
        <div id="userHeader" style="display:flex;align-items:center;padding:18px 18px 16px 18px;">
          <span id="avatarCircle"
            style="background:#e1e6ef;color:#355;font-weight:700;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;font-size:1.2em;margin-right:13px;">
            <!-- initials here -->
          </span>
          <span id="menuName" style="font-size:1.12em;font-weight:600;"></span>
        </div>
        <div style="border-bottom:1px solid #ececec;"></div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="line1">Line 1</div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;" id="line2">Line 2</div>
        <div style="padding:16px 18px;cursor:pointer;" id="line3">Line 3</div>
      </div>
      <div id="messageBox" style="margin-top:80px;color:#27ae60;font-size:1.04em;"></div>
    </div>
  `;
  const menuBtn = container.querySelector("#menuBtn");
  const simpleMenu = container.querySelector("#simpleMenu");
  const messageBox = container.querySelector("#messageBox");
  const avatarCircle = container.querySelector("#avatarCircle");
  const menuName = container.querySelector("#menuName");

  // --- Responsive animated popup ---
  simpleMenu.style.opacity = '0';
  simpleMenu.style.transform = 'translateX(-50%) scale(0.98)';
  simpleMenu.style.position = 'fixed';
  simpleMenu.style.left = '50%';
  simpleMenu.style.top = '70px';
  simpleMenu.style.width = '90vw';
  simpleMenu.style.maxWidth = '340px';
  simpleMenu.style.background = '#fff';
  simpleMenu.style.borderRadius = '12px';
  simpleMenu.style.boxShadow = '0 4px 24px #0002';
  simpleMenu.style.border = '1px solid #eee';
  simpleMenu.style.zIndex = '100';
  simpleMenu.style.pointerEvents = 'none';
  simpleMenu.style.transition = 'opacity 0.22s cubic-bezier(.45,1.6,.41,1), transform 0.17s cubic-bezier(.45,1.6,.41,1)';

  menuBtn.onclick = (e) => {
    e.stopPropagation();
    simpleMenu.style.opacity = '1';
    simpleMenu.style.transform = 'translateX(-50%) scale(1)';
    simpleMenu.style.pointerEvents = 'auto';

    // Fetch and display user profile from backend worker
    fetchUserPanelProfile(auth, avatarCircle, menuName, container, simpleMenu);
  };

  document.addEventListener("click", function handler(e) {
    if (!menuBtn.contains(e.target) && !simpleMenu.contains(e.target)) {
      simpleMenu.style.opacity = '0';
      simpleMenu.style.transform = 'translateX(-50%) scale(0.98)';
      simpleMenu.style.pointerEvents = 'none';
    }
  });

  // Menu line click events
  container.querySelector("#line1").onclick = () => {
    messageBox.textContent = "You clicked Line 1";
    closeMenu();
  };
  container.querySelector("#line2").onclick = () => {
    messageBox.textContent = "You clicked Line 2";
    closeMenu();
  };
  container.querySelector("#line3").onclick = () => {
    messageBox.textContent = "You clicked Line 3";
    closeMenu();
  };

  function closeMenu() {
    simpleMenu.style.opacity = '0';
    simpleMenu.style.transform = 'translateX(-50%) scale(0.98)';
    simpleMenu.style.pointerEvents = 'none';
  }
}

// Helper: fetch user data from backend worker and show or block panel
async function fetchUserPanelProfile(auth, avatarCircle, menuName, container, simpleMenu) {
  try {
    if (!auth.currentUser) throw new Error("No logged in user");
    await auth.currentUser.reload();
    const token = await auth.currentUser.getIdToken(true);

    // Change this URL to your worker endpoint (method: GET)
    const resp = await fetch("https://us-api.nafil-8895-s.workers.dev/api/userpanel", {
      headers: { Authorization: "Bearer " + token },
      mode: "cors",
    });
    const data = await resp.json();
    if (resp.status === 200 && data.name) {
      // Show initials + name
      menuName.textContent = data.name;
      const initials = (data.name.match(/[A-Z]/gi) || []).join('').toUpperCase().slice(0,2);
      avatarCircle.textContent = initials || "??";
    } else if (resp.status === 403 && data.showLogout) {
      // Block panel, show only unauthorized message + LOGOUT
      container.innerHTML = `
        <div style="padding:2.3em 1em;text-align:center;">
          <b style="color:#c00;font-size:1.15em;">Access Denied</b><br>
          <div style="margin:1.3em 0 2em;">${data.error || "Unauthorized access."}</div>
          <button id="logoutBtn"
            style="background:#c00;color:#fff;padding:0.7em 2em;border:none;border-radius:6px;cursor:pointer;font-size:1em;">
            Logout
          </button>
        </div>
      `;
      // Wire up logout
      container.querySelector("#logoutBtn").onclick = async ()=>{
        await auth.signOut();
        location.reload();
      };
      // Close menu if open
      simpleMenu.style.opacity = '0';
      simpleMenu.style.transform = 'translateX(-50%) scale(0.98)';
      simpleMenu.style.pointerEvents = 'none';
    } else {
      // Show default fallback
      menuName.textContent = "Unknown";
      avatarCircle.textContent = "??";
    }
  } catch (e) {
    menuName.textContent = "Unknown";
    avatarCircle.textContent = "??";
  }
}
