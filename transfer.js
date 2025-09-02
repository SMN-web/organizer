// transfer.js
export async function showTransferPopup(toUser, toName, owed, currency) {
  // Simple version for demo/testing:
  const msg = prompt(`Enter message for custom transfer to ${toName}\nAmount: ${owed} ${currency}`);
  if (!msg) return;
  // You could add API call here or show a custom modal, etc.
  alert(`Simulate sending: "${msg}" to ${toUser}`);
}
