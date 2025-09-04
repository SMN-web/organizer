export function showOngoingTransfersPanel(container, user) {
  container.innerHTML = `
    <div style="padding:2em;text-align:center;">
      <b>Ongoing Transfers</b><br>
      <span style="color:#888;">There are no ongoing transfers at the moment.</span>
      <!-- Add your dynamic ongoing transfer list/UI here -->
    </div>
  `;
}
