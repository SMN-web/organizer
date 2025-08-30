// createdByMe.js
import { showSpinner, hideSpinner } from './spinner.js';

export function showCreatedByMePanel(container, user) {
  container.innerHTML = `<div class="loading-block" style="padding:25px;text-align:center;"></div>`;
  const loadingDiv = container.querySelector('.loading-block');
  showSpinner(loadingDiv);

  // Fetch spends created by this user
  user.firebaseUser.getIdToken().then(token => {
    fetch('https://not-li.nafil-8895-s.workers.dev/api/spends/created-by-me', {
      headers: { Authorization: "Bearer " + token }
    })
      .then(r => r.json())
      .then(spends => {
        hideSpinner(loadingDiv);
        if (!spends || spends.length === 0) {
          container.innerHTML = `<div style="margin:44px 0 28px 0;text-align:center;color:#657;">No spends created by you yet.</div>`;
          return;
        }
        // Render spends table/list
        container.innerHTML = `
          <table class="created-spends-table" style="margin:auto;width:96%;max-width:720px;">
            <thead>
              <tr>
                <th>Date</th>
                <th>Remarks</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        `;
        const tbody = container.querySelector('tbody');
        spends.forEach(sp => {
          const statusBadge = sp.status === "disputed" ?
            `<span style="color:#c0392b;font-weight:600;">Disputed</span>` :
            sp.status === "accepted" ?
              `<span style="color:#27ae60;font-weight:600;">Accepted</span>` :
              `<span style="color:#607D8B;font-weight:600;">Pending</span>`;
          const actions = sp.status === "disputed"
            ? `<button class="edit-created-spend-btn" data-id="${sp.spend_id}" style="margin:0 6px;padding:3px 16px;">Edit</button>`
            : '';
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${sp.date}</td>
            <td>${escapeHtml(sp.remarks)}</td>
            <td>${sp.total_amount}</td>
            <td>${statusBadge}</td>
            <td>${actions}</td>
          `;
          tbody.appendChild(tr);
        });
        // Edit button handler
        container.querySelectorAll('.edit-created-spend-btn').forEach(btn => {
          btn.onclick = () => {
            const spendId = btn.dataset.id;
            showEditCreatedSpendDialog(container, spendId, user);
          };
        });
      })
      .catch(() => {
        hideSpinner(loadingDiv);
        container.innerHTML = `<div style="margin:50px 0;color:#b11;text-align:center;">Failed to load your created spends.</div>`;
      });
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

// Placeholder edit dialog for now
function showEditCreatedSpendDialog(container, spendId, user) {
  container.innerHTML = `
    <div style="padding:38px 0 24px 0;margin:0 auto;max-width:420px;text-align:center;">
      <div style="font-size:1.08em;font-weight:500;color:#316;">
        <span style="font-size:2em;">🛠️</span><br>
        Here you will be able to <b>edit participants, shares, paid, date, remarks, and redistribute the amount</b> for your expense.<br>
        Any change will reset all previous approvals and shares.
      </div>
      <div style="margin-top:28px;">
        <button style="padding:8px 32px;font-size:1.11em;" onclick="location.reload()">Go Back</button>
      </div>
    </div>
  `;
}

