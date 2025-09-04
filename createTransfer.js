export async function showCreateTransfer(user) {
  // Fetch friends from API (mock/demo)
  const friendsList = await fetchFriends(user);

  // Create modal HTML
  let modal = document.createElement('div');
  modal.className = 'create-transfer-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Create Transfer</h3>
      <div>
        <label>From Friend:</label>
        <select id="transferFromSelect">
          <option value="">Select friend</option>
          ${friendsList.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>To Friend:</label>
        <select id="transferToSelect">
          <option value="">Select friend</option>
          ${friendsList.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label>Amount:</label>
        <input type="number" id="transferAmountInput" min="0.01" step="0.01" placeholder="Enter amount">
      </div>
      <div id="transferError" class="input-error"></div>
      <button id="transferSubmitBtn" class="primary-btn">Transfer</button>
      <button id="transferCancelBtn" class="secondary-btn">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Cancel closes modal
  modal.querySelector('#transferCancelBtn').onclick = () => {
    modal.remove();
  };

  // Transfer logic
  modal.querySelector('#transferSubmitBtn').onclick = () => {
    const fromId = modal.querySelector('#transferFromSelect').value;
    const toId = modal.querySelector('#transferToSelect').value;
    const amt = parseFloat(modal.querySelector('#transferAmountInput').value);
    const errorDiv = modal.querySelector('#transferError');
    errorDiv.textContent = "";

    if (!fromId || !toId || fromId === toId) {
      errorDiv.textContent = "Select two different friends.";
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      errorDiv.textContent = "Enter a valid amount above zero.";
      return;
    }

    // (Demo) Show success and close modal
    errorDiv.textContent = "";
    modal.querySelector('#transferSubmitBtn').disabled = true;
    setTimeout(() => {
      alert(`Transfer initiated from ${fromId} to ${toId}, amount: ${amt}`);
      modal.remove();
    }, 800);

    // (Real) Post to your backend API with user and firebase token (add your logic here)
  };
}

// Demo friends fetcher (replace with real API call)
async function fetchFriends(user) {
  // Simulate fetch delay & return demo list
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: "alice", name: "Alice" },
        { id: "bob", name: "Bob" },
        { id: "charlie", name: "Charlie" }
      ]);
    }, 500);
  });
}
