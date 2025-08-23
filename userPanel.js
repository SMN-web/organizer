export function showUserPanel(container) {
  container.innerHTML = `
    <div style="padding:46px 0 0 0; text-align:left;">
      <button id="menuBtn"
        style="background:none;border:none;padding:12px 20px;font-size:2em;cursor:pointer;">
        &#9776;
      </button>
      <div id="simpleMenu"
        style="display:block;"> <!-- always present, CSS handles visibility! -->
        <div>Line 1</div>
        <div>Line 2</div>
        <div>Line 3</div>
      </div>
      <div id="messageBox" style="margin-top:40px;color:#27ae60;font-size:1.04em;"></div>
    </div>
  `;
  const menuBtn = container.querySelector("#menuBtn");
  const simpleMenu = container.querySelector("#simpleMenu");
  const messageBox = container.querySelector("#messageBox");

  // Toggle class for fade in/fade out
  menuBtn.onclick = (e) => {
    e.stopPropagation();
    simpleMenu.classList.toggle("menu-open");
  };

  // Show messages when menu lines are clicked
  const items = simpleMenu.querySelectorAll("div");
  items[0].onclick = (e) => {
    messageBox.textContent = "You clicked Line 1";
    simpleMenu.classList.remove("menu-open");
  };
  items[1].onclick = (e) => {
    messageBox.textContent = "You clicked Line 2";
    simpleMenu.classList.remove("menu-open");
  };
  items.onclick = (e) => {
    messageBox.textContent = "You clicked Line 3";
    simpleMenu.classList.remove("menu-open");
  };

  // Clicking elsewhere closes the menu
  document.addEventListener("click", function handler(e) {
    if (!menuBtn.contains(e.target) && !simpleMenu.contains(e.target)) {
      simpleMenu.classList.remove("menu-open");
    }
  });
}
