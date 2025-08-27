// Demo friends for UX/testing
const FRIENDS = [
  { id: 'me', name: 'Me' }, 
  { id: 'b', name: 'B' }, 
  { id: 'c', name: 'C' }, 
  { id: 'd', name: 'D' }, 
  { id: 'e', name: 'E' }
];

function getFriendById(id) {
  return FRIENDS.find(f => f.id === id);
}

export function showNewSpend(container) {
  container.innerHTML = `
    <form class="entry-form">
      <label>Friends Sharing:
        <input type="text" class="friend-search" placeholder="Search friends..."/>
        <div class="friends-list"></div>
        <div class="selected-friends"></div>
      </label>
      <label>Paid By:
        <select class="paid-by-select"></select>
      </label>
      <label>Amount Paid (QAR):
        <input type="text" class="amount-input" readonly/>
        <button type="button" class="open-calc-btn">Calculator</button>
      </label>
      <div class="split-ui"></div>
      <button type="submit" class="primary-btn">Distribute & Save</button>
    </form>
  `;

  // --- Friend search and multi-select ---
  let selectedFriends = [];
  const friendsListDiv = container.querySelector('.friends-list');
  const selectedDiv = container.querySelector('.selected-friends');
  const friendSearch = container.querySelector('.friend-search');

  function renderFriendsList() {
    const filter = friendSearch.value.toLowerCase();
    friendsListDiv.innerHTML = "";
    FRIENDS.filter(f => f.name.toLowerCase().includes(filter)).forEach(f => {
      // "Me" is first, rest order unchanged
      let isSelected = selectedFriends.includes(f.id);
      friendsListDiv.innerHTML += `<div class="friend-list-item${isSelected ? ' selected' : ''}" data-id="${f.id}">${f.name}</div>`;
    });
    friendsListDiv.querySelectorAll('.friend-list-item').forEach(item => {
      item.onclick = () => {
        const id = item.dataset.id;
        if (selectedFriends.includes(id)) {
          selectedFriends = selectedFriends.filter(fId => fId !== id);
        } else {
          selectedFriends.push(id);
          // Always sort "me" first if present
          selectedFriends = selectedFriends.sort((a, b) => a === 'me' ? -1 : b === 'me' ? 1 : 0);
        }
        renderFriendsList();
        renderSelected();
        renderPaidBy();
        renderSplitUI();
      };
    });
  }
  function renderSelected() {
    selectedDiv.innerHTML = selectedFriends.map(id => {
      let f = getFriendById(id);
      return `<span class="friend-chip selected">${f.name}</span>`;
    }).join(' ');
  }
  friendSearch.oninput = renderFriendsList;
  renderFriendsList();
  renderSelected();

  // --- Paid By dropdown
  function renderPaidBy() {
    const select = container.querySelector('.paid-by-select');
    select.innerHTML = "";
    selectedFriends.forEach(id => {
      let f = getFriendById(id);
      let opt = document.createElement('option');
      opt.value = id;
      opt.textContent = f.name;
      select.appendChild(opt);
    });
    select.selectedIndex = 0;
  }
  renderPaidBy();

  // --- Calculator (no manual keyboard, only button input)
  let calcModalActive = false;
  const amountInput = container.querySelector('.amount-input');
  const openCalcBtn = container.querySelector('.open-calc-btn');
  openCalcBtn.onclick = () => {
    if (calcModalActive) return;
    calcModalActive = true;
    showCalculatorModal(container, (val) => {
      amountInput.value = Number(val).toFixed(2);
      calcModalActive = false;
      renderSplitUI();
    });
  };

  // --- Split Distribution UI
  let lockedShares = {};
  function renderSplitUI() {
    const splitDiv = container.querySelector('.split-ui');
    splitDiv.innerHTML = "";
    if (!selectedFriends.length || !amountInput.value) return;
    const totalAmount = parseFloat(amountInput.value) || 0;
    let lockedSum = Object.values(lockedShares).reduce((a, b) => a + (parseFloat(b) || 0), 0);
    let unlockedFriends = selectedFriends.filter(id => !lockedShares[id]);
    let autoShare = unlockedFriends.length ? (totalAmount - lockedSum) / unlockedFriends.length : 0;
    selectedFriends.forEach(id => {
      let value = lockedShares[id] || autoShare;
      splitDiv.innerHTML += `
        <div class="split-row">
          <span class="split-name">${getFriendById(id).name}</span>
          <input type="number" step="0.01" class="split-amount" value="${Number(value).toFixed(2)}" data-id="${id}"${lockedShares[id] ? ' disabled' : ''}>
          ${lockedShares[id]
            ? `<span class="split-locked">&#128274;</span>
               <button class="lock-btn" data-id="${id}" title="Unlock">Unlock</button>`
            : `<button class="lock-btn" data-id="${id}" title="Lock">Lock</button>`}
        </div>`;
    });
    splitDiv.querySelectorAll('.split-amount').forEach(input => {
      input.onchange = () => {
        let val = parseFloat(input.value) || 0;
        let id = input.dataset.id;
        if (lockedShares[id]) lockedShares[id] = val;
        renderSplitUI();
      };
    });
    splitDiv.querySelectorAll('.lock-btn').forEach(btn => {
      btn.onclick = () => {
        let id = btn.dataset.id;
        if (!lockedShares[id]) {
          lockedShares[id] = splitDiv.querySelector(`.split-amount[data-id='${id}']`).value;
          renderSplitUI();
        } else {
          if (confirm("Unlocking will redistribute the remaining amount equally among unlocked friends. Proceed?")) {
            delete lockedShares[id];
            renderSplitUI();
          }
        }
      };
    });
  }
  amountInput.oninput = renderSplitUI;

  // --- Save to localStorage
  container.querySelector('.entry-form').onsubmit = (e) => {
    e.preventDefault();
    let paidBy = container.querySelector('.paid-by-select').value;
    let amount = parseFloat(amountInput.value);
    let shares = {};
    container.querySelectorAll('.split-amount').forEach(input => {
      shares[input.dataset.id] = parseFloat(input.value);
    });
    let entry = {
      timestamp: Date.now(),
      paidBy,
      amount,
      shares,
      friends: [...selectedFriends]
    };
    let all = JSON.parse(localStorage.getItem('spendHistory') || "[]");
    all.push(entry);
    localStorage.setItem('spendHistory', JSON.stringify(all));
    lockedShares = {};
    selectedFriends = [];
    amountInput.value = "";
    renderFriendsList();
    renderSelected();
    renderPaidBy();
    renderSplitUI();
    alert("Saved!");
    // Optionally: switch to history tab here
  };
}
