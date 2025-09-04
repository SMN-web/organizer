export async function showHistoryPanel(container, user) {
  container.innerHTML = `<div>Loading transaction history...</div>`;
  // Fetch full ledger/history using user.firebaseUser.getIdToken()
  // Render all finalized payment and transfer bubbles with expanded details, status dates, etc.
}
