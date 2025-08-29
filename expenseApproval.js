// Helper for formatting date like '24-Aug-25'
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export async function showExpenseApproval(container, user, notifyUnread) {
  // Demo data; replace with API fetch in real usage
  const items = [
    {
      id: 1,
      date: '2025-08-24',
      remarks: 'Trip snacks',
      summary: 'Total: 56 QAR. Bala paid 56. Sree owes 28 QAR to Bala.',
      details: `<b>Paid:</b> Bala 56 QAR<br><b>Share:</b> Bala 28, Sree 28<br><b>Owes:</b> Sree → Bala 28`
    },
    {
      id: 2,
      date: '2025-07-12',
      remarks: 'Dinner bill',
      summary: 'Total: 120 QAR. Bala paid 70, Raf 50. Equal split.',
      details: `<b>Paid:</b> Bala 70, Raf 50<br><b>Share:</b> Bala 60, Raf 60<br><b>Owes:</b> Bala → Raf 10`
    },
    {
      id: 3,
      date: '2025-06-04',
      remarks: 'Cab sharing',
      summary: 'Total: 80 QAR, Sree paid all. Equal split among 4.',
      details: `<b>Paid:</b> Sree 80<br><b>Share:</b> Everyone 20<br><b>Owes:</b> Bala/Shyam/Raf → Sree 20 each`
    }
  ];

  container.innerHTML = `
    <div class="approval-header">
      <h2>Expense Approvals</h2>
      <p>Review group expenses awaiting your decision. Click a card for details and actions.</p>
      <div class="approval-list"></div>
    </div>
  `;

  notifyUnread(items.length);

  const wrapper = container.querySelector('.approval-list');
  wrapper.innerHTML = items.map(item => `
    <div class="approval-card" tabindex="0">
      <div class="approval-summary">
        <span class="approval-date">${formatDisplayDate(item.date)}</span>
        <span class="approval-remarks">${item.remarks}</span>
      </div>
      <div class="approval-detail" style="display:none;">
        <div style="margin:5px 0 12px 0;">${item.summary}</div>
        <div style="margin-bottom:9px;color:#137">${item.details}</div>
        <button class="primary-btn action-accept-btn" style="margin-right:12px;">Accept</button>
        <button class="primary-btn action-dispute-btn" style="background:#e53935;color:#fff;">Dispute</button>
        <div class="dispute-area" style="display:none;margin-top:8px;">
          <textarea class="dispute-remarks" rows="2" style="width:99%;padding:6px;border-radius:8px;border:1px solid #ddd;" placeholder="Describe your concern..."></textarea>
          <button class="primary-btn action-send-dispute-btn" style="margin-top:6px;">Send Dispute</button>
        </div>
        <div class="approval-status-msg" style="margin-top:8px;color:#25853f;font-size:1em;"></div>
      </div>
    </div>
  `).join('');

  // Accordion-style expand/collapse
  wrapper.querySelectorAll('.approval-card').forEach((card, idx) => {
    card.querySelector('.approval-summary').onclick = e => {
      // Collapse all others
      wrapper.querySelectorAll('.approval-detail').forEach(det => det.style.display = 'none');
      // Expand this one
      card.querySelector('.approval-detail').style.display = '';
      e.stopPropagation();
    };
  });

  // Inside each card, wire approval/dispute logic
  wrapper.querySelectorAll('.approval-card').forEach((card, idx) => {
    const acceptBtn = card.querySelector('.action-accept-btn');
    const disputeBtn = card.querySelector('.action-dispute-btn');
    const disputeArea = card.querySelector('.dispute-area');
    const sendDisputeBtn = card.querySelector('.action-send-dispute-btn');
    const remarksInput = card.querySelector('.dispute-remarks');
    const statusMsg = card.querySelector('.approval-status-msg');

    acceptBtn.onclick = e => {
      statusMsg.textContent = "Accepted! Waiting for others.";
      acceptBtn.style.display = "none";
      disputeBtn.style.display = "none";
      e.stopPropagation();
    };
    disputeBtn.onclick = e => {
      disputeArea.style.display = '';
      acceptBtn.style.display = "none";
      disputeBtn.style.display = "none";
      e.stopPropagation();
    };
    sendDisputeBtn.onclick = e => {
      const remark = remarksInput.value.trim();
      if (!remark) {
        remarksInput.style.borderColor = "#e53935";
        return;
      }
      remarksInput.style.borderColor = "#ddd";
      statusMsg.textContent = "Dispute sent. Expense will be reviewed!";
      disputeArea.style.display = "none";
      e.stopPropagation();
    };
  });
}
