export function showUserPanel(container, auth) {
  container.innerHTML = `
    <button id="menuBtn"
      style="position:fixed;top:24px;left:24px;border:none;background:#fff;padding:12px;border-radius:12px;box-shadow:0 2px 8px #ececec;z-index:10001;">
      <span style="display:inline-block;font-size:1.55em;">
        &#9776;
      </span>
    </button>
    <div id="drawerOverlay"
      style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.13);z-index:9999;">
    </div>
    <nav id="sideDrawer"
      style="position:fixed; top:0; left:0; height:100vh; width:75vw; max-width:400px;
      background:#f8f9fa; box-shadow:2px 0 10px rgba(0,0,0,0.15); z-index:10000;
      transform:translateX(-100%);
      transition:transform 0.28s cubic-bezier(.77,.2,.56,1.35);
      display:flex; flex-direction:column;">
      <div style="padding:24px 28px 13px 22px; font-weight:500; font-size:1.25em; color:#444;">
        User Menu
      </div>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:14px 22px;font-size:1.09em;cursor:pointer;">
        <span style="font-size:1.2em;margin-right:14px;">&#128100;</span> Profile
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:14px 22px;font-size:1.09em;cursor:pointer;">
        <span style="font-size:1.2em;margin-right:14px;">&#128193;</span> Files
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:14px 22px;font-size:1.09em;cursor:pointer;">
        <span style="font-size:1.2em;margin-right:14px;">&#9881;</span> Settings
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:14px 22px;font-size:1.09em;cursor:pointer;">
        <span style="font-size:1.2em;margin-right:14px;">&#128682;</span> Logout
      </button>
    </nav>
  `;

  // The menu button should always be visible/fixed regardless of scrolling/layout!
  const menuBtn = container.querySelector("#menuBtn");
  const sideDrawer = container.querySelector("#sideDrawer");
  const drawerOverlay = container.querySelector("#drawerOverlay");

  function openDrawer() {
    sideDrawer.style.transform = "translateX(0)";
    drawerOverlay.style.display = "block";
  }
  function closeDrawer() {
    sideDrawer.style.transform = "translateX(-100%)";
    drawerOverlay.style.display = "none";
  }

  menuBtn.onclick = openDrawer;
  drawerOverlay.onclick = closeDrawer;

  // Example item logic
  const drawerItems = sideDrawer.querySelectorAll(".drawerItem");
  drawerItems[0].onclick = () => { alert("Profile clicked!"); closeDrawer(); };
  drawerItems[1].onclick = () => { alert("Files clicked!"); closeDrawer(); };
  drawerItems.onclick = () => { alert("Settings clicked!"); closeDrawer(); };
  drawerItems.onclick = async () => {
    await auth.signOut();
    window.location.hash = "#login";
    closeDrawer();
  };
}
