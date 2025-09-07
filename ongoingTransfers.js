import { showSpinner, hideSpinner, delay } from './spinner.js';

const CURRENCY = localStorage.getItem('currency') || "QAR";

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

function getSelfName(user) {
  return (user?.firebaseUser?.displayName || user?.name || user?.firebaseUser?.email || "").toLowerCase();
}
function displayName(username, realname, currentUsername) {
  return username && username.toLowerCase() === currentUsername ? 'you' : escapeHtml(realname || username);
}
function renderTransfersList(container, user, transfers) {
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.05em;margin-bottom:7px;">Ongoing Transfers</div>
    <div class="transfer-folder-list"></div>
  `;
  const currentUsername = getSelfName(user);
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

    // Who is the "other" user to display "this guy accepted"?
    const otherUser = (t.from_user.toLowerCase() !== currentUsername) ? t.from_user : t.to_user;
    const otherName = (t.from_user.toLowerCase() !== currentUsername) ? (t.from_name || t.from_user) : (t.to_name || t.to_user);

    row.innerHTML = `
      <div class="transfer-main" style="flex:1;">
        <span class="serial-no" style="margin-right:1.4em;color:#4b65a3;font-weight:800;">${idx + 1}.</span>
        <span style="font-weight:600;font-size:1.06em;color:#193883">
          ${escapeHtml(t.sender_name)} 
          <span style="font-weight:400;color:#222;">initiated a transfer of</span>
          <span style="font-weight:800; color:#1a1d25;">${escapeHtml(t.amount)} ${escapeHtml(t.currency || CURRENCY)}</span>
          <span style="color:#222;font-weight:500;">from</span>
          <b>${displayName(t.from_user, t.from_name, currentUsername)}</b>
          <span style="color:#222;font-weight:500;">to</span>
          <b>${displayName(t.to_user, t.to_name, currentUsername)}</b>
        </span>
        <div style="margin-top:5px;">
          ${t.from_user.toLowerCase() === currentUsername && t.from_user_status === 'accepted' ? `<span style="color:#188c3d;font-weight:600;">You have accepted this transfer.</span>` : ""}
          ${t.to_user.toLowerCase() === currentUsername && t.to_user_status === 'accepted' ? `<span style="color:#188c3d;font-weight:600;">You have accepted this transfer.</span>` : ""}
          ${t.from_user_status === 'accepted' && t.from_user.toLowerCase() !== currentUsername
              ? `<span style="color:#216aff;font-weight:600;">${escapeHtml(t.from_name)} has accepted (${timeAgo(t.from_user_updated_at)})</span>` : ""}
          ${t.to_user_status === 'accepted' && t.to_user.toLowerCase() !== currentUsername
              ? `<span style="color:#216aff;font-weight:600;">${escapeHtml(t.to_name)} has accepted (${timeAgo(t.to_user_updated_at)})</span>` : ""}
        </div>
        <div style='color:#d29a07;font-weight:600;font-size:1em;padding-top:3px;'>Awaiting your confirmation.</div>
        <div style="color:#8a93a8;font-size:0.97em;margin-top:4px;">
          ${timeAgo(t.created_at)}
        </div>
      </div>
      ${(t.awaitingAction && (
        t.from_user_status === 'pending' && t.from_user.toLowerCase() === currentUsername ||
        t.to_user_status === 'pending' && t.to_user.toLowerCase() === currentUsername
      )) ? `
      <div class="transfer-actions" style="display:flex;flex-direction:column;gap:7px;margin-left:8px;">
        <button class="transfer-accept-btn" data-id="${t.transfer_id}">Accept</button>
        <button class="transfer-reject-btn" data-id="${t.transfer_id}">Reject</button>
      </div>` : ""}
    `;
    // Accept/Reject logic:
    row.querySelector('.transfer-accept-btn')?.addEventListener('click', async () => {
      await handleTransferAction('accept', t.transfer_id, user, container);
    });
    row.querySelector('.transfer-reject-btn')?.addEventListener('click', async () => {
      openRejectModal(t.transfer_id, user, container);
    });
    listArea.appendChild(row);
  });
}

async function handleTransferAction(action, transfer_id, user, container, reason = "") {
  showSpinner(container);
  try {
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://on-tr.nafil-8895-s.workers.dev/api/transfers/action', {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ transfer_id, action, reason })
    });
    const result = await resp.json();
    await delay(350);
    hideSpinner(container);
    if (!result.ok) throw new Error(result.error || "Unknown error");
    await showOngoingTransfersPanel(container, user);
  } catch (e) {
    hideSpinner(container);
    alert(e.message);
    await showOngoingTransfersPanel(container, user);
  }
}

// Simple reject modal (barebones, add your styling as desired!)
function openRejectModal(transfer_id, user, container) {
  if (document.getElementById('transfer-reject-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'transfer-reject-modal';
  modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(20,24,32,0.28);z-index:1000;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;padding:25px 23px 20px 23px;border-radius:12px;box-shadow:0 6px 32px #006b9912;max-width:95vw;width:375px;">
      <div style="font-weight:600;font-size:1.09em;margin-bottom:8px;">Reject Transfer</div>
      <textarea id="reason" rows="3" style="width:99%;min-height:58px;border:1.2px solid #8ad;border-radius:7px;margin-bottom:14px;font-size:1.03em;padding:6px;"></textarea>
      <div style="display:flex;gap:17px;justify-content:flex-end;">
        <button id="cancelReject" style="padding:6px 15px;font-weight:600;">Cancel</button>
        <button id="submitReject" style="padding:7px 18px;color:#fff;background:#e25535;border:none;font-weight:700;border-radius:7px;">Reject</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#cancelReject").onclick = () => modal.remove();
  modal.querySelector("#submitReject").onclick = async () => {
    const val = modal.querySelector("#reason").value.trim();
    if (!val) { alert("Please enter a rejection reason."); return; }
    modal.querySelector("#submitReject").disabled = true;
    await handleTransferAction('reject', transfer_id, user, container, val);
    modal.remove();
  };
}
