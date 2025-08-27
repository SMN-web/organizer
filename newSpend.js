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
    <div class="selector-group">
      <span class="selector-label">Friends Sharing:</span>
      <div class="custom-dropdown friends-dropdown">
        <div class="dropdown-selected" tabindex="0">Select friends...</div>
        <div class="dropdown-menu" style="display:none;">
          <input class="dropdown-search friends-search" type="text" placeholder="Search friends..." autocomplete="off" />
          <div class="dropdown-options friends-options"></div>
        </div>
      </div>
      <div class="chosen-list friends-chosen"></div>
    </div>
    <div class="paidby-select-group">
      <span class="selector-label">Paid By:</span>
      <div class="custom-dropdown paidby-dropdown">
        <div class="dropdown-selected" tabindex="0">Select payer...</div>
        <div class="dropdown-menu" style="display:none;">
          <input class="dropdown-search paidby-search" type="text" placeholder="Search payer..." autocomplete="off" />
          <div class="dropdown-options paidby-options"></div>
        </div>
      </div>
    </div>
    <div class="amount-area">
      <span class="amount-label">Amount Paid (QAR):</span>
      <input type="number" min="0.01" step="0.01" class="amount-input" placeholder="Enter amount" disabled />
    </div>
    <button type="button" class="primary-btn calc-btn" disabled>Calculate</button>
    <div class="custom-msg"></div>
  `;
  let selectedFriends = [];
  let paidBy = null;

  // ------- FRIENDS DROPDOWN LOGIC -------
  const dropdown = container.querySelector('.friends-dropdown');
  const showFriendMenu = () => {
    container.querySelector('.friends-dropdown .dropdown-menu').style.display = 'block';
    container.querySelector('.friends-search').focus();
    renderFriendsOptions();
  };
  dropdown.querySelector('.dropdown-selected').onclick = showFriendMenu;
  container.querySelector('.friends-search').oninput = renderFriendsOptions;
  function renderFriendsOptions() {
    const filter = container.querySelector('.friends-search').value.toLowerCase();
    const opts = container.querySelector('.friends-options');
    opts.innerHTML = "";
    FRIENDS.filter(f => f.name.toLowerCase().includes(filter)).forEach(f => {
      const isSel = selectedFriends.includes(f.id);
      let div = document.createElement('div');
      div.className = "selector-item" + (isSel ? " selected" : "");
      div.textContent = f.name;
      div.onclick = () => {
        if (!isSel) {
          selectedFriends.push(f.id);
          selectedFriends = selectedFriends.sort((a, b) => a === 'me' ? -1 : b === 'me' ? 1 : 0);
          renderFriendsChosen();
          renderPaidByDropdown();
          updateAmountAndCalc();
        }
      };
      opts.appendChild(div);
    });
  }
  // -- Remove on chip click
  function renderFriendsChosen() {
    const chips = container.querySelector('.friends-chosen');
    chips.innerHTML = selectedFriends.map(id =>
      `<span class="chosen-chip" data-id="${id}">${getFriendById(id).name}</span>`).join('');
    chips.querySelectorAll('.chosen-chip').forEach(chip => {
      chip.onclick = () => {
        selectedFriends = selectedFriends.filter(fid => fid !== chip.dataset.id);
        if (paidBy === chip.dataset.id) paidBy = null;
        renderFriendsOptions();
        renderFriendsChosen();
        renderPaidByDropdown();
        updateAmountAndCalc();
      };
    });
  }

  // ------- PAID BY DROPDOWN LOGIC -------
  const paidDropdown = container.querySelector('.paidby-dropdown');
  paidDropdown.querySelector('.dropdown-selected').onclick = () => {
    paidDropdown.querySelector('.dropdown-menu').style.display = 'block';
    paidDropdown.querySelector('.paidby-search').focus();
    renderPaidByOptions();
  };
  container.querySelector('.paidby-search').oninput = renderPaidByOptions;
  function renderPaidByOptions() {
    const filter = container.querySelector('.paidby-search').value.toLowerCase();
    const opts = container.querySelector('.paidby-options');
    opts.innerHTML = "";
    selectedFriends
      .map(id => getFriendById(id))
      .filter(f => f.name.toLowerCase().includes(filter))
      .forEach(f => {
        const isSel = f.id === paidBy;
        let div = document.createElement('div');
        div.className = "selector-item" + (isSel ? " selected" : "");
        div.textContent = f.name;
        div.onclick = () => {
          paidBy = f.id;
          renderPaidByDropdown();
          updateAmountAndCalc();
        };
        opts.appendChild(div);
      });
  }

  function renderPaidByDropdown() {
    const drop = container.querySelector('.paidby-dropdown');
    const sel = drop.querySelector('.dropdown-selected');
    if (paidBy && selectedFriends.includes(paidBy)) {
      sel.textContent = getFriendById(paidBy).name;
    } else if (selectedFriends.length) {
      paidBy = selectedFriends[0];
      sel.textContent = getFriendById(paidBy).name;
    } else {
      paidBy = null;
      sel.textContent = "Select payer...";
    }
  }

  // -- Activate/disable input and calculate button
  function updateAmountAndCalc() {
    const amt = container.querySelector('.amount-input');
    const calcBtn = container.querySelector('.calc-btn');
    if (selectedFriends.length >= 2 && selectedFriends.includes("me") && paidBy) {
      amt.disabled = false;
      calcBtn.disabled = false;
    } else {
      amt.value = ""; amt.disabled = true; calcBtn.disabled = true;
    }
    renderPaidByDropdown();
  }

  // ----- CALCULATE BUTTON LOGIC -----
  const calcBtn = container.querySelector('.calc-btn');
  const msgBox = container.querySelector('.custom-msg');
  calcBtn.onclick = () => {
    if (selectedFriends.length < 2 || !selectedFriends.includes("me")) {
      msgBox.textContent = "Please select at least two friends including yourself.";
      msgBox.style.color = "#e04444";
      return;
    }
    if (!paidBy) {
      msgBox.textContent = "Select who paid.";
      msgBox.style.color = "#e04444";
      return;
    }
    if (!(parseFloat(container.querySelector('.amount-input').value) > 0)) {
      msgBox.textContent = "Enter a valid amount paid.";
      msgBox.style.color = "#e04444";
      return;
    }
    msgBox.textContent = "Ready to distribute and save!";
    msgBox.style.color = "#219d53";
  };

  // ---- Menu close on outside click ----
  document.addEventListener('click', function(e){
    if (!dropdown.contains(e.target)) dropdown.querySelector('.dropdown-menu').style.display = "none";
    if (!paidDropdown.contains(e.target)) paidDropdown.querySelector('.dropdown-menu').style.display = "none";
  });

  // Initial render
  renderFriendsOptions();
  renderFriendsChosen();
  renderPaidByDropdown();
  updateAmountAndCalc();
}
