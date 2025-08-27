export function showHistorySpend(container) {
  let all = JSON.parse(localStorage.getItem('spendHistory') || "[]").reverse();
  container.innerHTML = `<div class="history-list"></div>`;
  const hist = container.querySelector('.history-list');
  if (!all.length) {
    hist.innerHTML = `<div>No spends recorded yet.</div>`;
    return;
  }
  // Render as previous answer (color-coded rows)
  all.forEach(entry => {
    entry.friends.forEach((id) => {
      if (id === entry.paidBy) return;
      let owes = entry.shares[id];
      let meOwes = entry.paidBy === 'me' && id !== 'me';
      let friendOwes = entry.paidBy !== 'me' && id === 'me';
      let rowClass = meOwes ? "hist-owe" : friendOwes ? "hist-get" : "hist-neutral";
      let who = id; // Replace with name logic if desired
      let msg = meOwes
        ? `${who} owes you ${owes} QAR`
        : friendOwes
        ? `You owe ${entry.paidBy} ${owes} QAR`
        : `${who} owes ${entry.paidBy} ${owes} QAR`;
      hist.innerHTML += `<div class="hist-row ${rowClass}">${msg}</div>`;
    });
  });
}
