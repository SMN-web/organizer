import { showSpinner, hideSpinner, delay } from './spinner.js';

function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [full] = dateStr.split(' ');
  const [y, m, d] = full.split('-');
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(d,10)}-${months[parseInt(m,10)-1]}-${y.slice(2)}`;
}

export function showCreatedByMePanel(container, user) {
  container.innerHTML = `<div class="loading-block" style="padding:25px;text-align:center;"></div>`;
  const loadingDiv = container.querySelector('.loading-block');
  showSpinner(loadingDiv);

  user.firebaseUser.getIdToken().then(token => {
    fetch('https://cr-me.nafil-8895-s.workers.dev/api/spends/created-by-me', {
      headers: { Authorization: "Bearer " + token }
    })
      .then(r => r.json())
      .then(spends => {
        hideSpinner(loadingDiv);
        if (!spends || spends.length === 0) {
          container.innerHTML = `<div style="margin:36px 0 20px 0;text-align:center;color:#657;">No spends created by you yet.</div>`;
          return;
        }
        container.innerHTML = `
          <div style="font-weight:600;font-size:1.01em;margin-bottom:7px;">Created By Me</div>
          <div class="createdbyme-folder-list"></div>
        `;
        const listArea = container.querySelector('.createdbyme-folder-list');
        spends.forEach(item => {
          const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
          const total = item.involvedStatus.length;
          const statusHtml = item.status === 'disputed'
            ? `<span class="status-pill disputed">Disputed</span>`
            : `<span class="status-pill pending">${item.status === "accepted" ? "Accepted" : "Pending"} ${accepted}/${total}</span>`;
          const row = document.createElement("div");
          row.className = "approval-folder";
          row.tabIndex = 0;
          row.style = `display:flex;align-items:flex-start;gap:11px;
            padding:9px 7px 10px 7px;
            border-bottom:1px solid #eee;font-size:0.97em;cursor:pointer;transition:background 0.2s;`;
          row.innerHTML = `
            <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:6px;">${item.sn}.</span>
            <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
              <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:2.5px;">${escapeHtml(item.remarks||"")}</div>
              <div class="date" style="color:#566b89;font-size:0.95em;">${formatDisplayDate(item.date||"")}</div>
              <div class="by" style="color:#209;font-size:0.93em;">by You</div>
            </div>
            ${statusHtml}
          `;
          row.onclick = () => showCreatedByMeDetail(container, user, item);
          row.onmouseover = () => row.style.backgroundColor = '#f8f9fa';
          row.onmouseout = () => row.style.backgroundColor = '';
          listArea.appendChild(row);
        });
      })
      .catch(() => {
        hideSpinner(loadingDiv);
        container.innerHTML = `<div style="margin:40px 0;color:#b11;text-align:center;">Failed to load your created spends.</div>`;
      });
  });
}

function showCreatedByMeDetail(container, user, item) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <button id="backBtn" style="background:none;border:1px solid #ddd;border-radius:7px;padding:6px 14px;cursor:pointer;display:flex;align-items:center;gap:7px;font-size:0.96em;">← Back</button>
      <h3 style="margin:0;font-weight:600;font-size:1.07em;color:#1b2837;">Your Expense</h3>
      <div></div>
    </div>
    <div id="detailArea"></div>
  `;
  container.querySelector('#backBtn').onclick = function() {
    showCreatedByMePanel(container, user);
  };
  const detailArea = container.querySelector('#detailArea');
  detailArea.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="font-weight:700;font-size:1em;color:#1b2837;">${escapeHtml(item.remarks)}</div>
      <div style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
      <div style="font-size:0.99em;color:#222;">Total: <span style="font-weight:700;">${item.total_amount} QAR</span></div>
      <div style="color:#888;font-size:0.96em; margin-bottom:3px;">Status last updated: <b>${item.status_at}</b></div>
    </div>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#164fa4;">Paid/Shares</div>
    <table style="border-collapse:collapse;width:auto;margin-bottom:9px;">
      ${item.splits.map(s => `
        <tr>
          <td style="padding:2px 12px 2px 0; color:#221;font-weight:600;min-width:5em;">${escapeHtml(s.name)}:</td>
          <td style="padding:2px 10px; color:#222;">paid <span style="font-weight:700;color:#222">${s.paid} QAR</span></td>
          <td style="padding:2px 5px; color:#567;">share <span style="font-weight:700;color:#222">${s.share} QAR</span></td>
        </tr>
      `).join('')}
    </table>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#23875e;">Settlements</div>
    <table style="border-collapse:collapse;margin-bottom:8px;">
      ${item.settlements.length
        ? item.settlements.map(st => `
          <tr>
            <td style="padding:2px 10px 2px 0; color:#555;min-width:8em;text-align:right;">
              ${escapeHtml(st.from)}
            </td>
            <td style="padding:2px 2px; color:#888;width:24px;text-align:center;">
              <span style="font-size:1.12em;">&#8594;</span>
            </td>
            <td style="padding:2px 9px 2px 0; color:#333;">
              ${escapeHtml(st.to)}: <span style="font-weight:700;color:#222">${st.amount} QAR</span>
            </td>
          </tr>
        `).join('')
        : '<tr><td>No settlements needed</td></tr>'}
    </table>
    ${(item.status === "disputed")
      ? `<button id="editBtn" style="margin-top:17px; padding:8px 24px; font-size:1em; border-radius:8px; background:#2268c5; color:#fff; border:none; font-weight:600;">Edit Expense</button>`
      : ""}
  `;
  if (item.status === "disputed") {
    detailArea.querySelector('#editBtn').onclick = () => showEditCreatedSpend(container, user, item);
  }
}

// Placeholder for edit – drop in your real editor here
function showEditCreatedSpend(container, user, item) {
  container.innerHTML = `
    <div style="padding:32px 0 22px 0;text-align:center;">
      <div style="font-size:1.01em;font-weight:500;color:#316;">
        <span style="font-size:2em;">🛠️</span>
        <br>
        Use your newSpend.js split UI here. This should allow editing participants, shares, locks, paid, date, remarks, etc.
        <br><br>
        On save, POST to <b>/api/spends/edit-save</b> as documented.
        <br>
        <i>(Replace this with your real edit form!)</i>
      </div>
      <div style="margin-top:18px;">
        <button style="padding:6px 26px;font-size:1em;" onclick="location.reload()">Go Back</button>
      </div>
    </div>
  `;
}
