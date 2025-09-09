import { showSpinner, hideSpinner } from './spinner.js';

function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

function trimLower(str) {
  return (str || "").trim().toLowerCase();
}

function parseDBDatetimeAsUTC(dt) {
  if (!dt) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  return m ? new Date(Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6])) : new Date(dt);
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

function formatDateTime(dtStr) {
  if (!dtStr) return "";
  const d = parseDBDatetimeAsUTC(dtStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let hours = d.getHours(), mins = String(d.getMinutes()).padStart(2, "0"), ampm = "AM";
  if (hours >= 12) { ampm = "PM"; if (hours > 12) hours -= 12; }
  if (hours === 0) hours = 12;
  return (
    String(d.getDate()).padStart(2, "0") + "-" +
    months[d.getMonth()] + "-" +
    String(d.getFullYear()).slice(-2) +
    ` (${days[d.getDay()]})` +
    ", " + hours + ":" + mins + " " + ampm
  );
}

export async function showOngoingTransfersPanel(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let transfers = [], errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view pending transfers.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
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
    container.innerHTML = `<div class="transfer-header">Ongoing Transfers</div>
      <div style="color:#d12020;font-size:1em;margin:1.3em 0 1em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
    return;
  }
  renderTransfersList(container, user, transfers);
}

function renderTransfersList(container, user, transfers) {
  container.innerHTML = `<div class="transfer-header">Ongoing Transfers</div>
    <div class="transfer-folder-list"></div>`;
  const listArea = container.querySelector('.transfer-folder-list');
  if (!transfers.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      There are no ongoing transfers at the moment.
    </div>`;
    return;
  }
  let n = 1;
  const currUsername = trimLower(user?.username);

  transfers.forEach(t => {
    const senderUsername = trimLower(t.sender_username);
    const fromUsername   = trimLower(t.from_user_username);
    const toUsername     = trimLower(t.to_user_username);

    const displaySender = senderUsername === currUsername ? "You" : escapeHtml(t.sender_name || "");
    const directionStr = `from ${fromUsername === currUsername ? "You" : escapeHtml(t.from_name || "")} to ${toUsername === currUsername ? "You" : escapeHtml(t.to_name || "")}`;

    let statusMsg = '';
    if (t.own_status === 'pending') {
      statusMsg += '<span style="color:#d29a07;font-weight:600;">Awaiting your confirmation.</span><br>';
    } else if (t.own_status === 'accepted') {
      statusMsg += `<span style="color:#118041;font-weight:600;">You have accepted the transfer ${timeAgo(t.own_status_updated_at)}.</span><br>`;
    }
    // Only print acceptance for others, always by name
    if (t.from_user_status === 'accepted' && fromUsername !== currUsername) {
      statusMsg += `<span style="color:#216aff;font-weight:600;">${escapeHtml(t.from_name)} accepted the transfer ${timeAgo(t.from_user_updated_at)}.</span><br>`;
    }
    if (t.to_user_status === 'accepted' && toUsername !== currUsername) {
      statusMsg += `<span style="color:#216aff;font-weight:600;">${escapeHtml(t.to_name)} accepted the transfer ${timeAgo(t.to_user_updated_at)}.</span><br>`;
    }

    const row = document.createElement("div");
    row.className = "transfer-folder";
    row.tabIndex = 0;
    row.innerHTML = `
      <div style="flex:1;">
        <span class="transfer-num">${n++}.</span>
        <span class="transfer-main">
          ${displaySender}
          <span style="font-weight:400;color:#222;">initiated a transfer of</span>
          <span class="transfer-amount">${escapeHtml(t.amount)} ${escapeHtml(t.currency)}</span>
          <span class="transfer-fromto">${directionStr}</span>
        </span>
        <div class="transfer-status">${statusMsg}</div>
        <div class="transfer-date">${formatDateTime(t.created_at)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;margin-left:8px;">
        ${t.show_accept_button ? `<button class="btn-accept accept-btn">Accept</button>` : ""}
        ${t.show_reject_button ? `<button class="btn-reject reject-btn">Reject</button>` : ""}
        ${t.show_cancel_button ? `<button class="btn-cancel cancel-btn">Cancel</button>` : ""}
      </div>
    `;
    if (t.show_accept_button)
      row.querySelector('.accept-btn').onclick = () =>
        showCustomActionModal("Accept", t.transfer_id, user, container);
    if (t.show_reject_button)
      row.querySelector('.reject-btn').onclick = () =>
        showCustomActionModal("Reject", t.transfer_id, user, container);
    if (t.show_cancel_button)
      row.querySelector('.cancel-btn').onclick = () =>
        showCustomActionModal("Cancel", t.transfer_id, user, container);
    listArea.appendChild(row);
  });
}
