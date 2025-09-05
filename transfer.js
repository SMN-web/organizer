// Demo-only transfer popup with friend selection and amount validation

export async function showTransferPopup(container, user) {
  // DEMO: PRETEND FRIENDS LIST (replace with fetch if needed)
  // friends = [{ username, name, initials }]
  const friends = [
    { username: "shyam", name: "Shyam", initials: "SH" },
    { username: "bala", name: "Bala", initials: "BA" },
    { username: "rafi", name: "Rafi", initials: "RA" }
  ];

  // Modal base
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
          ${friends.map(f => `<option value="${f.username}">${f.name} (${f.initials})</option>`).join('')}
        </select>
      </div>
      <div class="modal-row">
        <label>To:</label>
        <select id="toSelect">
          <option value="">Select Friend</option>
          ${friends.map(f => `<option value="${f.username}">${f.name} (${f.initials})</option>`).join('')}
        </select>
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

  const fromSelect = modal.querySelector('#fromSelect');
  const toSelect = modal.querySelector('#toSelect');
  const amountInput = modal.querySelector('#amountInput');
  const errorRow = modal.querySelector('.error-row');
  const transferBtn = modal.querySelector('#transferBtn');
  const closeBtn = modal.querySelector('.modal-close');
  const cancelBtn = modal.querySelector('#cancelBtn');

  function showError(msg) { errorRow.textContent = msg; }
  function resetError() { errorRow.textContent = ""; }

  function updateSelects() {
    // Reset disables
    for (const opt of toSelect.options) opt.disabled = false;
    for (const opt of fromSelect.options) opt.disabled = false;
    const fromVal = fromSelect.value;
    const toVal = toSelect.value;
    if (fromVal) {
      for (const opt of toSelect.options)
        if (opt.value === fromVal && opt.value !== "") {
          opt.disabled = true;
          opt.style.color = "#bbb";
        } else if (opt.value !== "") {
          opt.style.color = "";
        }
    }
    if (toVal) {
      for (const opt of fromSelect.options)
        if (opt.value === toVal && opt.value !== "") {
          opt.disabled = true;
          opt.style.color = "#bbb";
        } else if (opt.value !== "") {
          opt.style.color = "";
        }
    }
  }

  fromSelect.addEventListener('change', updateSelects);
  toSelect.addEventListener('change', updateSelects);

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

    // DEMO ONLY: Simulate success, show OK message
    showError("");
    setTimeout(() => {
      alert(`(DEMO) Would submit transfer:\nFrom: ${fromUser}\nTo: ${toUser}\nAmount: ${amount}`);
      modal.remove();
    }, 200);
  };

  closeBtn.onclick = () => modal.remove();
  cancelBtn.onclick = () => modal.remove();

  setTimeout(() => fromSelect.focus(), 60);
}
