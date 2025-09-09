import { showSpinner, hideSpinner } from './spinner.js';

// --- Utilities ---
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
function formatTimeOnly(dtStr) {
  if (!dtStr) return "";
  const d = parseDBDatetimeAsUTC(dtStr);
  let hours = d.getHours(), mins = String(d.getMinutes()).padStart(2,"0"), ampm = "AM";
  if (hours >= 12) { ampm = "PM"; if (hours > 12) hours -= 12; }
  if (hours === 0) hours = 12;
  return `${hours}:${mins} ${ampm}`;
}
function formatGroupDate(dObj) {
  const today = new Date(); today.setHours(0,0,0,0);
  const dYesterday = new Date(today); dYesterday.setDate(today.getDate() - 1);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dCmp = (d) => d.getFullYear() + '.' + d.getMonth() + '.' + d.getDate();
  if (dCmp(dObj) === dCmp(today)) return "Today";
  if (dCmp(dObj) === dCmp(dYesterday)) return "Yesterday";
  let daysAgo = Math.floor((today - dObj) / (24 * 60 * 60 * 1000));
  if (daysAgo < 7) return days[dObj.getDay()];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(dObj.getDate()).padStart(2, "0")}-${months[dObj.getMonth()]}-${String(dObj.getFullYear()).slice(-2)}`;
}

// --- Highlighting on plain text, preserving nested <b> for bolds ---
function keywordSafeBold(text, keywords, isBold) {
  let safe = escapeHtml(text);
  if (isBold) safe = `<b>${safe}</b>`;
  if (!keywords.length) return safe;
  keywords.forEach(word => {
    if (word) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
      safe = safe.replace(regex, '<span style="background:yellow;">$&</span>');
    }
  });
  return safe;
}

function highlightKeywords(text, keywords) {
  let safe = escapeHtml(text);
  if (!keywords.length) return safe;
  keywords.forEach(word => {
    if (word) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
      safe = safe.replace(regex, '<span style="background:yellow;">$&</span>');
    }
  });
  return safe;
}

// --- Main Entrypoint ---
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
    container.innerHTML = `<div style="color:#d12020;font-size:1em;margin:1.3em 0 1em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
    return;
  }
  renderTransfersList(container, user, transfers);
}

// --- Main Render Function ---
function renderTransfersList(container, user, transfers) {
  const senders = Array.from(new Set(transfers.map(t => t.sender_name))).filter(Boolean);
  const participants = Array.from(new Set([].concat(...transfers.map(t => [t.from_name, t.to_name])).filter(Boolean)));
  const currIsSender = senders.includes("You");
  let senderOptions = currIsSender ? `<option value="me">Created by me</option>` : "";
  senderOptions += senders.filter(s => s !== "You").map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  const currInvolved = participants.includes("You");
  let partOptions = currInvolved ? `<option value="me">Involving me</option>` : "";
  partOptions += participants.filter(p => p !== "You").map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");

  // UI: search/date (first line), filters (second line), transfers (list)
  container.innerHTML = `
    <div style="display:flex; gap:10px; align-items:center; padding-bottom:9px;">
      <input type="text" id="transfer-search" placeholder="Search transfers..." 
         style="width:70%;max-width:70vw;padding:7px;font-size:1.09em;border-radius:7px;border:1.2px solid #c7c9d9;">
      <input type="date" id="date-filter-picker" style="width:30%;max-width:32vw;padding:7px;font-size:1.05em;border-radius:7px;">
    </div>
    <div style="display:flex;gap:4vw;padding:3px 4px 13px 4px;">
      <select id="transfer-initiator-dd" style="flex:1 1 46%;min-width:135px;max-width:48vw;">
        <option value="all">All Initiators</option>
        ${senderOptions}
      </select>
      <select id="transfer-participant-dd" style="flex:1 1 46%;min-width:135px;max-width:48vw;">
        <option value="all">Any Participant</option>
        ${partOptions}
      </select>
    </div>
    <div class="transfer-folder-list"></div>
  `;
  const searchBox = container.querySelector('#transfer-search');
  const initiatorDD = container.querySelector('#transfer-initiator-dd');
  const partDD = container.querySelector('#transfer-participant-dd');
  const datePicker = container.querySelector('#date-filter-picker');
  const listArea = container.querySelector('.transfer-folder-list');

  function doRender() {
    let arr = [...transfers];
    if (initiatorDD.value !== "all") {
      if (initiatorDD.value === "me") arr = arr.filter(t => t.sender_name === "You");
      else arr = arr.filter(t => t.sender_name === initiatorDD.value);
    }
    if (partDD.value !== "all") {
      if (partDD.value === "me") arr = arr.filter(t => t.from_name === "You" || t.to_name === "You");
      else arr = arr.filter(t => t.from_name === partDD.value || t.to_name === partDD.value);
    }
    let pickedDate = datePicker.value; // YYYY-MM-DD string
    if (pickedDate) {
      arr = arr.filter(t => {
        const d = parseDBDatetimeAsUTC(t.created_at);
        const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
        return `${yyyy}-${mm}-${dd}` === pickedDate;
      });
    }
    let rawSearch = (searchBox.value || "").trim();
    let keywords = rawSearch.toLowerCase().split(/\s+/).filter(Boolean);

    if (keywords.length) {
      arr = arr.filter(t =>
        keywords.every(word =>
          (t.sender_name && t.sender_name.toLowerCase().includes(word)) ||
          (t.from_name && t.from_name.toLowerCase().includes(word)) ||
          (t.to_name && t.to_name.toLowerCase().includes(word)) ||
          (t.amount && String(t.amount).toLowerCase().includes(word)) ||
          (t.currency && t.currency.toLowerCase().includes(word)) ||
          (t.direction && t.direction.toLowerCase().includes(word)) ||
          (t.remarks && t.remarks.toLowerCase().includes(word)) ||
          (t.transfer_id && t.transfer_id.toLowerCase().includes(word))
        )
      );
    }

    arr.sort((a, b) => parseDBDatetimeAsUTC(b.created_at) - parseDBDatetimeAsUTC(a.created_at));
    let groups = {};
    arr.forEach(t => {
      const d = parseDBDatetimeAsUTC(t.created_at);
      const groupKey = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(t);
    });

    listArea.innerHTML = "";

    if (!arr.length) {
      listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
        No transfers found.
      </div>`;
      return;
    }
    Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(groupKey => {
      const dObj = new Date(groupKey);
      listArea.innerHTML += `<div class="transfer-date-header">${formatGroupDate(dObj)}</div>`;
      groups[groupKey].forEach(t => {
        let statusMsg = '';
        if (t.own_status === 'pending') {
          statusMsg += '<span style="color:#d29a07;font-weight:600;">Awaiting your confirmation.</span><br>';
        } else if (t.own_status === 'accepted') {
          statusMsg += `<span style="color:#118041;font-weight:600;">You have accepted the transfer ${timeAgo(t.own_status_updated_at)}.</span><br>`;
        }
        if (t.other_status === 'accepted') {
          statusMsg += `<span style="color:#216aff;font-weight:600;">${highlightKeywords(t.other_name, keywords)} accepted the transfer ${timeAgo(t.other_status_updated_at)}.</span><br>`;
        }
        if (!t.own_status && t.from_user_status === 'accepted') {
          statusMsg += `<span style="color:#216aff;font-weight:600;">${highlightKeywords(t.from_name, keywords)} accepted the transfer ${timeAgo(t.from_user_updated_at)}.</span><br>`;
        }
        if (!t.own_status && t.to_user_status === 'accepted') {
          statusMsg += `<span style="color:#216aff;font-weight:600;">${highlightKeywords(t.to_name, keywords)} accepted the transfer ${timeAgo(t.to_user_updated_at)}.</span><br>`;
        }

        // --- Safe "main statement" in all black, bolding key parts, highlights preserved ---
        let sender = keywordSafeBold(t.sender_name, keywords, t.sender_name === "You");
        let amount = keywordSafeBold(t.amount, keywords, true);
        let curr = keywordSafeBold(t.currency, keywords, true);
        let from = keywordSafeBold(t.from_name, keywords, true);
        let to = keywordSafeBold(t.to_name, keywords, true);

        const row = document.createElement("div");
        row.className = "transfer-folder";
        row.tabIndex = 0;
        row.innerHTML = `
          <div style="flex:1;">
            <span class="transfer-main" style="color:#111;">
              ${sender}
              <span style="font-weight:400;">initiated a transfer of</span>
              ${amount} ${curr}
              <span style="font-weight:400;">from</span> ${from}
              <span style="font-weight:400;">to</span> ${to}
            </span>
            <div class="transfer-status">${statusMsg}</div>
            <div class="transfer-time" style="color:#222;">${formatTimeOnly(t.created_at)}</div>
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
    });
  }
  searchBox.oninput = initiatorDD.onchange = partDD.onchange = datePicker.onchange = doRender;
  doRender();
}

// --- Modal and Action Code unchanged as before ---
function showCustomActionModal(action, transfer_id, user, container) {
  if (document.getElementById('custom-action-confirm')) return;
  const modal = document.createElement('div');
  modal.id = 'custom-action-confirm';
  modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(42,54,77,0.32);z-index:1100;display:flex;align-items:center;justify-content:center;';
  const isReject = action === "Reject";
  const isCancel = action === "Cancel";
  modal.innerHTML = `
    <div style="background:#fff;padding:34px 22px 24px 22px;border-radius:13px;box-shadow:0 2px 28px #183f8e33;max-width:97vw;min-width:210px;">
      <div style="font-weight:700;font-size:1.14em;margin-bottom:10px;color:#183;">
        ${action === "Accept"
          ? "Accept this transfer?"
          : isReject
            ? "Reject this transfer?"
            : "Cancel this transfer?"}
      </div>
      ${
        action === "Accept"
         ? `<div style="color:#174514;font-size:0.99em;font-weight:400;background:#e6f7e1;padding:8px 10px 7px 10px;margin:0 0 16px 0;border-radius:8px;">
                Accepting means you agree to complete this transaction.<br>
                <b>This cannot be undone.</b>
            </div>`
         : ""
      }
      ${
        isReject
         ? `<div style="font-size:0.98em;font-weight:400;color:#7b3e2e;background:#fff7ee;padding:6px 3px 8px 6px;border-radius:5px;margin-bottom:7px;">Please provide a brief reason for rejection:</div>
            <textarea id="reject-reason-confirm"
                style="width:99%;min-height:46px;max-width:99%;margin-bottom:16px;font-size:1.09em;resize:vertical;padding:9px 7px;border-radius:8px;border:1.1px solid #eed7bb;background:#fffcf8;"></textarea>`
         : ""
      }
      <div style="display:flex;gap:18px;justify-content:flex-end;margin-top:2px;">
        <button id="cancel-action-confirm" style="padding:8px 22px;font-weight:500;border-radius:8px;border:1.1px solid #d7d4d3;background:#f6f6fc;">No</button>
        <button id="ok-action-confirm" style="padding:8px 24px 8px;color:#fff;background:#217a30;border:none;border-radius:8px;font-weight:700;">Yes</button>
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

async function handleTransferAction(action, transfer_id, user, container, reason = "") {
  showSpinner(container);
  try {
    const token = await user.firebaseUser.getIdToken(true);
    let apiURL = 'https://on-tr.nafil-8895-s.workers.dev/api/transfers/action';
    let payload = { transfer_id, action, reason };
    if (action === "cancel") {
      apiURL = 'https://on-tr.nafil-8895-s.workers.dev/api/transfers/cancel';
      payload = { transfer_id };
    }
    const resp = await fetch(apiURL, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await resp.json();
    hideSpinner(container);

    if (!result.ok) throw new Error(result.error || "Unknown error");
    showConfirmationModal(result.confirmation || (action === "cancel" ? "Transfer cancelled." : "Action completed."));
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
  setTimeout(() => { if (modal) modal.remove(); }, 5000);
}
