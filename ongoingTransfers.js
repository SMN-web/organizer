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
  const currUsername = user?.username?.toLowerCase?.() || '';

  transfers.forEach(t => {
    // Show "You" if sender is current user
    const displaySender = t.sender_username?.toLowerCase?.() === currUsername ? "You" : escapeHtml(t.sender_name);

    // Status messages for BOTH from_user/to_user acceptance, always visible
    let statusMsg = '';
    if (t.from_user_status === 'accepted') {
      statusMsg += `<span style="color:#216aff;font-weight:600;">${escapeHtml(t.from_name)} accepted the transfer ${timeAgo(t.from_user_updated_at)}.</span><br>`;
    }
    if (t.to_user_status === 'accepted') {
      statusMsg += `<span style="color:#216aff;font-weight:600;">${escapeHtml(t.to_name)} accepted the transfer ${timeAgo(t.to_user_updated_at)}.</span><br>`;
    }
    // For from/to, put own status message first
    if (t.own_status === 'pending') {
      statusMsg = '<span style="color:#d29a07;font-weight:600;">Awaiting your confirmation.</span><br>' + statusMsg;
    } else if (t.own_status === 'accepted') {
      statusMsg = `<span style="color:#118041;font-weight:600;">You have accepted the transfer ${timeAgo(t.own_status_updated_at)}.</span><br>` + statusMsg;
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
          <span class="transfer-fromto">${escapeHtml(t.direction)}</span>
        </span>
        <div class="transfer-status">${statusMsg}</div>
        <div class="transfer-time">${timeAgo(t.created_at)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:7px;margin-left:8px;">
        ${t.show_accept_button ?
          `<button class="btn-accept accept-btn">Accept</button>` : ""}
        ${t.show_reject_button ?
          `<button class="btn-reject reject-btn">Reject</button>` : ""}
        ${t.show_cancel_button ?
          `<button class="btn-cancel cancel-btn">Cancel</button>` : ""}
      </div>
    `;

    // Custom confirmation modal for Accept, Reject, Cancel:
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

// Always use this modal for Accept, Reject, Cancel
function showCustomActionModal(action, transfer_id, user, container) {
  if (document.getElementById('custom-action-confirm')) return;
  const modal = document.createElement('div');
  modal.id = 'custom-action-confirm';
  modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(64,64,64,0.23);z-index:1100;display:flex;align-items:center;justify-content:center;';
  const isReject = action === "Reject";
  const isCancel = action === "Cancel";
  modal.innerHTML = `
    <div style="background:#fff;padding:26px 24px 22px 24px;border-radius:11px;box-shadow:0 0 26px #1232;max-width:95vw;">
      <div style="font-weight:600;font-size:1.09em;margin-bottom:13px;">
        Confirm ${escapeHtml(action)}
      </div>
      ${isReject ? `<textarea id="reject-reason-confirm" style="width:97%;min-height:54px;margin-bottom:13px;font-size:1.07em;padding:6px;"></textarea>` : ""}
      <div style="display:flex;gap:20px;justify-content:flex-end;">
        <button id="cancel-action-confirm" style="padding:6px 15px;font-weight:500;">No</button>
        <button id="ok-action-confirm" style="padding:7px 20px;color:#fff;background:#2146cc;border:none;border-radius:7px;font-weight:700;">Yes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#cancel-action-confirm").onclick = () => modal.remove();
  modal.querySelector("#ok-action-confirm").onclick = async () => {
    if (isReject) {
      const reason = modal.querySelector("#reject-reason-confirm").value.trim();
      if (!reason) { alert("Please enter a reason for rejection."); return; }
      modal.remove();
      await handleTransferAction("reject", transfer_id, user, container, reason);
    } else if (isCancel) {
      modal.remove();
      await handleTransferAction("cancel", transfer_id, user, container, "");
    } else {
      modal.remove();
      await handleTransferAction("accept", transfer_id, user, container, "");
    }
  };
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
