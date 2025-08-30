const CURRENCY = localStorage.getItem('currency') || "QAR";

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

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [full] = dateStr.split(' ');
  const [y, m, d] = full.split('-');
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d,10)}-${months[parseInt(m,10)-1]}-${y.slice(2)}`;
}

export async function showCreatedByMePanel(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let spendsData = [];
  let errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      hideSpinner(container);
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://cr-me.nafil-8895-s.workers.dev/api/spends/created-by-me', {
      headers: { Authorization: "Bearer " + token }
    });
    const text = await resp.text();
    try { spendsData = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(spendsData)) {
      if (spendsData && spendsData.error) errMsg = "Backend error: " + spendsData.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  hideSpinner(container);

  if (errMsg) {
    container.innerHTML = `<div style="font-weight:600;font-size:1.09em;margin-bottom:8px;">Created By Me</div>
      <div style="color:#d12020;font-size:1em;margin:1.2em 0 1em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
    return;
  }
  renderSpendsArea(container, user, spendsData);
}

function renderSpendsArea(container, user, spendsData) {
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.01em;margin-bottom:7px;">Created By Me</div>
    <div class="createdbyme-folder-list"></div>
  `;

  const listArea = container.querySelector('.createdbyme-folder-list');

  if (!spendsData.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      No spends created by you yet.
    </div>`;
    return;
  }

  spendsData.forEach(item => {
    const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
    const total = item.involvedStatus.length;
    const statusHtml = item.status === 'disputed'
      ? `<span class="status-pill disputed">Disputed</span>`
      : `<span class="status-pill pending">${item.status === "accepted" ? "Accepted" : "Pending"} ${accepted}/${total}</span>`;
    const row = document.createElement("div");
    row.className = "approval-folder";
    row.tabIndex = 0;
    row.style = `display:flex;align-items:flex-start;gap:11px;
      padding:9px 7px 10px 7px;
      border-bottom:1px solid #eee;font-size:0.97em;cursor:pointer;transition:background 0.2s;`;
    row.innerHTML = `
      <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:6px;">${item.sn}.</span>
      <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
        <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:2.5px;">${escapeHtml(item.remarks||"")}</div>
        <div class="date" style="color:#566b89;font-size:0.95em;">${formatDisplayDate(item.date||"")}</div>
        <div class="by" style="color:#209;font-size:0.93em;">by You</div>
      </div>
      ${statusHtml}
    `;
    row.onclick = () => showCreatedByMeDetails(container, user, item);
    row.onmouseover = () => row.style.backgroundColor = '#f8f9fa';
    row.onmouseout = () => row.style.backgroundColor = '';
    listArea.appendChild(row);
  });
}

function showCreatedByMeDetails(container, user, item) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <button id="backBtn" style="background:none;border:1px solid #ddd;border-radius:7px;padding:6px 14px;cursor:pointer;display:flex;align-items:center;gap:7px;font-size:0.96em;">← Back</button>
      <h3 style="margin:0;font-weight:600;font-size:1.07em;color:#1b2837;">Expense Details</h3>
      <div></div>
    </div>
    <div id="detailArea"></div>
  `;
  container.querySelector('#backBtn').onclick = function() {
    showCreatedByMePanel(container, user);
  };
  const detailArea = container.querySelector('#detailArea');
  detailArea.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="font-weight:700;font-size:1em;color:#1b2837;">${escapeHtml(item.remarks)}</div>
      <div style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
      <div style="color:#209;font-size:0.93em;margin-bottom:4px;">by You</div>
      <div style="font-size:0.99em;color:#222;margin-bottom:2px;">Total: <span style="font-weight:700;">${item.total_amount} ${CURRENCY}</span></div>
      <div style="color:#888;font-size:0.96em; margin-bottom:3px;">Status last updated: <b>${timeAgo(item.status_at)}</b></div>
    </div>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#164fa4;letter-spacing:.2px;">Paid/Shares</div>
    <table style="border-collapse:collapse;width:auto;margin-bottom:9px;">
      ${item.splits.map(s => `
        <tr>
          <td style="padding:2px 8px 2px 0; color:#221;font-weight:600;min-width:5em;">${escapeHtml(s.name)}:</td>
          <td style="padding:2px 8px; color:#222;">paid <span style="font-weight:700;color:#222">${s.paid} ${CURRENCY}</span></td>
          <td style="padding:2px 5px; color:#567;">share <span style="font-weight:700;color:#222">${s.share} ${CURRENCY}</span></td>
        </tr>
      `).join('')}
    </table>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#23875e;letter-spacing:.2px;">Settlements</div>
    <table style="border-collapse:collapse;margin-bottom:8px;">
      ${item.settlements.length
        ? item.settlements.map(st => `
          <tr>
            <td style="padding:2px 8px 2px 0; color:#555;min-width:8em;text-align:right;">
              ${escapeHtml(st.from)}
            </td>
            <td style="padding:2px 2px; color:#888;width:24px;text-align:center;">
              <span style="font-size:1.12em;">&#8594;</span>
            </td>
            <td style="padding:2px 9px 2px 0; color:#333;">
              ${escapeHtml(st.to)}: <span style="font-weight:700;color:#222">${st.amount} ${CURRENCY}</span>
            </td>
          </tr>
        `).join('')
        : '<tr><td>No settlements needed</td></tr>'}
    </table>
    ${item.status === "disputed"
      ? `<button id="editBtn" style="margin-top:17px; padding:8px 24px; font-size:1em; border-radius:8px; background:#2268c5; color:#fff; border:none; font-weight:600;">Edit</button>`
      : ""}
  `;
  if (item.status === "disputed") {
    detailArea.querySelector('#editBtn').onclick = () => showEditMessage(container, user, item);
  }
}

function showEditMessage(container, user, item) {
  container.innerHTML = `
    <div style="padding:34px 0 20px 0;text-align:center;">
      <div style="font-size:1.03em;font-weight:500;color:#316;">
        <span style="font-size:2em;">🛠️</span>
        <br>
        <b>Edit Mode:</b> 
        Here you will soon be able to edit all aspects of your expense—participants, shares, paid, date, remarks, and redistribute.
        <br><br>On save, all previous data and approvals will be reset and replaced.
      </div>
      <div style="margin-top:20px;">
        <button style="padding:8px 30px;font-size:1.05em;" onclick="history.back()">Go Back</button>
      </div>
    </div>
  `;
}
