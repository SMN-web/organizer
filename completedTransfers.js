import { showSpinner, hideSpinner } from './spinner.js';

// --- Utility Functions ---
function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}
function parseDBDatetimeAsUTC(dt) {
  if (!dt) return new Date();
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  return m ? new Date(Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6])) : new Date(dt);
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
// --- Status pill (right aligned) ---
function statusPill(status) {
  let color = "#727272", label = "";
  if (status === "accepted") { color = "#107c41"; label = "Accepted"; }
  else if (status === "rejected") { color = "#e23434"; label = "Rejected"; }
  else if (status === "cancelled") { color = "#82909a"; label = "Cancelled"; }
  return `<span class="status-pill" style="
      display:inline-block;
      background:${color};color:#fff;
      font-size:0.98em;
      font-weight:600;
      border-radius:12px;
      padding:2px 15px 4px 15px;
      margin-left:8px;
      min-width:90px;
      text-align:center;
      float:right;
      ">${label}</span>`;
}

// --- Main Entrypoint ---
export async function showCompletedTransfersPanel(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let transfers = [], errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view completed transfers.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://co-tr.nafil-8895-s.workers.dev/api/transfers/completed', {
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
  renderCompletedTransfersList(container, user, transfers);
}

function renderCompletedTransfersList(container, user, transfers) {
  const senders = Array.from(new Set(transfers.map(t => t.sender_name))).filter(Boolean);
  const participants = Array.from(new Set([].concat(...transfers.map(t => [t.from_name, t.to_name])).filter(Boolean)));
  let senderOptions = senders.includes("You") ? `<option value="me">Created by me</option>` : "";
  senderOptions += senders.filter(s => s !== "You").map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join("");
  let partOptions = participants.includes("You") ? `<option value="me">Involving me</option>` : "";
  partOptions += participants.filter(p => p !== "You").map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  container.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center; padding-bottom:7px;">
      <input type="text" id="transfer-search" placeholder="Search transfers..." 
         style="width:44%;max-width:44vw;padding:7px;font-size:1.09em;border-radius:7px;border:1.2px solid #c7c9d9;">
      <input type="date" id="date-filter-picker" style="width:30%;max-width:32vw;padding:7px;font-size:1.05em;border-radius:7px;">
      <select id="status-filter" style="width:26%;max-width:27vw;padding:7px;font-size:1.07em;border-radius:7px;">
        <option value="all">All Statuses</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
    <div style="display:flex;gap:4vw;padding:3px 4px 13px 4px;">
      <select id="transfer-initiator-dd" style="flex:1 1 46%;min-width:135px;max-width:48vw;">
        <option value="all">All Initiators</option>${senderOptions}
      </select>
      <select id="transfer-participant-dd" style="flex:1 1 46%;min-width:135px;max-width:48vw;">
        <option value="all">Any Participant</option>${partOptions}
      </select>
    </div>
    <div class="transfer-folder-list"></div>
  `;
  const searchBox = container.querySelector('#transfer-search');
  const initiatorDD = container.querySelector('#transfer-initiator-dd');
  const partDD = container.querySelector('#transfer-participant-dd');
  const datePicker = container.querySelector('#date-filter-picker');
  const statusFilter = container.querySelector('#status-filter');
  const listArea = container.querySelector('.transfer-folder-list');

  function doRender() {
    let arr = [...transfers];
    if (initiatorDD.value !== "all") arr = initiatorDD.value === "me" ? arr.filter(t => t.sender_name === "You") : arr.filter(t => t.sender_name === initiatorDD.value);
    if (partDD.value !== "all") arr = partDD.value === "me" ? arr.filter(t => t.from_name === "You" || t.to_name === "You") : arr.filter(t => t.from_name === partDD.value || t.to_name === partDD.value);
    if (datePicker.value) {
      arr = arr.filter(t => {
        const d = parseDBDatetimeAsUTC(t.created_at);
        const yyyy = d.getFullYear(), mm = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
        return `${yyyy}-${mm}-${dd}` === datePicker.value;
      });
    }
    if (statusFilter.value !== "all") arr = arr.filter(t => t.status === statusFilter.value);

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
          (t.status && t.status.toLowerCase().includes(word)) ||
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
        No completed transfers found.
      </div>`;
      return;
    }
    Object.keys(groups).sort((a, b) => b.localeCompare(a)).forEach(groupKey => {
      const dObj = new Date(groupKey);
      const headerDiv = document.createElement("div");
      headerDiv.className = "transfer-date-header";
      headerDiv.textContent = formatGroupDate(dObj);
      listArea.appendChild(headerDiv);

      groups[groupKey].forEach(t => {
        let sender = keywordSafeBold(t.sender_name, keywords, t.sender_name === "You");
        let amount = keywordSafeBold(t.amount, keywords, true);
        let curr = keywordSafeBold(t.currency, keywords, true);
        let from = keywordSafeBold(t.from_name, keywords, true);
        let to = keywordSafeBold(t.to_name, keywords, true);

        const row = document.createElement("div");
        row.className = "transfer-folder";
        row.tabIndex = 0;
        row.style = "display:flex;align-items:center;justify-content:space-between;gap:6px;cursor:pointer;";

        row.innerHTML = `
          <div style="flex:1;">
            <span class="transfer-main" style="color:#111;">
              ${sender}
              <span style="font-weight:400;">initiated a transfer of</span>
              ${amount} ${curr}
              <span style="font-weight:400;">from</span> ${from}
              <span style="font-weight:400;">to</span> ${to}
            </span>
            <div class="transfer-time" style="color:#222;font-size:0.99em;margin-top:4px;">
              ${formatTimeOnly(t.created_at)}
            </div>
          </div>
          <div style="align-self:flex-start;">
            ${statusPill(t.status)}
          </div>
        `;
        row.onclick = () => showCompletedTransferDetail(container, user, t, () => renderCompletedTransfersList(container, user, transfers));
        listArea.appendChild(row);
      });
    });
  }
  searchBox.oninput = initiatorDD.onchange = partDD.onchange = datePicker.onchange = statusFilter.onchange = doRender;
  doRender();
}

function showCompletedTransferDetail(container, user, t, onBack) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:11px;margin-bottom:17px;">
      <button id="complete-back-btn" style="font-size:1.25em;padding:4px 18px 4px 6px;background:none;border:none;cursor:pointer;color:#1548ad;">&#8592;</button>
      <span style="font-weight:600;font-size:1.1em">Transfer Details</span>
    </div>
    <div class="completed-transfer-detail-card" style="background:#fff;border-radius:11px;padding:16px 13px 14px 17px;box-shadow:0 2px 16px #c6d0eb24;max-width:550px;margin:auto;">
      <div style="margin-bottom:12px;">
        <span class="transfer-main" style="color:#111;">
          ${keywordSafeBold(t.sender_name, [], t.sender_name === "You")}
          <span style="font-weight:400;">initiated a transfer of</span>
          ${keywordSafeBold(t.amount, [], true)} ${keywordSafeBold(t.currency, [], true)}
          <span style="font-weight:400;">from</span> ${keywordSafeBold(t.from_name, [], true)}
          <span style="font-weight:400;">to</span> ${keywordSafeBold(t.to_name, [], true)}
        </span>
        ${statusPill(t.status)}
      </div>
      <div style="margin-bottom:6px;">
        <b>Payment Reference No.:</b> <span style="font-weight:400;">${escapeHtml(t.payment_ref || "-")}</span>
      </div>
      <div style="margin-bottom:6px;">
        <b>Transfer Reference No.:</b> <span style="font-weight:400;">${escapeHtml(t.transfer_ref || "-")}</span>
      </div>
      <div style="margin-bottom:6px;">
        <b>Sender:</b> <span style="font-weight:400;">${escapeHtml(t.sender_name)}</span>
      </div>
      <div style="margin-bottom:6px;">
        <b>From:</b> <span style="font-weight:400;">${escapeHtml(t.from_name)}</span>
      </div>
      <div style="margin-bottom:6px;">
        <b>To:</b> <span style="font-weight:400;">${escapeHtml(t.to_name)}</span>
      </div>
      <div style="margin-bottom:6px;">
        <b>Amount:</b> <span style="font-weight:400;">${t.amount} ${t.currency}</span>
      </div>
      <div style="margin-bottom:9px;">
        <b>Status:</b> <span style="font-weight:500;">${t.status.charAt(0).toUpperCase()+t.status.slice(1)}</span>
      </div>
      <div style="font-size:0.99em;color:#777;">${formatGroupDate(parseDBDatetimeAsUTC(t.created_at))} &bull; ${formatTimeOnly(t.created_at)}</div>
      ${t.remarks ? `<div style="margin-top:11px;font-size:1.01em;"><b>Remarks:</b> <span style="font-weight:400;">${escapeHtml(t.remarks)}</span></div>` : ""}
    </div>
  `;
  container.querySelector("#complete-back-btn").onclick = onBack;
}
