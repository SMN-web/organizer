
  // history.js — Completed Group Expense History (read-only, spinner & single accepted pill)
import { showSpinner, hideSpinner } from './spinner.js';

const CURRENCY = localStorage.getItem('currency') || "QAR";

function parseDBDatetimeAsUTC(dt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return new Date(dt);
  return new Date(Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]));
}
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [full] = dateStr.split(' ');
  const [y, m, d] = full.split('-');
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d,10)}-${months[parseInt(m,10)-1]}-${y.slice(2)}`;
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
  return String(str||"").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}
function approvalBranchHTML(creator, rows) {
  const rowHeight = 31;
  const branchHeight = rows.length * rowHeight - 8;
  return `
  <div>
    <div style="font-weight:700;color:#222;font-size:0.99em;letter-spacing:0.04em;margin-bottom:1.5px;">
      ${escapeHtml(creator)}
    </div>
    <div style="display:flex;">
      <div style="display:flex;flex-direction:column;align-items:center;width:22px;position:relative;">
        <div style="height:2px;"></div>
        <div style="width:0; border-left:2.2px solid #b0b8be; height:${branchHeight}px; min-height:13px;"></div>
      </div>
      <div>
      ${rows.map(r => `
        <div style="display:flex;align-items:center;height:${rowHeight}px;">
          <div style="width:24px;border-bottom:2.2px solid #b0b8be;"></div>
          <span style="color:#187f2c;font-weight:600;font-size:0.98em;margin-left:8px;margin-right:8px;">
            ${escapeHtml(r.name)}
          </span>
          <span style="color:#187f2c;font-weight:700;font-size:0.96em;margin-right:7px;">
            Accepted
          </span>
          ${r.timestamp ? `<span style="color:#848189;font-size:0.93em;font-weight:500;margin-left:4px;">${timeAgo(r.timestamp)}</span>` : ""}
        </div>
      `).join('\n')}
      </div>
    </div>
  </div>
  `;
}

export async function showHistorySpend(container, user) {
  showSpinner(container);
  let data = [];
  try {
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://cr-me.nafil-8895-s.workers.dev/api/spends/completed', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await resp.text();
    data = JSON.parse(text);
    if (!Array.isArray(data)) data = [];
  } catch (e) {
    hideSpinner(container);
    container.innerHTML = `<div style="color:#d12020;padding:2em;">Failed to load history.</div>`;
    return;
  }
  hideSpinner(container);

  container.innerHTML = `
    <div style="font-weight:700;font-size:1.09em;margin-bottom:8px;">Expense History (Completed/Accepted)</div>
    <div class="history-list"></div>
  `;

  const listArea = container.querySelector('.history-list');
  if (!data.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      No expense history found.
    </div>`;
    return;
  }

  data.forEach(item => {
    const pill = `<span class="status-pill accepted" style="background:#e6f4ec;color:#188c3d;padding:3px 13px; border-radius:12px; font-weight:700;">Accepted</span>`;
    const row = document.createElement("div");
    row.className = "approval-folder";
    row.tabIndex = 0;
    row.style = `
      display:flex;align-items:flex-start;gap:11px;
      padding:9px 7px 10px 7px;
      border-bottom:1px solid #eee;font-size:0.97em;cursor:pointer;transition:background 0.2s;
    `;
    row.innerHTML = `
      <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:6px;">${item.sn}.</span>
      <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
        <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:2.5px;">${escapeHtml(item.remarks || "")}</div>
        <div class="date" style="color:#566b89;font-size:0.95em;">${formatDisplayDate(item.date || "")}</div>
        <div class="by" style="color:#209;font-size:0.93em;">created by ${escapeHtml(item.created_by)}</div>
      </div>
      ${pill}
    `;
    row.onclick = () => showHistoryDetails(container, item, data);
    row.onmouseover = () => row.style.backgroundColor = '#f8f9fa';
    row.onmouseout = () => row.style.backgroundColor = '';
    listArea.appendChild(row);
  });
}

function showHistoryDetails(container, item, listData) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <button id="backBtn" style="background:none;border:1px solid #ddd;border-radius:7px;padding:6px 14px;cursor:pointer;display:flex;align-items:center;gap:7px;font-size:0.96em;">← Back</button>
      <h3 style="margin:0;font-weight:600;font-size:1.07em;color:#1b2837;">Expense Details</h3>
      <div></div>
    </div>
    <div id="detailArea"></div>
  `;
  container.querySelector('#backBtn').onclick = function() {
    showHistoryPanel(container, { firebaseUser: { getIdToken: async()=>localStorage.getItem('token') } });
  };
  const detailArea = container.querySelector('#detailArea');
  const partList = (item.involvedStatus || []).map(p => ({
    name: p.name,
    timestamp: p.timestamp
  }));

  detailArea.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="font-weight:700;font-size:1em;color:#1b2837;">${escapeHtml(item.remarks)}</div>
      <div style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
      <div style="color:#209;font-size:0.93em;margin-bottom:4px;">created by ${escapeHtml(item.created_by)}</div>
      <div style="font-size:0.99em;color:#222;margin-bottom:2px;">Total: <span style="font-weight:700;">${item.total_amount} ${CURRENCY}</span></div>
      <div style="color:#888;font-size:0.96em; margin-bottom:3px;">Status last updated: <b>${timeAgo(item.status_at)}</b></div>
    </div>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#164fa4;letter-spacing:.2px;">Paid/Shares</div>
    <table style="border-collapse:collapse;width:auto;margin-bottom:9px;">
      ${(item.splits||[]).map(s => `
        <tr>
          <td style="padding:2px 8px 2px 0; color:#221;font-weight:600;min-width:5em;">${escapeHtml(s.name||"")}</td>
          <td style="padding:2px 8px; color:#222;">paid <span style="font-weight:700;color:#222">${s.paid} ${CURRENCY}</span></td>
          <td style="padding:2px 5px; color:#567;">share <span style="font-weight:700;color:#222">${s.share} ${CURRENCY}</span></td>
        </tr>
      `).join('')}
    </table>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#23875e;letter-spacing:.2px;">Settlements</div>
    <table style="border-collapse:collapse;margin-bottom:8px;">
      ${(item.settlements||[]).length
        ? item.settlements.map(st => `
          <tr>
            <td style="padding:2px 8px 2px 0; color:#555;min-width:8em;text-align:right;">
              ${escapeHtml(st.from||"")}
            </td>
            <td style="padding:2px 2px; color:#888;width:24px;text-align:center;">
              <span style="font-size:1.12em;">&#8594;</span>
            </td>
            <td style="padding:2px 9px 2px 0; color:#333;">
              ${escapeHtml(st.to||"")}: <span style="font-weight:700;color:#222">${st.amount} ${CURRENCY}</span>
            </td>
          </tr>
        `).join('')
        : '<tr><td>No settlements needed</td></tr>'}
    </table>
    <div style="border-top:1px solid #e8eaed;margin-top:10px;padding-top:8px; margin-bottom:9px;">
      <div style="font-size:0.96em;color:#556;margin-bottom:6px;font-weight:700;">Participants approvals:</div>
      ${approvalBranchHTML(item.created_by, partList)}
    </div>
  `;
  addHistoryPanelCSS();
}

function addHistoryPanelCSS() {
  const cssId = "history-panel-css";
  if (!document.getElementById(cssId)) {
    const style = document.createElement("style");
    style.id = cssId;
    style.textContent = `
      .status-pill {
        min-width: 82px;
        margin-left: 7px;
        border-radius: 11px;
        padding: 2px 8px;
        font-weight: 600;
        text-align: center;
        background: #e6f4ec;
        color: #188c3d;
        height: fit-content;
        flex-shrink: 0;
        font-size: 0.97em;
      }
      mark { background: #ffeb3b !important; padding: 1px 2px !important; border-radius: 2px !important; }
      .approval-folder { font-size: 0.97em; }
      .approval-main { font-size: 0.96em; }
    `;
    document.head.appendChild(style);
  }
}

