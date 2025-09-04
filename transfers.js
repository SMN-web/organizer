export function showTransfersPanel(container, user) {
  container.innerHTML = `
    <div>
      <h3 style="margin-bottom:0.8em;">Transfers</h3>
      <div style="display:flex;gap:9px;margin-bottom:1.2em;">
        <button id="subOngoing" class="ttab" style="background:#44b;border-radius:5px;border:none;color:#fff;padding:0.5em 1.2em;">Ongoing</button>
        <button id="subCompleted" class="ttab" style="background:#eee;border-radius:5px;border:none;color:#555;padding:0.5em 1.2em;">Completed</button>
      </div>
      <div id="transferSection"></div>
    </div>
  `;
  const transferSection = container.querySelector("#transferSection");
  async function showOngoing() {
    transferSection.innerHTML = `<div>Loading ongoing transfers…</div>`;
    // API fetch with user.firebaseUser.getIdToken(), fill UI here
  }
  async function showCompleted() {
    transferSection.innerHTML = `<div>Loading completed transfers…</div>`;
    // API fetch and render
  }
  container.querySelector("#subOngoing").onclick = () => showOngoing();
  container.querySelector("#subCompleted").onclick = () => showCompleted();
  showOngoing(); // Default tab
}
