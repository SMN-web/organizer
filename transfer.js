// --- Utility modal, identical to your current modal utility
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
  if (showCancel) modal.querySelector('#modal-cancel').onclick = () => { close(); onCancel && onCancel(); };
  modal.querySelector('#modal-ok').onclick = () => { close(); onOk && onOk(); };
  function close() { modal.remove(); }
}

export async function showTransferPopup(container, user, defaultSelectedFriendUsername = "") {
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

  // Sort friends by name
  friends = friends.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Modal markup with individual search per select, default selection supported
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal transfer-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h3>Create Transfer</h3>
      <div class="modal-row">
        <label>From:</label>
        <div style="flex:1">
          <input id="fromSearch" type="text" placeholder="Search..." autocomplete="off" style="margin-bottom:5px;width:100%;"/>
          <select id="fromSelect" style="width:100%"></select>
        </div>
        <span id="fromUsernameTag" class="username-tag"></span>
      </div>
      <div class="modal-row">
        <label>To:</label>
        <div style="flex:1">
          <input id="toSearch" type="text" placeholder="Search..." autocomplete="off" style="margin-bottom:5px;width:100%;"/>
          <select id="toSelect" style="width:100%"></select>
        </div>
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

  // DOM refs
  const fromSearch = modal.querySelector('#fromSearch');
  const toSearch = modal.querySelector('#toSearch');
  const fromSelect = modal.querySelector('#fromSelect');
  const toSelect = modal.querySelector('#toSelect');
  const fromUsernameTag = modal.querySelector('#fromUsernameTag');
  const toUsernameTag = modal.querySelector('#toUsernameTag');
  const amountInput = modal.querySelector('#amountInput');
  const errorRow = modal.querySelector('.error-row');
  const transferBtn = modal.querySelector('#transferBtn');
  const cancelBtn = modal.querySelector('#cancelBtn');
  const closeBtn = modal.querySelector('.modal-close');

  let fromSearchVal = "", toSearchVal = "";

  function showError(msg) { errorRow.textContent = msg; }
  function resetError() { errorRow.textContent = ""; }

  function filteredFriends(val) {
    const s = val.trim().toLowerCase();
    return !s ? friends :
      friends.filter(f => (f.name || '').toLowerCase().includes(s) || (f.username || '').toLowerCase().includes(s));
  }

  function renderSelect(selectEl, filtered, selected, otherSelected) {
    selectEl.innerHTML = `<option value="">Select Friend</option>` +
      filtered.map(f => `<option value="${f.username}"${otherSelected === f.username ? " disabled style='color:#bbb;'" : ""}>${f.name}</option>`).join('');
    selectEl.value = filtered.some(f => f.username === selected) && selected !== otherSelected ? selected : "";
  }

  function updateUsernameTags() {
    fromUsernameTag.textContent = fromSelect.value ? `@${fromSelect.value}` : "";
    toUsernameTag.textContent = toSelect.value ? `@${toSelect.value}` : "";
  }

  function rerenderDropdowns() {
    renderSelect(fromSelect, filteredFriends(fromSearchVal), fromSelect.value, toSelect.value);
    renderSelect(toSelect, filteredFriends(toSearchVal), toSelect.value, fromSelect.value);
    updateUsernameTags();
  }
  fromSearch.oninput = () => { fromSearchVal = fromSearch.value; rerenderDropdowns(); };
  toSearch.oninput = () => { toSearchVal = toSearch.value; rerenderDropdowns(); };
  fromSelect.onchange = rerenderDropdowns;
  toSelect.onchange = rerenderDropdowns;

  transferBtn.onclick = () => {
    resetError();
    const fromUser = fromSelect.value;
    const toUser = toSelect.value;
    const amountStr = amountInput.value;
    const amount = Number(amountStr);
    if (!fromUser || !toUser) return showError("Select both 'From' and 'To' friends.");
    if (fromUser === toUser) return showError("From and To friends cannot be the same.");
    if (!amountStr || isNaN(amount) || amount <= 0) return showError("Enter a valid positive amount.");

    showModal({
      title: "Confirm Transfer",
      content: `You are transferring <b>${amount}</b> from <b>${(friends.find(f=>f.username===fromUser)?.name || fromUser)}</b> <span class="username-tag">@${fromUser}</span>
                to <b>${(friends.find(f=>f.username===toUser)?.name || toUser)}</b> <span class="username-tag">@${toUser}</span>.`,
      okText: "OK"
    });
    setTimeout(() => modal.remove(), 350);
  };

  closeBtn.onclick = () => modal.remove();
  cancelBtn.onclick = () => modal.remove();

  // Initialize selection: pre-select from/to if requested
  fromSearchVal = ""; toSearchVal = "";
  rerenderDropdowns();

  // Set default selection (optional, only if passed and user is in friend list)
  if (defaultSelectedFriendUsername && friends.some(f => f.username === defaultSelectedFriendUsername)) {
    toSelect.value = defaultSelectedFriendUsername;
    updateUsernameTags();
  }
  setTimeout(() => fromSearch.focus(), 80);
}
