// Util: Show modal with your app's consistent UI
function showModal({ title, content, okText = "OK", onOk, showCancel = false, cancelText = "Cancel", onCancel }) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal transfer-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      ${title ? `<h3>${title}</h3>` : ""}
      <div style="margin:1em 0;line-height:1.55;">${content || ''}</div>
      <div class="modal-btn-row">
        ${showCancel ? `<button class="modal-btn modal-btn-alt" id="modal-cancel">${cancelText}</button>` : ''}
        <button class="modal-btn" id="modal-ok">${okText}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.modal-close').onclick = close;
  if (showCancel) modal.querySelector('#modal-cancel').onclick = () => { close(); if (onCancel) onCancel(); };
  modal.querySelector('#modal-ok').onclick = () => { close(); onOk && onOk(); };
  function close() { modal.remove(); }
}

// Main Transfer Modal
export async function showTransferPopup(container, user) {
  let friends = [];
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') throw new Error("Not logged in");
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://tr-am.nafil-8895-s.workers.dev/api/friends/list', {
      headers: { Authorization: "Bearer " + token }
    });
    friends = await resp.json();
    if (!Array.isArray(friends) || friends.length < 2)
      throw new Error("You need at least two friends to create a transfer.");
  } catch (e) {
    showModal({
      title: "Transfer Not Available",
      content: e.message || e,
      okText: "OK",
      showCancel: false
    });
    return;
  }

  // Sort friends by name ascending
  friends = friends.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Modal markup with search support
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal transfer-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h3>Create Transfer</h3>
      <div class="modal-row">
        <label>Search:</label>
        <input id="friendSearchInput" type="text" placeholder="Type to search..." autocomplete="off" style="flex:2;max-width:200px;" />
      </div>
      <div class="modal-row">
        <label>From:</label>
        <select id="fromSelect"></select>
        <span id="fromUsernameTag" class="username-tag"></span>
      </div>
      <div class="modal-row">
        <label>To:</label>
        <select id="toSelect"></select>
        <span id="toUsernameTag" class="username-tag"></span>
      </div>
      <div class="modal-row">
        <label>Amount:</label>
        <input id="amountInput" type="number" min="1" placeholder="Amount" />
      </div>
      <div class="modal-row error-row" style="color:#d12020;min-height:20px;"></div>
      <div class="modal-btn-row">
        <button class="modal-btn" id="transferBtn">Transfer</button>
        <button class="modal-btn modal-btn-alt" id="cancelBtn" type="button">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // DOM references
  const closeBtn = modal.querySelector('.modal-close');
  const cancelBtn = modal.querySelector('#cancelBtn');
  const transferBtn = modal.querySelector('#transferBtn');
  const errorRow = modal.querySelector('.error-row');
  const fromSelect = modal.querySelector('#fromSelect');
  const toSelect = modal.querySelector('#toSelect');
  const fromUsernameTag = modal.querySelector('#fromUsernameTag');
  const toUsernameTag = modal.querySelector('#toUsernameTag');
  const amountInput = modal.querySelector('#amountInput');
  const friendSearchInput = modal.querySelector('#friendSearchInput');

  let search = "";

  function showError(msg) { errorRow.textContent = msg; }
  function resetError() { errorRow.textContent = ""; }

  // Filtering and rendering helpers
  function filtered() {
    const s = search.trim().toLowerCase();
    return !s ? friends : friends.filter(
      f => (f.name || '').toLowerCase().includes(s) || (f.username || '').toLowerCase().includes(s)
    );
  }
  function renderSelects() {
    const list = filtered();
    // Last chosen values to preserve after rerender
    const lastFrom = fromSelect.value;
    const lastTo = toSelect.value;
    fromSelect.innerHTML = `<option value="">Select Friend</option>` +
      list.map(f => `<option value="${f.username}">${f.name}</option>`).join('');
    toSelect.innerHTML = `<option value="">Select Friend</option>` +
      list.map(f => `<option value="${f.username}">${f.name}</option>`).join('');
    fromSelect.value = list.find(f => f.username === lastFrom) ? lastFrom : "";
    toSelect.value = list.find(f => f.username === lastTo) ? lastTo : "";
    updateTags();
    updateDisables();
  }
  function updateTags() {
    // Update username badge
    fromUsernameTag.textContent = fromSelect.value ? `@${fromSelect.value}` : "";
    toUsernameTag.textContent = toSelect.value ? `@${toSelect.value}` : "";
  }
  function updateDisables() {
    const fromVal = fromSelect.value, toVal = toSelect.value;
    for (let opt of toSelect.options) {
      opt.disabled = fromVal && opt.value === fromVal;
      opt.style.color = opt.disabled && opt.value ? "#bbb" : "";
    }
    for (let opt of fromSelect.options) {
      opt.disabled = toVal && opt.value === toVal;
      opt.style.color = opt.disabled && opt.value ? "#bbb" : "";
    }
  }

  // Bindings
  friendSearchInput.oninput = () => { search = friendSearchInput.value; renderSelects(); };
  fromSelect.onchange = () => { updateTags(); updateDisables(); };
  toSelect.onchange = () => { updateTags(); updateDisables(); };

  transferBtn.onclick = () => {
    resetError();
    const fromUser = fromSelect.value;
    const toUser = toSelect.value;
    const amountStr = amountInput.value;
    const amount = Number(amountStr);
    if (!fromUser || !toUser) return showError("Select both 'From' and 'To' friends.");
    if (fromUser === toUser) return showError("From and To friends cannot be the same.");
    if (!amountStr || isNaN(amount) || amount <= 0) return showError("Enter a valid positive amount.");

    // Success confirmation (replace with real API for live)
    showModal({
      title: "Confirm Transfer",
      content: `You are transferring <b>${amount}</b> from <b>${(friends.find(f=>f.username===fromUser)?.name || fromUser)}</b> <span class="username-tag">@${fromUser}</span>
                to <b>${(friends.find(f=>f.username===toUser)?.name || toUser)}</b> <span class="username-tag">@${toUser}</span>.`,
      okText: "OK",
      showCancel: false
    });
    setTimeout(() => modal.remove(), 300); // removes input modal after confirmation
  };

  closeBtn.onclick = () => modal.remove();
  cancelBtn.onclick = () => modal.remove();

  // Initialize
  renderSelects();
  setTimeout(() => friendSearchInput.focus(), 80);
}
