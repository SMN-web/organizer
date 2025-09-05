export async function showTransferPopup(container, user) {
  // 1. Fetch actual friend list from backend (using Firebase JWT)
  let friends = [];
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') throw new Error("Not logged in");
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://tr-am.nafil-8895-s.workers.dev/api/friends/list', {
      headers: { Authorization: "Bearer " + token }
    });
    friends = await resp.json();
    if (!Array.isArray(friends) || friends.length < 2) throw new Error("At least two friends required to create a transfer.");
  } catch (e) {
    alert(e.message || e);
    return;
  }

  // 2. Modal UI (no CSS here, classes only)
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal transfer-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h3>Create Transfer</h3>
      <div class="modal-row">
        <label>From:</label>
        <select id="fromSelect">
          <option value="">Select Friend</option>
          ${friends.map(f => `<option value="${f.username}">${f.name}</option>`).join('')}
        </select>
        <span id="fromUsernameTag" class="username-tag"></span>
      </div>
      <div class="modal-row">
        <label>To:</label>
        <select id="toSelect">
          <option value="">Select Friend</option>
          ${friends.map(f => `<option value="${f.username}">${f.name}</option>`).join('')}
        </select>
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
  const fromSelect = modal.querySelector('#fromSelect');
  const toSelect = modal.querySelector('#toSelect');
  const fromUsernameTag = modal.querySelector('#fromUsernameTag');
  const toUsernameTag = modal.querySelector('#toUsernameTag');
  const amountInput = modal.querySelector('#amountInput');
  const errorRow = modal.querySelector('.error-row');
  const transferBtn = modal.querySelector('#transferBtn');
  const cancelBtn = modal.querySelector('#cancelBtn');
  const closeBtn = modal.querySelector('.modal-close');

  function showError(msg) { errorRow.textContent = msg; }
  function resetError() { errorRow.textContent = ""; }

  function updateTags() {
    const fromUser = fromSelect.value;
    const toUser = toSelect.value;
    fromUsernameTag.textContent = fromUser ? `@${fromUser}` : "";
    toUsernameTag.textContent = toUser ? `@${toUser}` : "";
  }
  fromSelect.addEventListener('change', updateTags);
  toSelect.addEventListener('change', updateTags);

  function updateSelects() {
    for (let opt of toSelect.options) opt.disabled = false;
    for (let opt of fromSelect.options) opt.disabled = false;
    const fromVal = fromSelect.value;
    const toVal = toSelect.value;
    if (fromVal) for (let opt of toSelect.options)
      if (opt.value === fromVal) { opt.disabled = true; opt.style.color="#bbb"; }
      else opt.style.color="";
    if (toVal) for (let opt of fromSelect.options)
      if (opt.value === toVal) { opt.disabled = true; opt.style.color="#bbb"; }
      else opt.style.color="";
  }
  fromSelect.addEventListener('change', () => { updateTags(); updateSelects(); });
  toSelect.addEventListener('change', () => { updateTags(); updateSelects(); });

  transferBtn.onclick = () => {
    resetError();
    const fromUser = fromSelect.value;
    const toUser = toSelect.value;
    const amountStr = amountInput.value;
    const amount = Number(amountStr);

    if (!fromUser || !toUser) {
      showError("Select both 'From' and 'To' friends.");
      return;
    }
    if (fromUser === toUser) {
      showError("From and To friends cannot be the same.");
      return;
    }
    if (!amountStr || isNaN(amount) || amount <= 0) {
      showError("Enter a valid positive amount.");
      return;
    }
    // DEMO: Confirmation
    showError("");
    setTimeout(() => {
      alert(`You are transferring ${amount} from ${friends.find(f=>f.username===fromUser).name} (@${fromUser}) to ${friends.find(f=>f.username===toUser).name} (@${toUser}).`);
      modal.remove();
    }, 200);
  };

  closeBtn.onclick = () => modal.remove();
  cancelBtn.onclick = () => modal.remove();

  // Init display on open
  updateTags();
  updateSelects();
  setTimeout(() => fromSelect.focus(), 60);
}
