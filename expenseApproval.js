import { showSpinner, hideSpinner, delay } from './spinner.js';

// Helper: format date as "28-Aug-25"
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = monthNames[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

/**
 * Show vertical folder list of pending approvals (remark, date, by who)
 * @param {HTMLElement} container
 * @param {object} user - { firebaseUser, name, ... }
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
    await delay(650); // consistent spinner timing
    try { approvals = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(approvals)) {
      if (approvals && approvals.error) errMsg = "Backend error: " + approvals.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  hideSpinner(container);

  if (errMsg) {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>
    `;
    return;
  }
  if (!approvals.length) {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#666;text-align:center;margin:2em 0">No approvals required!</div>`;
    return;
  }

  container.innerHTML = `
    <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:10px;">
      Pending Approvals
    </div>
    <div class="approval-folder-list"></div>
  `;
  const listArea = container.querySelector('.approval-folder-list');

  approvals.forEach(item => {
    const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
    const total = item.involvedStatus.length;
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
      display:flex;align-items:flex-start;gap:13px;
      padding:12px 10px 14px 10px;
      border-bottom:1px solid #eee;font-size:1.05em;
      cursor:pointer;
    `;
    row.innerHTML = `
      <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:7px;">${item.sn}.</span>
      <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
        <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:3px;">${item.remarks}</div>
        <div class="date" style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
        <div class="by" style="color:#209;font-size:0.97em;">by ${item.created_by}</div>
      </div>
      ${statusHtml}
    `;
    listArea.appendChild(row);
  });

  // Add CSS if not already present
  const cssId = "expense-approval-css";
  if (!document.getElementById(cssId)) {
    const style = document.createElement("style");
    style.id = cssId;
    style.textContent = `
      .status-pill {
        min-width: 92px;
        margin-left: 9px;
        border-radius: 13px;
        padding: 2.5px 11px;
        font-weight: 600;
        text-align: center;
        background: #ecf4ff;
        color: #157;
        height: fit-content;
        flex-shrink: 0;
      }
      .status-pill.disputed { background: #fedee0; color: #d22; }
    `;
    document.head.appendChild(style);
  }
}
