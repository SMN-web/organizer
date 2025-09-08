import { showSpinner, hideSpinner } from './spinner.js';

function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
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
    container.innerHTML = `<div style="font-weight:600;font-size:1.09em;margin-bottom:8px;">Ongoing Transfers</div>
      <div style="color:#d12020;font-size:1em;margin:1.3em 0 1em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
    return;
  }
  renderTransfersList(container, user, transfers);
}

function renderTransfersList(container, user, transfers) {
  container.innerHTML = `<div style="font-weight:600;font-size:1.05em;margin-bottom:7px;">Ongoing Transfers</div>
    <div class="transfer-folder-list"></div>`;
  const listArea = container.querySelector('.transfer-folder-list');
  if (!transfers.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      There are no ongoing transfers at the moment.
    </div>`;
    return;
  }
  let n = 1;
  transfers.forEach((t) => {
    let statusMsg = '';

    // Always show your own status if applicable
    if (t.own_status === 'pending') {
      statusMsg += '<span style="color:#d29a07;font-weight:600;">Awaiting your confirmation.</span>';
    } else if (t.own_status === 'accepted') {
      statusMsg += `<span style="color:#118041;font-weight:600;">You have accepted the transfer ${timeAgo(t.own_status_updated_at)}.</span>`;
    } else if (t.own_status === 'rejected') {
      statusMsg += `<span style="color:#d73323;font-weight:600;">You have rejected this transfer.</span>${t.remarks ? `<br><span style="color:#a13126;">Reason: ${escapeHtml(t.remarks)}</span>` : ""}`;
    }

    // ALWAYS show both from_user and to_user statuses/times to ALL roles
    if (t.from_user_status === 'accepted') {
      statusMsg += `<br><span style="color:#216aff;font-weight:600;">${escapeHtml(t.from_name)} accepted the transfer ${timeAgo(t.from_user_updated_at)}.</span>`;
    }
    if (t.to_user_status === 'accepted') {
      statusMsg += `<br><span style="color:#216aff;font-weight:600;">${escapeHtml(t.to_name)} accepted the transfer ${timeAgo(t.to_user_updated_at)}.</span>`;
    }
    if (t.from_user_status === 'rejected') {
      statusMsg += `<br><span style="color:#d73323;font-weight:600;">${escapeHtml(t.from_name)} rejected this transfer.</span>`;
    }
    if (t.to_user_status === 'rejected') {
      statusMsg += `<br><span style="color:#d73323;font-weight:600;">${escapeHtml(t.to_name)} rejected this transfer.</span>`;
    }

    const row = document.createElement("div");
    row.className = "transfer-folder";
    row.tabIndex = 0;
    row.style = `display:flex;align-items:flex-start;gap:11px;
      padding:10px 7px 12px 7px;
      border-bottom:1px solid #eee;font-size:1.05em;background:#fff;`;
    row.innerHTML = `
      <div style="flex:1;">
        <span style="margin-right:1.4em;color:#4b65a3;font-weight:800;">${n++}.</span>
        <span style="font-weight:600;color:#193883">
          ${escapeHtml(t.sender_name)}
          <span style="font-weight:400;color:#222;">initiated a transfer of</span>
          <span style="font-weight:800; color:#1a1d25;">${escapeHtml(t.amount)} ${escapeHtml(t.currency)}</span>
          <span style="color:#222;font-weight:500;">${escapeHtml(t.direction)}</span>
        </span>
        <div style="margin-top:6px;">${statusMsg}</div>
        <div style="color:#8a93a8;font-size:0.97em;margin-top:4px;">${timeAgo(t.created_at)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;margin-left:8px;">
        ${t.show_accept_button ?
          `<button class="accept-btn" style="padding:6px 18px;margin-bottom:6px;color:#13a568;background:#e7f6ea;font-weight:700;border-radius:7px;border:1.2px solid #13a568;">Accept</button>`
          : ""}
        ${t.show_reject_button ?
          `<button class="reject-btn" style="padding:6px 18px;color:#d73323;background:#ffecec;font-weight:700;border-radius:7px;border:1.2px solid #d73323;">Reject</button>`
          : ""}
        ${t.show_cancel_button ?
          `<button class="cancel-btn" style="padding:6px 18px;color:#d76213;background:#fff3e3;font-weight:700;border-radius:7px;border:1.2px solid #d76213;">Cancel</button>`
          : ""}
      </div>
    `;
    if (t.show_accept_button)
      row.querySelector('.accept-btn').onclick = () => handleTransferAction("accept", t.transfer_id, user, container);
    if (t.show_reject_button)
      row.querySelector('.reject-btn').onclick = () => openRejectModal(t.transfer_id, user, container);
    if (t.show_cancel_button)
      row.querySelector('.cancel-btn').onclick = () => handleTransferAction("cancel", t.transfer_id, user, container);
    listArea.appendChild(row);
  });
}

async function handleTransferAction(action, transfer_id, user, container, reason="") {
  showSpinner(container);
  try {
    const token = await user.firebaseUser.getIdToken(true);
    let apiURL = 'https://on-tr.nafil-8895-s.workers.dev/api/transfers/action', payload = { transfer_id, action, reason };
    if (action === "cancel") { apiURL = 'https://on-tr.nafil-8895-s.workers.dev/api/transfers/cancel'; payload = { transfer_id }; }
    const resp = await fetch(apiURL, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();
    hideSpinner(container);
    if (!result.ok) throw new Error(result.error || "Unknown error");
    showConfirmationModal(result.confirmation || (action==="cancel" ? "Transfer cancelled." : "Action completed."));
    await showOngoingTransfersPanel(container, user);
  } catch (e) {
    hideSpinner(container);
    alert(e.message || String(e));
  }
}

function openRejectModal(transfer_id, user, container) {
  if (document.getElementById('transfer-reject-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'transfer-reject-modal';
  modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(20,24,32,0.28);z-index:1000;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;padding:23px 20px 16px 20px;border-radius:9px;box-shadow:0 0 18px #1232;width:96vw;max-width:370px;">
      <div style="font-weight:600;font-size:1.05em;margin-bottom:7px;">Reject Transfer</div>
      <textarea id="reject-reason" rows="3" placeholder="Enter reason..." style="width:100%;min-height:58px;border:1px solid #bbb;border-radius:7px;margin-bottom:12px;font-size:1.08em;padding:7px;"></textarea>
      <div style="display:flex;gap:14px;justify-content:flex-end;">
        <button id="cancelReject" style="padding:5px 16px;font-weight:600;">Cancel</button>
        <button id="confirmReject" style="padding:6px 20px;color:#fff;background:#ea4c3d;font-weight:700;border-radius:6px;border:none;">Reject</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("#cancelReject").onclick = () => modal.remove();

  modal.querySelector("#confirmReject").onclick = async () => {
    const reason = modal.querySelector("#reject-reason").value.trim();
    if (!reason) {
      alert("Please enter a reason for rejection.");
      return;
    }
    modal.querySelector("#confirmReject").disabled = true;
    await handleTransferAction("reject", transfer_id, user, container, reason);
    modal.remove();
  };
}

function showConfirmationModal(message) {
  const id = "transfer-confirmation-modal";
  if (document.getElementById(id)) document.getElementById(id).remove();
  const modal = document.createElement('div');
  modal.id = id;
  modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(20,24,32,0.23);z-index:1015;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;padding:22px 32px 15px 29px;border-radius:10px;box-shadow:0 0 24px #13628224;max-width:92vw;min-width:175px;min-height:38px;font-size:1.06em;">
      <div style="margin-bottom:9px;color:#1a4d26;font-weight:600;">${escapeHtml(message)}</div>
      <center><button id="close-ok" style="margin-top:8px;border:none;background:#118041;color:#fff;padding:7px 24px 8px;border-radius:6px;font-size:1em;font-weight:600;">OK</button></center>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#close-ok").onclick = () => modal.remove();
  setTimeout(() => { if (modal) modal.remove(); }, 6200);
}
