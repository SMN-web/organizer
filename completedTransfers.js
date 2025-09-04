export function showCompletedTransfersPanel(container, user) {
  container.innerHTML = `
    <div style="padding:2em;text-align:center;">
      <b>Completed Transfers</b><br>
      <span style="color:#888;">No transfers have been completed yet.</span>
      <!-- Add your dynamic completed transfer list/UI here -->
    </div>
  `;
}
