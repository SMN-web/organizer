// expenseApproval.js
export async function showExpenseApproval(container, user, notifyUnread) {
  container.innerHTML = `
    <div class="approval-header">
      <h2>Expense Approvals</h2>
      <p>Review group expenses awaiting your decision. Accept if all looks good, or dispute with your concerns.</p>
      <div class="approval-list" style="margin-top:20px;"></div>
    </div>
  `;
  // Simulate API fetch with static sample data (replace with your API logic)
  // The API should provide user's pending approvals: [{id, title, created_at, summary, ...}]
  // Example:
  const items = await fetchUserPendingApprovals(user); // Replace with your actual API call

  const wrapper = container.querySelector('.approval-list');
  if (!items.length) {
    wrapper.innerHTML = `<div style="color:#888;text-align:center;margin:2em 0">No expenses awaiting your approval!</div>`;
    notifyUnread(0);
    return;
  }
  notifyUnread(items.length);
  wrapper.innerHTML = items.map(item => `
    <div class="approval-item" style="margin-bottom:24px;padding:15px 17px;border:1px solid #e8e8f6;border-radius:11px;background:#fcfcfe;box-shadow:0 2px 9px -6px #bbb;">
      <div style="font-weight:600;font-size:1.03em;">${item.title}</div>
      <div style="color:#789;margin:5px 0 6px 0;font-size:.99em;">${item.created_at}</div>
      <div style="margin-bottom:7px">${item.summary}</div>
      <button class="primary-btn action-accept-btn" style="margin-right:12px;">Accept</button>
      <button class="primary-btn action-dispute-btn" style="background:#e53935;color:#fff;">Dispute</button>
      <div class="dispute-area" style="display:none;margin-top:8px;">
        <textarea class="dispute-remarks" rows="2" style="width:99%;padding:6px;border-radius:8px;border:1px solid #ddd;" placeholder="Describe your concern..."></textarea>
        <button class="primary-btn action-send-dispute-btn" style="margin-top:6px;">Send Dispute</button>
      </div>
      <div class="approval-status-msg" style="margin-top:8px;color:#25853f;font-size:1em;"></div>
    </div>
  `).join('');

  // Wire actions
  Array.from(wrapper.querySelectorAll('.approval-item')).forEach((itemDiv, idx) => {
    const acceptBtn = itemDiv.querySelector('.action-accept-btn');
    const disputeBtn = itemDiv.querySelector('.action-dispute-btn');
    const disputeArea = itemDiv.querySelector('.dispute-area');
    const sendDisputeBtn = itemDiv.querySelector('.action-send-dispute-btn');
    const remarksInput = itemDiv.querySelector('.dispute-remarks');
    const statusMsg = itemDiv.querySelector('.approval-status-msg');

    acceptBtn.onclick = () => {
      // Call your API to accept, then update UI/message
      statusMsg.textContent = "Accepted! Waiting for others.";
      acceptBtn.style.display = "none";
      disputeBtn.style.display = "none";
      // (Optionally reload list, update server etc.)
    };
    disputeBtn.onclick = () => {
      disputeArea.style.display = '';
      acceptBtn.style.display = "none";
      disputeBtn.style.display = "none";
    };
    sendDisputeBtn.onclick = () => {
      const remark = remarksInput.value.trim();
      if (!remark) {
        remarksInput.style.borderColor = "#e53935";
        return;
      }
      remarksInput.style.borderColor = "#ddd";
      statusMsg.textContent = "Dispute sent. Expense will be reviewed!";
      disputeArea.style.display = "none";
    };
  });
  
  // Example stub for API: replace with your real backend logic
  async function fetchUserPendingApprovals(user) {
    // Replace this with real API call; example static data for now:
    return [
      { id: 1, title: "Trip Snacks", created_at: "2025-08-29", summary: "Total: 56 QAR. Bala paid 56. Sree owes 28 QAR..." },
      // Add more items...
    ];
  }
}
