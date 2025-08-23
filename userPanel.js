export function showUserPanel(container, auth) {
  container.innerHTML = `
    <div style="position:relative;height:60px;padding:16px;">
      <button id="menuBtn" style="background:none;border:none;outline:none;font-size:2em;cursor:pointer;">
        &#9776;
      </button>
    </div>
    <div id="sideDrawer" style="
      position:fixed;
      top:0; left:0;
      height:100vh; width:260px;
      background:#f8f9fa;
      box-shadow:2px 0 10px rgba(0,0,0,0.15);
      z-index:1000;
      transform:translateX(-100%);
      transition:transform 0.28s cubic-bezier(.47,1.64,.41,.8);
      display:flex; flex-direction:column;
    ">
      <div style="padding:22px 20px 12px 24px;font-weight:bold;color:#d93025;">Gmail</div>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128193;</span> All inboxes
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128200;</span> Primary <span style="margin-left:5px;color:#004d40;">1</span>
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128173;</span> Promotions
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128101;</span> Social
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#8505;</span> Updates
      </button>
      <div style="margin:10px 0;border-bottom:1px solid #eee;"></div>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;color:#ffd700;">&#9733;</span> Starred
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128164;</span> Snoozed
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;color:#e67e22;">&#9888;</span> Important
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128233;</span> Sent
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#9200;</span> Scheduled
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128230;</span> Outbox
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128221;</span> Drafts
      </button>
      <button class="drawerItem" style="border:none;background:none;display:flex;align-items:center;padding:12px 20px;font-size:1.07em;cursor:pointer;">
        <span style="font-size:1.15em;margin-right:14px;">&#128229;</span> All mail <span style="margin-left:5px;color:#004d40;">29</span>
      </button>
    </div>
    <div id="drawerOverlay" style="
      display:none;
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:rgba(0, 0, 0, 0.09); z-index:999;" aria-hidden="true"></div>
  `;

  // Button/menu open logic
  const menuBtn = container.querySelector("#menuBtn");
  const sideDrawer = container.querySelector("#sideDrawer");
  const drawerOverlay = container.querySelector("#drawerOverlay");

  menuBtn.onclick = () => {
    sideDrawer.style.transform = "translateX(0)";
    drawerOverlay.style.display = "block";
  };
  drawerOverlay.onclick = closeDrawer;
  function closeDrawer() {
    sideDrawer.style.transform = "translateX(-100%)";
    drawerOverlay.style.display = "none";
  }

  // Optional: handle item clicks
  const drawerItems = sideDrawer.querySelectorAll(".drawerItem");
  drawerItems.forEach(item => {
    item.onclick = () => {
      alert("Clicked: " + item.textContent.trim());
      closeDrawer();
    }
  });
}
