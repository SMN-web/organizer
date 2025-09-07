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
    const resp = await fetch('https://your-api.example.com/api/transfers/ongoing', {
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
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.05em;margin-bottom:7px;">Ongoing Transfers</div>
    <div class="transfer-folder-list"></div>
  `;

  const listArea = container.querySelector('.transfer-folder-list');
  if (!transfers.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      There are no ongoing transfers at the moment.
    </div>`;
    return;
  }

  transfers.forEach((t, idx) => {
    // Determine if the current user needs to take action (approve/reject/cancel)
    // For demo: show action button if user is 'from_user' or 'to_user' and status pending
    const awaitingAction = (t.awaitingAction && t.status === 'pending');
    const row = document.createElement("div");
    row.className = "transfer-folder";
    row.tabIndex = 0;
    row.style = `display:flex;align-items:flex-start;gap:11px;
      padding:10px 7px 11px 7px;
      border-bottom:1px solid #eee;font-size:1em;cursor:pointer;transition:background 0.2s;background:#fff;`;

    row.innerHTML = `
      <div class="transfer-main" style="flex:1;">
        <div style="font-weight:600;font-size:1.05em;color:#193883">
          ${escapeHtml(t.sender_name)} 
          <span style="font-weight:400;color:#111;">initiated a transfer of</span>
          <span style="font-weight:800; color:#12151d;">${escapeHtml(t.amount)} ${escapeHtml(t.currency || CURRENCY)}</span>
          <span style="color:#222;font-weight:500;">from</span>
          <b>${escapeHtml(t.from_name)}</b>
          <span style="color:#222;font-weight:500;">to</span>
          <b>${escapeHtml(t.to_name)}</b>
        </div>
        ${t.status === "pending"
          ? `<div style='color:#d29a07;font-weight:600;font-size:1em;padding-top:4px;'>Awaiting your confirmation.</div>`
          : `<div style='color:#9a9ab3;font-weight:600;font-size:1em;padding-top:4px;'>${escapeHtml(t.status_label||t.status)}</div>`
        }
        <div style="color:#8a93a8;font-size:0.98em;margin-top:4px;">
          ${timeAgo(t.created_at)}
        </div>
      </div>
      <div class="transfer-actions" style="display:flex;flex-direction:column;gap:7px;">
        ${awaitingAction ? `
          <button class="transfer-accept-btn" data-id="${t.transfer_id}" style="background:#e7f6ea;color:#13a568;padding:6px 17px;font-size:1em; border:1.2px solid #13a568;border-radius:7px;cursor:pointer;font-weight:700;">Accept</button>
          <button class="transfer-reject-btn" data-id="${t.transfer_id}" style="background:#ffecec;color:#d73323;padding:6px 17px;font-size:1em; border:1.2px solid #d73323;border-radius:7px;cursor:pointer;font-weight:700;">Reject</button>
          <button class="transfer-cancel-btn" data-id="${t.transfer_id}" style="background:#f7f9fa;color:#467;border:1.2px solid #bbc;padding:6px 17px;font-size:1em;border-radius:7px;cursor:pointer;font-weight:700;">Cancel</button>
        ` : ""}
      </div>
    `;
    // Add your button event handlers here...
    listArea.appendChild(row);
  });

}
