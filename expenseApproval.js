const CURRENCY = "QAR";

import { showSpinner, hideSpinner, delay } from './spinner.js';

function parseDBDatetimeAsUTC(dt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return new Date(dt);
  return new Date(Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]));
}
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const then = parseDBDatetimeAsUTC(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - then) / 1000);
  if (isNaN(seconds)) return "";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

let approvalsData = [];
let currentSearch = '';
let currentDateFilter = '';

export async function showExpenseApproval(container, user) {
  container.innerHTML = '<div style="padding:2em 0;text-align:center;">Loading...</div>';

  let errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view approvals.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://ex-ap.nafil-8895-s.workers.dev/api/my-approvals', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await resp.text();
    try { approvalsData = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(approvalsData)) {
      if (approvalsData && approvalsData.error) errMsg = "Backend error: " + approvalsData.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  if (errMsg) {
    container.innerHTML = `<div style="font-weight:600;font-size:1.13em;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
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
      (item.remarks||"").toLowerCase().includes(s) ||
      (item.created_by||"").toLowerCase().includes(s)
    );
    listArea.innerHTML = '';
    if (!filtered.length) {
      listArea.innerHTML = `<div style="color:#666;text-align:center;margin:3em 0;font-size:1.1em;">
        No pending approvals found.
      </div>`;
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
          <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:3px;">${escapeHtml(item.remarks||"")}</div>
          <div class="date" style="color:#566b89;font-size:0.97em;">${escapeHtml(item.date||"")}</div>
          <div class="by" style="color:#209;font-size:0.97em;">by ${escapeHtml(item.created_by||"")}</div>
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

// =============== Branch View ===============
function approvalBranchHTML(creator, rows, currentUser) {
  const rowHeight = 38;
  const branchHeight = rows.length * rowHeight - 8;
  const statusColor = s => s === "accepted" ? "#187f2c" : (s === "disputed" ? "#cc2020" : "#b08c00");
  const nameColor = s => s === "accepted" ? "#187f2c" : (s === "disputed" ? "#cc2020" : "#a89a00");
  return `
  <div>
    <div style="font-weight:800;color:#222;font-size:1.09em;letter-spacing:0.4px;margin-bottom:2px;margin-left:0;">
      ${escapeHtml(creator)}
    </div>
    <div style="display:flex;">
      <div style="display:flex;flex-direction:column;align-items:center;width:34px;position:relative;">
        <div style="height:2px;"></div>
        <div style="width:0; border-left:3px solid #b0b8be; height:${branchHeight}px; min-height:20px;"></div>
      </div>
      <div>
      ${rows.map(r=>`
        <div style="display:flex;align-items:center;height:${rowHeight}px;">
          <div style="width:36px;border-bottom:3px solid #b0b8be;"></div>
          <span style="color:${nameColor(r.status)};font-weight:600;font-size:1.09em;margin-left:10px;margin-right:8px;">
            ${escapeHtml(r.name)}
          </span>
          <span style="color:${statusColor(r.status)};font-weight:700;font-size:1em;margin-right:10px;">
            ${r.status.charAt(0).toUpperCase()+r.status.slice(1)}
          </span>
          ${r.status !=="pending" && r.timestamp ? `<span style="color:#848189;font-size:0.97em;font-weight:500;margin-left:4px;">${timeAgo(r.timestamp)}</span>` : ""}
          ${r.name===currentUser ? "<span style='margin-left:8px;font-size:0.98em;color:#222;font-weight:700;'>(You)</span>" : ""}
        </div>
      `).join('\n')}
      </div>
    </div>
  </div>
  `;
}

// ========== Detail ----------
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
  let userTimestamp = myStatusRow ? myStatusRow.timestamp : null;

  const partList = item.involvedStatus.map(p => ({
    name: p.name,
    status: p.status,
    timestamp: p.timestamp
  }));

  const isDisputed = !!item.disputed_by;
  const youDisputed = isDisputed && item.disputed_by === currentUser;
  let statusMsg = "";
  if (isDisputed && youDisputed)
    statusMsg = `<div style="color:#d12020;font-weight:700;font-size:1.1em;margin:18px 0 0 0;">You have disputed this expense <span style="color:#656;font-weight:500;">${timeAgo(item.disputed_at)}</span>.</div>`;
  else if (isDisputed)
    statusMsg = `<div style="color:#d12020;font-weight:700;font-size:1.1em;margin:18px 0 0 0;">${escapeHtml(item.disputed_by)} has disputed this expense <span style="color:#656;font-weight:500;">${timeAgo(item.disputed_at)}</span>.</div>`;
  else if (userStatus === 'accepted')
    statusMsg = `<div style="color:#188c3d;font-weight:700;font-size:1.1em; margin:18px 0 0 0;">You have accepted this expense <span style="color:#656;font-weight:500;">${timeAgo(userTimestamp)}</span>.</div>`;

  detailArea.innerHTML = `
    <div style="margin-bottom:18px;">
      <div style="font-weight:700;font-size:1.14em;color:#1b2837;">${escapeHtml(item.remarks)}</div>
      <div style="color:#566b89;font-size:1em;margin-bottom:3px;">${escapeHtml(item.date)}</div>
      <div style="color:#209;font-size:0.98em;margin-bottom:5px;">by ${escapeHtml(item.created_by)}</div>
      <div style="font-size:1.08em;color:#222;margin-bottom:2px;">Total: <span style="font-weight:700;">${item.total_amount} ${CURRENCY}</span></div>
      <div style="color:#888;font-size:0.99em; margin-bottom:4px;">Status last updated: <b>${timeAgo(item.status_at)}</b></div>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-weight:700;margin-bottom:5px;">Paid/Shares</div>
      <table style="border-collapse:collapse;width:auto;">
        ${item.splits.map(s => `
          <tr>
            <td style="padding:2px 12px 2px 0; color:#221;font-weight:700;min-width:5em;">${escapeHtml(s.name)}:</td>
            <td style="padding:2px 10px; color:#222;">paid <span style="font-weight:700;color:#222">${s.paid} ${CURRENCY}</span></td>
            <td style="padding:2px 5px; color:#567;">share <span style="font-weight:700;color:#222">${s.share} ${CURRENCY}</span></td>
          </tr>
        `).join('')}
      </table>
    </div>
    <div style="margin-bottom:10px;">
      <div style="font-weight:700;margin-bottom:5px;">Settlements</div>
      <table style="border-collapse:collapse;">
        ${item.settlements.length
          ? item.settlements.map(st => `
            <tr>
              <td style="padding:2px 10px 2px 0; color:#555;min-width:8em; text-align:right;">
                ${escapeHtml(st.from)}
              </td>
              <td style="padding:2px 2px; color:#888;width:29px;text-align:center;">
                <span style="font-size:1.21em;">&#8594;</span>
              </td>
              <td style="padding:2px 10px 2px 0; color:#333;">
                ${escapeHtml(st.to)}: <span style="font-weight:700;color:#222">${st.amount} ${CURRENCY}</span>
              </td>
            </tr>
          `).join('')
          : '<tr><td>No settlements needed</td></tr>'}
      </table>
    </div>
    <div style="border-top:1px solid #e8eaed;margin-top:10px;padding-top:10px; margin-bottom:10px;">
      <div style="font-size:1.01em;color:#556;margin-bottom:7px;font-weight:700;">Participants approvals:</div>
      ${approvalBranchHTML(item.created_by, partList, currentUser)}
      <div id="actionArea">${statusMsg}</div>
    </div>
  `;

  const actionArea = detailArea.querySelector('#actionArea');
  if (!isDisputed && userStatus === 'pending') {
    actionArea.innerHTML += `
      <div style="height:10px"></div>
      <button id="acceptBtn" style="margin-right:13px;background:#e7f6ea;color:#13a568;padding:10px 27px;font-size:1.09em; border:1.5px solid #13a568;border-radius:8px;cursor:pointer;font-weight:700;">Accept</button>
      <button id="disputeBtn" style="background:#ffecec;color:#d73323;padding:10px 27px;font-size:1.09em; border:1.5px solid #d73323;border-radius:8px;cursor:pointer;font-weight:700;">Dispute</button>
      <div id="disputeEntry" style="display:none;margin-top:12px;">
        <textarea id="disputeRemarks" placeholder="Enter reason..." style="width:98%;min-height:44px;border-radius:6px;border:1px solid #ccc;font-size:1em;padding:7px;"></textarea>
        <button id="submitDispute" style="margin-top:9px;padding:8px 20px;font-size:1.07em;">Submit Dispute</button>
      </div>
    `;
    actionArea.querySelector('#acceptBtn').onclick = () => handleApprovalAction(container, user, item, "accept");
    actionArea.querySelector('#disputeBtn').onclick = () => {
      actionArea.querySelector('#disputeEntry').style.display = '';
    };
    actionArea.querySelector('#submitDispute').onclick = () => {
      const reason = actionArea.querySelector('#disputeRemarks').value.trim();
      if (!reason) { alert("Please enter dispute reason!"); return; }
      handleApprovalAction(container, user, item, "dispute", reason);
    };
  }
  addStatusCSS();
}

async function handleApprovalAction(container, user, item, action, remarks="") {
  container.innerHTML = '<div style="padding:2em 0;text-align:center;">Processing...</div>';
  try {
    const token = await user.firebaseUser.getIdToken(true);
    const bodyObj = { spend_id: item.spend_id, action };
    if (action === "dispute") bodyObj.remarks = remarks;
    const resp = await fetch("https://ex-ap.nafil-8895-s.workers.dev/api/approval-action", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(bodyObj)
    });
    const result = await resp.json();
    if (!result.ok) throw new Error(result.error || "Unknown error");
    await showExpenseApproval(container, user);
  } catch (e) {
    alert(e.message);
    await showExpenseApproval(container, user);
  }
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
      .approval-branch-tree span, .approval-branch-tree div { line-height: 1.25; }
    `;
    document.head.appendChild(style);
  }
}
