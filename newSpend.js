const FRIENDS = [
  { id: 'me', name: 'Me' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' },
  { id: 'e', name: 'E' }
];
function getFriendById(id) { return FRIENDS.find(f => f.id === id); }
function rup(val) { return Math.ceil(Number(val) || 0); }

export function showNewSpend(container) {
  let editing = true; // editing mode state

  function renderMain(editingMode = true) {
    editing = editingMode;
    container.innerHTML = `
      <div class="split-setup-panel">
        <div class="selector-group">
          <span class="selector-label">Friends Sharing:</span>
          <div class="custom-dropdown friends-dropdown">
            <div class="dropdown-selected" tabindex="0" ${!editing ? 'style="pointer-events:none;opacity:.66;"' : ''}>Select friends...</div>
            <div class="dropdown-menu" style="display:none;">
              <input class="dropdown-search friends-search" ${!editing ? 'disabled' : ''} type="text" placeholder="Search friends..." autocomplete="off" />
              <div class="dropdown-options friends-options"></div>
            </div>
          </div>
          <div class="chosen-list friends-chosen"></div>
        </div>
        <div class="selector-group">
          <span class="selector-label">Paid By:</span>
          <div class="chosen-list payers-chosen"></div>
        </div>
        <div class="total-display" id="totalDisplay"></div>
        <button type="button" class="primary-btn calc-btn">${editingMode ? "Calculate" : "Edit"}</button>
        <div class="custom-msg"></div>
      </div>
      <div class="split-results-container" style="margin-top:20px;"></div>
    `;
    renderFriendsOptions();
    renderFriendsChosen();
    renderPayerChips();
    updateTotalDisplay();
    attachDropdownCloseHandler();

    // Calculate/Edit button logic
    const calcBtn = container.querySelector('.calc-btn');
    if (editing) {
      calcBtn.onclick = () => attemptCalculate();
    } else {
      calcBtn.onclick = () => {
        if (confirm("Editing will clear the current split. Continue?")) {
          renderMain(true); // revert to editable mode and clear split
        }
      };
    }
  }

  // Initial shared data state
  let selectedFriends = [];
  let payers = [];
  let payerAmounts = {};

  // FRIENDS list logic
  function renderFriendsOptions() {
    const dropdown = container.querySelector('.friends-dropdown');
    const filter = container.querySelector('.friends-search') ? container.querySelector('.friends-search').value.toLowerCase() : '';
    const opts = container.querySelector('.friends-options');
    opts.innerHTML = "";
    FRIENDS.filter(f => f.name.toLowerCase().includes(filter)).forEach(f => {
      const isSel = selectedFriends.includes(f.id);
      let div = document.createElement('div');
      div.className = "selector-item" + (isSel ? " selected used" : "");
      div.textContent = f.name;
      if (!isSel && editing) {
        div.onclick = () => {
          selectedFriends.push(f.id);
          selectedFriends = Array.from(new Set(selectedFriends)).sort((a, b) => a === 'me' ? -1 : b === 'me' ? 1 : 0);
          renderFriendsOptions(); renderFriendsChosen(); renderPayerChips(); updateTotalDisplay();
        };
      }
      opts.appendChild(div);
    });
    opts.style.maxHeight = "170px";
    opts.style.overflowY = "auto";
  }

  function renderFriendsChosen() {
    const chips = container.querySelector('.friends-chosen');
    chips.innerHTML = selectedFriends.map(id =>
      `<span class="chosen-chip" data-id="${id}">${getFriendById(id).name}${editing ? '<span class="chip-x">×</span>' : ''}</span>`
    ).join('');
    if (editing) {
      chips.querySelectorAll('.chosen-chip').forEach(chip => {
        chip.onclick = () => {
          selectedFriends = selectedFriends.filter(fid => fid !== chip.dataset.id);
          payers = payers.filter(pid => pid !== chip.dataset.id); delete payerAmounts[chip.dataset.id];
          renderFriendsOptions(); renderFriendsChosen(); renderPayerChips(); updateTotalDisplay();
        };
      });
    }
  }

  function renderPayerChips() {
    const payersDiv = container.querySelector('.payers-chosen');
    payersDiv.innerHTML = "";
    let addOptions = selectedFriends.filter(id => !payers.includes(id));
    addOptions.forEach(id => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip';
      chip.textContent = getFriendById(id).name;
      let x = document.createElement('span');
      x.className = 'chip-x'; x.textContent = '+';
      chip.appendChild(x);
      if (editing) {
        chip.onclick = () => {
          payers.push(id); payerAmounts[id] = '';
          renderPayerChips(); updateTotalDisplay();
        };
      }
      chip.style.background = "#f7f7f7"; chip.style.color = "#393939"; chip.style.border = "1.1px solid #d2dbe0";
      payersDiv.appendChild(chip);
    });
    payers.forEach(id => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip selected-payer';
      chip.innerHTML = `
        ${getFriendById(id).name}
        ${editing ? '<span class="chip-x" style="pointer-events:all;">×</span>' : ''}
        <input type="number" class="payer-amt" min="0" step="1" ${editing ? '' : 'readonly'} value="${payerAmounts[id] ?? ''}" placeholder="Amt" />
      `;
      if (editing) {
        chip.onclick = e => {
          if (e.target.classList.contains('chip-x') || e.target === chip) {
            payers = payers.filter(pid => pid !== id); delete payerAmounts[id];
            renderPayerChips(); updateTotalDisplay();
          }
        };
        chip.querySelector('.payer-amt').oninput = (ev) => {
          let val = ev.target.value.replace(/[^0-9]/g, '');
          ev.target.value = val;
          payerAmounts[id] = val;
          updateTotalDisplay();
        };
      }
      payersDiv.appendChild(chip);
    });
    updateTotalDisplay();
  }

  function updateTotalDisplay() {
    let sum = payers.reduce((acc, id) => acc + rup(payerAmounts[id]), 0);
    const disp = container.querySelector('#totalDisplay');
    if (payers.length) {
      disp.style.display = '';
      disp.textContent = isNaN(sum) ? "" : `Total Paid: ${sum} QAR`;
    } else {
      disp.style.display = "none"; disp.textContent = "";
    }
  }

  // clicking outside dropdown closes it
  function attachDropdownCloseHandler() {
    const dropdown = container.querySelector('.friends-dropdown');
    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target)) dropdown.querySelector('.dropdown-menu').style.display = "none";
    }, { once: true });
  }

  // --- Calculate button validation/trigger ---
  function attemptCalculate() {
    const msgBox = container.querySelector('.custom-msg');
    msgBox.textContent = "";

    if (!selectedFriends.includes('me') || selectedFriends.length < 2) {
      msgBox.textContent = "Please select yourself ('Me') and at least one more friend.";
      return;
    }
    if (!payers.includes('me') || !/^\d+$/.test(payerAmounts['me'] || "") || rup(payerAmounts['me']) < 0) {
      msgBox.textContent = "'Me' must be added and have a paid amount (0 or more).";
      return;
    }
    for (let id of payers) {
      if (!/^\d+$/.test(payerAmounts[id] || "") || rup(payerAmounts[id]) < 0) {
        msgBox.textContent = "All payers must have a non-negative paid amount.";
        return;
      }
    }
    let total = payers.reduce((acc, id) => acc + rup(payerAmounts[id]), 0);
    if (total <= 0) {
      msgBox.textContent = "Total paid amount must be positive.";
      return;
    }
    msgBox.textContent = "";
    // lock the UI; generate split, show edit button
    renderMain(false);
    generateSplitPanel(selectedFriends, total);
  }

  function generateSplitPanel(sharers, totalAmount) {
    const splitWrap = container.querySelector('.split-results-container');
    splitWrap.innerHTML = `
      <h3 style="font-size:1.12em;margin:0 0 12px;font-weight:600;">Split Among Friends</h3>
      <div class="split-list"></div>
      <button class="primary-btn save-all-btn" style="margin-top:1.1em">Save</button>
      <div class="custom-msg save-result-msg" style="margin-top:12px"></div>
    `;
    let locked = {};
    function renderList() {
      const splitDiv = splitWrap.querySelector('.split-list');
      splitDiv.innerHTML = '';
      let lockedSum = Object.values(locked).reduce((a, b) => a + rup(b), 0);
      let unlocked = sharers.filter(id => !(id in locked));
      let toSplit = totalAmount - lockedSum;
      let share = unlocked.length > 0 ? rup(toSplit / unlocked.length) : 0;
      let sumPreview = lockedSum + share * unlocked.length;
      let diff = sumPreview - totalAmount;
      sharers.forEach((id, idx) => {
        let isLocked = id in locked;
        let value = isLocked ? rup(locked[id]) : share;
        if (!isLocked && diff > 0 && idx === sharers.length - 1) value -= diff;
        splitDiv.innerHTML += `
          <div class="split-row${isLocked ? " locked-row" : ""}">
            <span class="split-row-name">${getFriendById(id).name}</span>
            <input type="number" class="split-amt" min="0" step="1" value="${value}" data-id="${id}"
              ${isLocked ? 'readonly' : ''}
              style="background:${isLocked ? '#e2eef4' : '#fff'};color:${isLocked ? '#156b97':'#25304d'};border:2.2px solid ${isLocked ? '#288944':'#d3dae4'};">
            <button class="lock-btn" data-id="${id}" aria-label="${isLocked ? 'Unlock' : 'Lock'}" style="background:none;border:none;font-size:1.42em;">
              ${isLocked
                ? `<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#288944" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="8" rx="2" fill="#e2faf4"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.5" fill="#288944" /></svg>`
                : `<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#96a1b5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="8" rx="2" fill="#f8fafc"/><path d="M17 11V7a5 5 0 1 0-10 0"/><circle cx="12" cy="16" r="1.5" fill="#96a1b5" /></svg>`
              }
            </button>
          </div>`;
      });
      splitDiv.querySelectorAll('.lock-btn').forEach(btn => {
        btn.onclick = () => {
          let id = btn.dataset.id;
          if (locked[id] === undefined) {
            let val = splitDiv.querySelector(`.split-amt[data-id="${id}"]`).value;
            locked[id] = rup(val);
          } else {
            delete locked[id];
          }
          renderList();
        };
      });
      splitDiv.querySelectorAll('.split-amt').forEach(input => {
        input.oninput = () => {
          let id = input.dataset.id;
          let val = input.value.replace(/[^0-9]/g, '');
          input.value = val;
          if (locked[id] !== undefined) {
            locked[id] = rup(val);
            renderList();
          }
        };
      });
    }
    renderList();
    splitWrap.querySelector('.save-all-btn').onclick = () => {
      let shares = {};
      splitWrap.querySelectorAll('.split-amt').forEach(input => {
        shares[input.dataset.id] = rup(input.value);
      });
      let sum = Object.values(shares).reduce((a, b) => a + rup(b), 0);
      if (sum !== totalAmount) {
        splitWrap.querySelector('.save-result-msg').textContent = "Error: Split does not match total spend!";
        splitWrap.querySelector('.save-result-msg').style.color = "#be1d1d";
        return;
      }
      splitWrap.querySelector('.save-result-msg').textContent = "Saved successfully!";
      splitWrap.querySelector('.save-result-msg').style.color = "#147a39";
    };
  }

  renderMain(true);
}
