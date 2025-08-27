const FRIENDS = [
  { id: 'me', name: 'Me' }, 
  { id: 'b', name: 'B' }, 
  { id: 'c', name: 'C' }, 
  { id: 'd', name: 'D' }, 
  { id: 'e', name: 'E' }
];

function getFriendById(id) { return FRIENDS.find(f => f.id === id); }

export function showNewSpend(container) {
  container.innerHTML = `
    <div class="friend-select-group">
      <span class="selector-label">Friends Sharing:</span>
      <input type="text" class="selector-search friend-search" placeholder="Search friends..." />
      <div class="selector-list friend-selector"></div>
      <div class="chosen-list chosen-friends"></div>
    </div>
    <div class="paidby-select-group">
      <span class="selector-label">Paid By:</span>
      <select class="paidby-select"></select>
    </div>
    <div class="amount-area">
      <span class="amount-label">Amount Paid (QAR):</span>
      <input type="number" min="0.01" step="0.01" class="amount-input" placeholder="Enter amount" />
    </div>
    <button type="button" class="primary-btn calc-btn">Calculate</button>
    <div class="custom-msg"></div>
  `;

  let selectedFriends = [];
  let paidBy = "";
  const friendsListDiv = container.querySelector('.friend-selector');
  const chosenDiv = container.querySelector('.chosen-friends');
  const friendSearch = container.querySelector('.friend-search');

  // -- Friend List Render/Selection --
  function renderFriendsList() {
    const filter = friendSearch.value.toLowerCase();
    friendsListDiv.innerHTML = "";
    FRIENDS.filter(f => f.name.toLowerCase().includes(filter)).forEach(f => {
      let isSelected = selectedFriends.includes(f.id);
      friendsListDiv.innerHTML += `<div class="selector-item${isSelected ? ' selected' : ''}" data-id="${f.id}">${f.name}</div>`;
    });
    friendsListDiv.querySelectorAll('.selector-item').forEach(item => {
      item.onclick = () => {
        let id = item.dataset.id;
        if (selectedFriends.includes(id)) return;
        selectedFriends.push(id);
        selectedFriends = selectedFriends.sort((a, b) => a === 'me' ? -1 : b === 'me' ? 1 : 0);
        renderFriendsList();
        renderChosen();
        renderPaidBy();
        validateFields();
      };
    });
  }
  // -- Chips UI for Selected Friends --
  function renderChosen() {
    chosenDiv.innerHTML = selectedFriends.map(id => {
      return `<span class="chosen-chip">${getFriendById(id).name}
                <button class="remove-chip" data-id="${id}" title="Remove">&#10060;</button>
              </span>`;
    }).join('');
    chosenDiv.querySelectorAll('.remove-chip').forEach(btn => {
      btn.onclick = () => {
        let id = btn.dataset.id;
        selectedFriends = selectedFriends.filter(fId => fId !== id);
        if (paidBy === id) paidBy = "";
        renderFriendsList();
        renderChosen();
        renderPaidBy();
        validateFields();
      };
    });
  }
  friendSearch.oninput = renderFriendsList;
  renderFriendsList();
  renderChosen();

  // -- Paid By Dropdown --
  function renderPaidBy() {
    const select = container.querySelector('.paidby-select');
    select.innerHTML = "";
    selectedFriends.forEach(id => {
      let opt = document.createElement('option');
      opt.value = id;
      opt.textContent = getFriendById(id).name;
      select.appendChild(opt);
    });
    select.value = paidBy || (selectedFriends.length ? selectedFriends[0] : "");
    select.onchange = () => {
      paidBy = select.value;
      validateFields();
    };
    paidBy = select.value;
  }
  renderPaidBy();

  // -- Amount Field --
  const amountInput = container.querySelector('.amount-input');
  amountInput.oninput = validateFields;

  // -- Calculate Button --
  const calcBtn = container.querySelector('.calc-btn');
  const msgBox = container.querySelector('.custom-msg');
  calcBtn.onclick = () => {
    // Validate: at least 2 friends, "Me" included, amount, paidBy
    if (selectedFriends.length < 2 || !selectedFriends.includes("me")) {
      msgBox.textContent = "Please select at least two friends including yourself.";
      return;
    }
    if (!paidBy) {
      msgBox.textContent = "Select who paid.";
      return;
    }
    if (!(parseFloat(amountInput.value) > 0)) {
      msgBox.textContent = "Enter a valid amount paid.";
      return;
    }
    // Success
    msgBox.textContent = "Ready to distribute and save!";
    msgBox.style.color = "#219d53";
    // Optionally proceed with distribution logic here...
    // (e.g. call next step, enable editing distribution, show save button, etc.)
  };

  // -- Validation --
  function validateFields() {
    msgBox.textContent = "";
  }
}
