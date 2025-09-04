export function showCompletedTransfersPanel(container, user) {
  container.innerHTML = `
    <div>
      <b>Completed Transfers</b>
      <div>No transfers have been completed yet.</div>
    </div>
  `;
}
