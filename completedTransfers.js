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
function formatDateWithWeekday(dtStr) {
  const d = parseDBDatetimeAsUTC(dtStr);
  const dStr = [
    String(d.getDate()).padStart(2,"0"),
    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()],
    String(d.getFullYear()).slice(-2)
  ].join("-");
  const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];
  let hours = d.getHours(), mins = String(d.getMinutes()).padStart(2,"0"), ampm = "AM";
  if (hours >= 12) { ampm = "PM"; if (hours > 12) hours -= 12; }
  if (hours === 0) hours = 12;
  return `${dStr} (${weekday}), ${hours}:${mins} ${ampm}`;
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
function statusPill(status) {
  let color = "#727272", label = "";
  if (status === "accepted") { color = "#107c41"; label = "Accepted"; }
  else if (status === "rejected") { color = "#e23434"; label = "Rejected"; }
  else if (status === "cancelled") { color = "#82909a"; label = "Cancelled"; }
  return `<span style="
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
  // ...existing list rendering and filters...
  // This part is unchanged from previous, so omit for brevity unless you need full copy.
  // On row click, call showCompletedTransferDetail(...)
  // See previous code blocks for that part
  // (Retain filters/search/pill styles).
}

function showCompletedTransferDetail(container, user, t, onBack) {
  // Compute accepted/rejected details
  let statusDetails = "";
  if (t.status === "rejected") {
    if (t.from_user_status === "rejected") statusDetails = `Rejected by ${escapeHtml(t.from_name)}`;
    else if (t.to_user_status === "rejected") statusDetails = `Rejected by ${escapeHtml(t.to_name)}`;
  } else if (t.status === "accepted") {
    let accepted = [];
    if (t.from_user_status === "accepted") accepted.push(escapeHtml(t.from_name));
    if (t.to_user_status === "accepted") accepted.push(escapeHtml(t.to_name));
    if (accepted.length === 1) statusDetails = `Accepted by ${accepted[0]}`;
    // if both, no need to show
  }

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
        <b>Transfer Reference No.:</b> <span style="font-weight:400;">${escapeHtml(t.transfer_id)}</span>
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
      <div style="font-size:1.01em;color:#555;margin:8px 0 2px 0;"><b>Date:</b> ${formatDateWithWeekday(t.created_at)}</div>
      ${t.remarks ? `<div style="margin-top:11px;font-size:1.01em;"><b>Remarks:</b> <span style="font-weight:400;">${escapeHtml(t.remarks)}</span></div>` : ""}
      ${statusDetails ? `<div style="margin-top:11px;font-size:1.01em;color:#954;"><b>${statusDetails}</b></div>` : ""}
    </div>
  `;
  container.querySelector("#complete-back-btn").onclick = onBack;
}
