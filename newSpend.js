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
    <div class="split-setup-panel">
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
      <div class="selector-group">
        <span class="selector-label">Paid By:</span>
        <div class="chosen-list payers-chosen"></div>
      </div>
      <div class="total-display" id="totalDisplay" style="margin:12px 0 4px 0;font-size:1.10em;color:#233d68;display:none;"></div>
      <button type="button" class="primary-btn calc-btn" disabled>Calculate</button>
      <div class="custom-msg"></div>
    </div>
    <div class="split-results-container" style="margin-top:22px;"></div>
  `;
  let selectedFriends = [];
  let payers = [];
  let payerAmounts = {};

  // Friends Dropdown
  const dropdown = container.querySelector('.friends-dropdown');
  dropdown.querySelector('.dropdown-selected').onclick = () => {
    dropdown.querySelector('.dropdown-menu').style.display = 'block';
    dropdown.querySelector('.friends-search').focus();
    renderFriendsOptions();
  };
  container.querySelector('.friends-search').oninput = renderFriendsOptions;

  function renderFriendsOptions() {
    const filter = container.querySelector('.friends-search').value.toLowerCase();
    const opts = container.querySelector('.friends-options');
    opts.innerHTML = "";
    FRIENDS.filter(f => f.name.toLowerCase().includes(filter)).forEach(f => {
      const isSel = selectedFriends.includes(f.id);
      let div = document.createElement('div');
      div.className = "selector-item" + (isSel ? " selected used" : "");
      div.textContent = f.name;
      if (!isSel) {
        div.onclick = () => {
          selectedFriends.push(f.id);
          selectedFriends = Array.from(new Set(selectedFriends)).sort((a, b) => a === 'me' ? -1 : b === 'me' ? 1 : 0);
          renderFriendsOptions(); renderFriendsChosen(); renderPayerChips(); updateCalcButton();
        };
      }
      opts.appendChild(div);
    });
    opts.style.maxHeight = "168px";
    opts.style.overflowY = "auto";
  }
  function renderFriendsChosen() {
    const chips = container.querySelector('.friends-chosen');
    chips.innerHTML = selectedFriends.map(id =>
      `<span class="chosen-chip" data-id="${id}">${getFriendById(id).name}<span class="chip-x">&nbsp;×</span></span>`
    ).join('');
    chips.querySelectorAll('.chosen-chip').forEach(chip => {
      chip.onclick = () => {
        selectedFriends = selectedFriends.filter(fid => fid !== chip.dataset.id);
        payers = payers.filter(pid => pid !== chip.dataset.id); delete payerAmounts[chip.dataset.id];
        renderFriendsOptions(); renderFriendsChosen(); renderPayerChips(); updateCalcButton();
      };
    });
  }
  function renderPayerChips() {
    const payersDiv = container.querySelector('.payers-chosen');
    payersDiv.innerHTML = "";
    if (selectedFriends.length < 2) {
      payers = []; payerAmounts = {}; payersDiv.innerHTML = "";
      updateTotalDisplay();
      return;
    }
    let addOptions = selectedFriends.filter(id => !payers.includes(id));
    addOptions.forEach(id => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip';
      chip.textContent = getFriendById(id).name;
      let x = document.createElement('span');
      x.className = 'chip-x';
      x.textContent = '+';
      chip.appendChild(x);
      chip.onclick = () => {
        if (payers.length >= 1) {
          if (confirm('You already selected one payer. Still add another?')) {
            payers.push(id); payerAmounts[id] = '';
            renderPayerChips(); updateCalcButton();
          }
        } else {
          payers.push(id); payerAmounts[id] = '';
          renderPayerChips(); updateCalcButton();
        }
      };
      chip.style.background = "#f7f7f7"; chip.style.color = "#393939"; chip.style.border = "1.1px solid #d2dbe0";
      payersDiv.appendChild(chip);
    });
    // Selected payers: show chips + amount
    payers.forEach(id => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip selected-payer';
      chip.innerHTML = `
        ${getFriendById(id).name}
        <span class="chip-x" style="pointer-events:all;">×</span>
        <input type="number" class="payer-amt" min="0.01" step="0.01" value="${payerAmounts[id] ?? ''}" placeholder="Amt" />
      `;
      chip.onclick = e => {
        if (e.target.classList.contains('chip-x') || e.target === chip) {
          payers = payers.filter(pid => pid !== id); delete payerAmounts[id];
          renderPayerChips(); updateCalcButton();
        }
      };
      chip.querySelector('.payer-amt').oninput = (ev) => {
        payerAmounts[id] = ev.target.value;
        updateTotalDisplay();
      };
      payersDiv.appendChild(chip);
    });
    updateTotalDisplay();
  }
  function updateTotalDisplay() {
    let sum = payers.reduce((acc, id) => acc + parseFloat(payerAmounts[id] || 0), 0);
    const disp = container.querySelector('#totalDisplay');
    if (payers.length) {
      disp.style.display = '';
      disp.textContent = isNaN(sum) ? "" : `Total Paid: ${sum.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} QAR`;
    } else {
      disp.style.display = "none"; disp.textContent = "";
    }
  }
  function updateCalcButton() {
    const enoughFriends = selectedFriends.length >= 2 && selectedFriends.includes("me");
    let filled = payers.length && payers.every(id => parseFloat(payerAmounts[id]) > 0);
    const calcBtn = container.querySelector('.calc-btn');
    calcBtn.disabled = !(enoughFriends && payers.length && filled);
    if (calcBtn.disabled) container.querySelector('.custom-msg').textContent = "";
    updateTotalDisplay();
  }

  // Split panel after calculate—appears below
  container.querySelector('.calc-btn').onclick = () => {
    const enoughFriends = selectedFriends.length >= 2 && selectedFriends.includes("me");
    let sum = payers.reduce((acc, id) => acc + parseFloat(payerAmounts[id] || 0), 0);
    if (!enoughFriends) { container.querySelector('.custom-msg').textContent = "Please select at least two friends including yourself."; return; }
    if (payers.length === 0) { container.querySelector('.custom-msg').textContent = "Select at least one person who paid."; return; }
    if (!sum) { container.querySelector('.custom-msg').textContent = "Enter paid amount for each payer."; return;}
    if (payers.some(id => !(parseFloat(payerAmounts[id]) > 0))) { container.querySelector('.custom-msg').textContent = "Amount required for each payer."; return; }
    container.querySelector('.custom-msg').textContent = "";
    generateSplitPanel(selectedFriends, sum);
  };
  function generateSplitPanel(sharers, totalAmount) {
    const splitWrap = container.querySelector('.split-results-container');
    splitWrap.innerHTML = `
      <h3 style="font-size:1.11em;margin:0 0 9px;font-weight:600;">Split Among Friends</h3>
      <div class="split-list"></div>
      <button class="primary-btn save-all-btn" style="margin-top:1.1em">Save</button>
      <div class="custom-msg save-result-msg" style="margin-top:10px"></div>
    `;
    let locked = {};
    function renderList() {
      const splitDiv = splitWrap.querySelector('.split-list');
      splitDiv.innerHTML = '';
      let lockedSum = Object.values(locked).reduce((a, b) => a + Number(b), 0);
      let unlocked = sharers.filter(id => !(id in locked));
      let toSplit = totalAmount - lockedSum;
      let share = unlocked.length > 0 ? (toSplit / unlocked.length) : 0;
      sharers.forEach(id => {
        let isLocked = id in locked;
        let value = isLocked ? locked[id] : share;
        splitDiv.innerHTML += `
          <div class="split-row">
            <span style="min-width:65px;display:inline-block;">${getFriendById(id).name}</span>
            <input type="number" class="split-amt" min="0" value="${value.toFixed(2)}" data-id="${id}" ${isLocked ? 'readonly' : ''}>
            <button class="lock-btn" data-id="${id}">${isLocked ? '🔒' : '🔓'}</button>
          </div>`;
      });
      splitDiv.querySelectorAll('.lock-btn').forEach(btn => {
        btn.onclick = () => {
          let id = btn.dataset.id;
          if (locked[id] === undefined) {
            let val = splitDiv.querySelector(`.split-amt[data-id="${id}"]`).value;
            locked[id] = Number(val);
          } else {
            delete locked[id];
          }
          renderList();
        };
      });
      splitDiv.querySelectorAll('.split-amt').forEach(input => {
        input.onchange = () => {
          let id = input.dataset.id;
          if (locked[id] !== undefined) {
            locked[id] = Number(input.value);
            renderList();
          }
        };
      });
    }
    renderList();
    splitWrap.querySelector('.save-all-btn').onclick = () => {
      let shares = {};
      splitWrap.querySelectorAll('.split-amt').forEach(input => {
        shares[input.dataset.id] = Number(input.value);
      });
      let sum = Object.values(shares).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - totalAmount) > 0.01) {
        splitWrap.querySelector('.save-result-msg').textContent = "Total does not sum to full amount!";
        return;
      }
      splitWrap.querySelector('.save-result-msg').textContent = "Saved!";
      setTimeout(()=>splitWrap.querySelector('.save-result-msg').textContent="",2000);
    };
  }
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) dropdown.querySelector('.dropdown-menu').style.display = "none";
  });

  renderFriendsOptions(); renderFriendsChosen(); renderPayerChips(); updateCalcButton();
}
