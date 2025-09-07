const CURRENCY = localStorage.getItem('currency') || "QAR";
import { showSpinner, hideSpinner, delay } from './spinner.js';

function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

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

export async function showOngoingTransfersPanel(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let transfers = [];
  let errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view pending transfers.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(/*force*/true);
    const resp = await fetch('https://on-tr.nafil-8895-s.workers.dev/api/transfers/ongoing', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await resp.text();
    try { transfers = JSON.parse(text); }
    catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(transfers)) {
      if (transfers && transfers.error) errMsg = "Backend error: " + transfers.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  hideSpinner(container);

  if (errMsg) {
    container.innerHTML = `<div style="font-weight:600;font-size:1.09em;margin-bottom:8px;">Ongoing Transfers</div>
      <div style="color:#d12020;font-size:1em;margin:1.3em 0 1em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
    return;
  }

  renderTransfersList(container, user, transfers);
}

function renderTransfersList(container, user, transfers) {
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.05em;margin-bottom:7px;">Ongoing Transfers</div>
    <div class="transfer-folder-list"></div>
  `;

  const listArea = container.querySelector('.transfer-folder-list');
  if (!transfers.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      There are no ongoing transfers at the moment.
    </div>`;
    return;
  }

  transfers.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = "transfer-folder";
    row.tabIndex = 0;
    row.style = `display:flex;align-items:flex-start;gap:11px;
      padding:10px 7px 12px 7px;
      border-bottom:1px solid #eee;font-size:1.04em;transition:background 0.2s;background:#fff;`;

    row.innerHTML = `
      <div class="transfer-main" style="flex:1;">
        <div style="font-weight:600;font-size:1.06em;color:#193883">
          ${escapeHtml(t.sender_name)} 
          <span style="font-weight:400;color:#222;">initiated a transfer of</span>
          <span style="font-weight:800; color:#1a1d25;">${escapeHtml(t.amount)} ${escapeHtml(t.currency || CURRENCY)}</span>
          <span style="color:#222;font-weight:500;">from</span>
          <b>${escapeHtml(t.from_name)}</b>
          <span style="color:#222;font-weight:500;">to</span>
          <b>${escapeHtml(t.to_name)}</b>
        </div>
        <div style='color:#d29a07;font-weight:600;font-size:1em;padding-top:3px;'>Awaiting your confirmation.</div>
        <div style="color:#8a93a8;font-size:0.97em;margin-top:4px;">
          ${timeAgo(t.created_at)}
        </div>
      </div>
      ${t.awaitingAction ? `
      <div class="transfer-actions" style="display:flex;flex-direction:column;gap:7px;margin-left:8px;">
        <button class="transfer-accept-btn" data-id="${t.transfer_id}" style="background:#e7f6ea;color:#13a568;padding:6px 17px;font-size:1em; border:1.2px solid #13a568;border-radius:7px;cursor:pointer;font-weight:700;">Accept</button>
        <button class="transfer-reject-btn" data-id="${t.transfer_id}" style="background:#ffecec;color:#d73323;padding:6px 17px;font-size:1em; border:1.2px solid #d73323;border-radius:7px;cursor:pointer;font-weight:700;">Reject</button>
      </div>` : ""}
    `;
    // Add accept/reject event listeners here...
    listArea.appendChild(row);
  });
}
