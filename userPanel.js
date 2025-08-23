export function showUserPanel(container) {
  container.innerHTML = `
    <div style="padding:46px 0 0 0; text-align:left; position:relative;">
      <button id="menuBtn"
        style="background:none;border:none;padding:12px 20px;font-size:2em;cursor:pointer;">
        &#9776;
      </button>
      <div id="simpleMenu"
        style="display:none;position:fixed;left:50%;top:90px;transform:translateX(-50%);
          width:90vw;max-width:340px;background:#fff;
          border-radius:12px;box-shadow:0 4px 24px #0002;border:1px solid #eee;z-index:100;">
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;">Line 1</div>
        <div style="padding:16px 18px;border-bottom:1px solid #ececec;cursor:pointer;">Line 2</div>
        <div style="padding:16px 18px;cursor:pointer;">Line 3</div>
      </div>
      <div id="messageBox" style="margin-top:40px;color:#27ae60;font-size:1.04em;"></div>
    </div>
  `;
  const menuBtn = container.querySelector("#menuBtn");
  const simpleMenu = container.querySelector("#simpleMenu");
  const messageBox = container.querySelector("#messageBox");

  menuBtn.onclick = (e) => {
    e.stopPropagation();
    simpleMenu.style.display = (simpleMenu.style.display === "block") ? "none" : "block";
  };

  const items = simpleMenu.querySelectorAll("div");
  items[0].onclick = (e) => {
    messageBox.textContent = "You clicked Line 1";
    simpleMenu.style.display = "none";
  };
  items[1].onclick = (e) => {
    messageBox.textContent = "You clicked Line 2";
    simpleMenu.style.display = "none";
  };
  items.onclick = (e) => {
    messageBox.textContent = "You clicked Line 3";
    simpleMenu.style.display = "none";
  };

  document.addEventListener("click", function handler(e) {
    if (!menuBtn.contains(e.target) && !simpleMenu.contains(e.target)) {
      simpleMenu.style.display = "none";
    }
  });
}
