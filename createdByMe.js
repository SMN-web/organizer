const CURRENCY = localStorage.getItem('currency') || "QAR";

// Helpers (unchanged)
function parseDBDatetimeAsUTC(dt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return new Date(dt);
  return new Date(Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
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
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(d, 10)}-${months[parseInt(m, 10) - 1]}-${y.slice(2)}`;
}
function rup(val) { return Math.ceil(Number(val) || 0); }
function todayDate() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Approval Branch Helper (now class-based for all style)
function approvalBranchHTML(creator, rows) {
  return `
  <div>
    <div class="approval-branch-creator">
      ${escapeHtml(creator)}
    </div>
    <div class="approval-branch-timelinewrap">
      <div class="approval-branch-timeline"></div>
      <div>
      ${rows.map(r => `
        <div class="approval-branch-row approval-status-${r.status}">
          <div class="approval-branch-conn"></div>
          <span class="approval-branch-name">${escapeHtml(r.name)}</span>
          <span class="approval-branch-stat">${r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span>
          ${(r.status !== "pending" && r.timestamp)
            ? `<span class="approval-branch-ts">${timeAgo(r.timestamp)}</span>` : ""}
        </div>
      `).join('\n')}
      </div>
    </div>
  </div>
  `;
}

// Main entry point
export async function showCreatedByMePanel(container, user) {
  container.innerHTML = '<div class="cbme-loading"><span class="spinner"></span> Loading...</div>';
  let spendsData = [];
  let errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      container.innerHTML = `<div class="cbme-error">You must be logged in.</div>`;
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
  if (errMsg) {
    container.innerHTML = `<div class="cbme-title">Created By Me</div>
      <div class="cbme-error">${escapeHtml(errMsg)}</div>`;
    return;
  }
  renderSpendsArea(container, user, spendsData);
}

function renderSpendsArea(container, user, spendsData) {
  container.innerHTML = `
    <div class="cbme-title">Created By Me</div>
    <div class="createdbyme-folder-list"></div>
  `;
  const listArea = container.querySelector('.createdbyme-folder-list');
  if (!spendsData.length) {
    listArea.innerHTML = `<div class="cbme-empty">No spends created by you yet.</div>`;
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
    row.innerHTML = `
      <span class="sn">${item.sn}.</span>
      <div class="approval-main">
        <div class="remarks">${escapeHtml(item.remarks || "")}</div>
        <div class="date">${formatDisplayDate(item.date || "")}</div>
        <div class="by">by You</div>
      </div>
      ${statusHtml}
    `;
    row.onclick = () => showCreatedByMeDetails(container, user, item);
    row.onmouseover = () => row.classList.add('hovered');
    row.onmouseout = () => row.classList.remove('hovered');
    listArea.appendChild(row);
  });
}

// ...rest of your business logic remains unchanged, but remove all `style="..."`
// For every `<span style="color:#d12020;">...` or similar, use a class instead;
// for every custom margin, background, color, etc., use a descriptive className.

