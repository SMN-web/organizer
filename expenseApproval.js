import { showSpinner, hideSpinner, delay } from './spinner.js';

// Utility to format "2025-08-28" -> "28-Aug-25"
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

/**
 * Displays the list of expense approvals for the current user in the provided container.
 * Spinner is shown/hid using your code. Folders are rendered according to your plan.
 * @param {HTMLElement} container
 * @param {object} user - { firebaseUser, name, email, ...}
 */
export async function showExpenseApproval(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let approvals = [];
  let errMsg = '';

  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      hideSpinner(container);
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view approvals.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://ex-ap.nafil-8895-s.workers.dev/api/my-approvals', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await resp.text();
    await delay(650); // slow down spinner for UX consistency
    try { approvals = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(approvals)) {
      if (approvals && approvals.error) errMsg = "Backend error: " + approvals.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  hideSpinner(container);

  if (errMsg) {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;letter-spacing:.03em;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>
    `;
    return;
  }
  if (!approvals.length) {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;letter-spacing:.03em;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#666;text-align:center;margin:2em 0">No approvals required!</div>`;
    return;
  }

  // Render summary folders
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.13em;line-height:1.6;letter-spacing:.03em;margin-bottom:10px;">
      Pending Approvals
    </div>
    <div class="approval-folder-list"></div>
  `;
  const listArea = container.querySelector('.approval-folder-list');

  approvals.forEach(item => {
    // Count accepted, total
    const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
    const total = item.involvedStatus.length;
    // Status badge logic
    let statusHtml = '';
    if (item.status === 'disputed') {
      statusHtml = `<span class="status-pill disputed">Disputed</span>`;
    } else {
      statusHtml = `<span class="status-pill pending">Accepted ${accepted}/${total}</span>`;
    }
    const row = document.createElement("div");
    row.className = "approval-folder";
    row.tabIndex = 0;
    row.style = `
      display:flex;align-items:center;padding:13px 12px;border-bottom:1px solid #eee;
      font-size:1.05em;cursor:pointer;gap:13px;word-break:break-all;
    `;
    row.innerHTML = `
      <span style="min-width:2em;font-weight:600;color:#357;">${item.sn}.</span>
      <span style="color:#346;margin-right:7px;">by ${item.created_by}</span>
      <span style="min-width:80px;color:#256;margin-right:7px;">${formatDisplayDate(item.date)}</span>
      <span style="flex:1;color:#222;">${item.remarks}</span>
      ${statusHtml}
    `;
    // Click handler will be implemented in the next phase for expansion
    listArea.appendChild(row);
  });

  // -- Minimal status badge CSS --
  const cssId = "expense-approval-css";
  if (!document.getElementById(cssId)) {
    const style = document.createElement("style");
    style.id = cssId;
    style.textContent = `
      .status-pill { min-width: 92px; margin-left:7px; border-radius:13px; padding:1.5px 9px;font-weight:600;text-align:center;background:#f1f1f7; }
      .status-pill.pending { background:#ecf4ff; color:#157; }
      .status-pill.disputed { background:#fedee0; color:#d22; }
    `;
    document.head.appendChild(style);
  }
}
