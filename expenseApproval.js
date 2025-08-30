import { showSpinner, hideSpinner, delay } from './spinner.js';

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
function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return "";
  const d = new Date(dateTimeStr);
  return `${formatDisplayDate(dateTimeStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:#ffeb3b;padding:1px 2px;border-radius:2px;">$1</mark>');
}

let approvalsData = [];
let currentSearch = '';
let currentDateFilter = '';

export async function showExpenseApproval(container, user) {
  container.innerHTML = '';
  showSpinner(container);

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
    await delay(650);
    try { approvalsData = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(approvalsData)) {
      if (approvalsData && approvalsData.error) errMsg = "Backend error: " + approvalsData.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  hideSpinner(container);

  if (errMsg) {
    container.innerHTML = `<div style="font-weight:600;font-size:1.13em;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>`;
    return;
  }
  renderApprovalsArea(container, user);
}

function renderApprovalsArea(container, user) {
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.13em;margin-bottom:10px;">Pending Approvals</div>
    <div style="display:flex;gap:13px;margin-bottom:18px;align-items:center;">
      <input type="text" id="searchInput" placeholder="Search in remarks, names..." style="
        flex:1;padding:10px 15px;border:1px solid #ddd;border-radius:8px;
        font-size:1em;outline:none;transition:border-color 0.2s;">
      <input type="date" id="dateFilter" style="
        padding:10px 15px;border:1px solid #ddd;border-radius:8px;
        font-size:1em;outline:none;min-width:140px;">
    </div>
    <div class="approval-folder-list"></div>
  `;
  const listArea = container.querySelector('.approval-folder-list');
  const searchInput = container.querySelector('#searchInput');
  const dateFilter = container.querySelector('#dateFilter');
  searchInput.value = currentSearch;
  dateFilter.value = currentDateFilter;

  function renderList() {
    let filtered = approvalsData;
    const s = searchInput.value.trim().toLowerCase();
    const d = dateFilter.value;
    if (d) filtered = filtered.filter(item => item.date === d);
    if (s) filtered = filtered.filter(item =>
      item.remarks.toLowerCase().includes(s) ||
      item.created_by.toLowerCase().includes(s)
    );
    listArea.innerHTML = '';
    if (!filtered.length) {
      listArea.innerHTML = `<div style="color:#666;text-align:center;margin:3em 0;font-size:1.1em;">No matching results found</div>`;
      return;
    }
    filtered.forEach(item => {
      const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
      const total = item.involvedStatus.length;
      const statusHtml = item.status === 'disputed'
        ? `<span class="status-pill disputed">Disputed</span>`
        : `<span class="status-pill pending">Accepted ${accepted}/${total}</span>`;
      const row = document.createElement("div");
      row.className = "approval-folder";
      row.tabIndex = 0;
      row.style = `display:flex;align-items:flex-start;gap:13px;
        padding:12px 10px 14px 10px;
        border-bottom:1px solid #eee;font-size:1.05em;cursor:pointer;transition:background 0.2s;`;
      row.innerHTML = `
        <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:7px;">${item.sn}.</span>
        <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
          <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:3px;">${highlightText(item.remarks, s)}</div>
          <div class="date" style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
          <div class="by" style="color:#209;font-size:0.97em;">by ${highlightText(item.created_by, s)}</div>
        </div>
        ${statusHtml}
      `;
      row.onclick = () => renderApprovalDetails(container, user, item);
      row.onmouseover = () => row.style.backgroundColor = '#f8f9fa';
      row.onmouseout = () => row.style.backgroundColor = '';
      listArea.appendChild(row);
    });
  }
  searchInput.oninput = () => { currentSearch = searchInput.value; renderList(); };
  dateFilter.onchange = () => { currentDateFilter = dateFilter.value; renderList(); };
  renderList();
  addStatusCSS();
}

function renderApprovalDetails(container, user, item) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <button id="backBtn" style="background:none;border:1px solid #ddd;border-radius:8px;padding:8px 16px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:1em;">← Back</button>
      <h3 style="margin:0;font-weight:600;font-size:1.2em;color:#1b2837;">Approval Details</h3>
      <div></div>
    </div>
    <div id="detailArea"></div>
  `;
  container.querySelector('#backBtn').onclick = () => renderApprovalsArea(container, user);

  const detailArea = container.querySelector('#detailArea');
  let currentUser = user?.name || user?.firebaseUser?.displayName || user?.firebaseUser?.email;
  let myStatusRow = item.involvedStatus.find(p =>
    (p.name === currentUser) || (user?.firebaseUser?.email && p.name && p.name.toLowerCase() === user.firebaseUser.email.toLowerCase())
  );
  let userStatus = myStatusRow ? myStatusRow.status : null;
  const isDisputed = !!item.disputed_by;
  const youDisputed = isDisputed && item.disputed_by === currentUser;

  let msg = "";
  if (isDisputed && youDisputed) msg = `<div style="color:#d12020;font-weight:600;font-size:1em;">You have disputed this expense at ${formatDateTime(item.disputed_at) || '–'}.</div>`;
  else if (isDisputed) msg = `<div style="color:#d12020;font-weight:600;font-size:1em;">${item.disputed_by} has disputed this expense at ${formatDateTime(item.disputed_at) || '–'}.</div>`;

  detailArea.innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="font-weight:600;font-size:1.09em;color:#1b2837;">${item.remarks}</div>
      <div style="color:#566b89;font-size:1em;margin-bottom:3px;">${formatDisplayDate(item.date)}</div>
      <div style="color:#209;font-size:0.96em;margin-bottom:5px;">by ${item.created_by}</div>
      <div style="font-size:1em;color:#222;">Total: <span style="font-weight:600;">${item.total_amount}</span></div>
      <div style="color:#888;font-size:0.98em;">Status last updated: <b>${formatDateTime(item.status_at)}</b></div>
    </div>
    <div>
      <div style="font-weight:600;margin-bottom:7px;">Paid/Shares</div>
      <ul style="padding-left:18px;">
        ${item.splits.map(s => `<li>${s.name}: paid <b>${s.paid}</b>, share <b>${s.share}</b></li>`).join('')}
      </ul>
      <div style="font-weight:600;margin-bottom:6px;margin-top:12px;">Settlements</div>
      <ul style="padding-left:18px;">
        ${item.settlements.length
          ? item.settlements.map(st => `<li>${st.from} owes ${st.to}: <b>${st.amount}</b> (${st.payer_status})</li>`).join('')
          : '<li>No settlements needed</li>'}
      </ul>
    </div>
    <div style="border-top:1px solid #e8eaed;margin-top:12px;padding-top:13px;">
      <div style="font-size:0.96em;color:#556;margin-bottom:8px;">Participants approvals:</div>
      <div style="display:flex;flex-wrap:wrap;gap:9px;margin-bottom:2px;">
        ${item.involvedStatus.map(person => `
          <span style="display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:16px;font-size:0.93em;
            ${person.status === 'accepted' ? 'background:#e8f5e8;color:#2d7d2d;' :
            person.status === 'disputed' ? 'background:#ffeaea;color:#d73027;' :
            'background:#fff3cd;color:#856404;'}">
            <span style="width:8px;height:8px;border-radius:50%;
              ${person.status === 'accepted' ? 'background:#4caf50;' :
                person.status === 'disputed' ? 'background:#f44336;' :
                'background:#ff9800;'}"></span>
            ${person.name}
          </span>
        `).join('')}
      </div>
      <div id="actionArea">${msg}</div>
    </div>
  `;

  const actionArea = detailArea.querySelector('#actionArea');
  if (!isDisputed && userStatus === 'pending') {
    actionArea.innerHTML += `
      <button id="acceptBtn" style="margin-right:15px;background:#e7f6ea;color:#13a568;padding:9px 21px;border:1px solid #13a568;border-radius:8px;cursor:pointer;font-weight:600;">Accept</button>
      <button id="disputeBtn" style="background:#ffecec;color:#d73323;padding:9px 21px;border:1px solid #d73323;border-radius:8px;cursor:pointer;font-weight:600;">Dispute</button>
      <div id="disputeEntry" style="display:none;margin-top:10px;">
        <button id="submitDispute" style="margin-top:7px;">Confirm Dispute</button>
      </div>
    `;
    actionArea.querySelector('#acceptBtn').onclick = () => handleApprovalAction(container, user, item, "accept");
    actionArea.querySelector('#disputeBtn').onclick = () => {
      actionArea.querySelector('#disputeEntry').style.display = '';
    };
    actionArea.querySelector('#submitDispute').onclick = () => {
      handleApprovalAction(container, user, item, "dispute");
    };
  }
  addStatusCSS();
}

async function handleApprovalAction(container, user, item, action) {
  showSpinner(container);
  try {
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch("https://ex-ap.nafil-8895-s.workers.dev/api/approval-action", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ spend_id: item.spend_id, action })
    });
    const result = await resp.json();
    await delay(500);
    if (!result.ok) throw new Error(result.error || "Unknown error");
    await showExpenseApproval(container, user);
  } catch (e) {
    alert(e.message);
    await showExpenseApproval(container, user);
  }
  hideSpinner(container);
}

function addStatusCSS() {
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
      mark { background: #ffeb3b !important; padding: 1px 2px !important; border-radius: 2px !important; }
    `;
    document.head.appendChild(style);
  }
}
