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
    <div class="total-display" id="totalDisplay" style="display:none;"></div>
    <button type="button" class="primary-btn calc-btn" disabled>Calculate</button>
    <div class="custom-msg"></div>
  `;

  let selectedFriends = [];
  let payers = [];
  let payerAmounts = {};

  // -------- FRIENDS DROPDOWN --------
  const dropdown = container.querySelector('.friends-dropdown');
  const showFriendMenu = () => {
    dropdown.querySelector('.dropdown-menu').style.display = 'block';
    dropdown.querySelector('.friends-search').focus();
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

  // --------- PAID BY MULTI-CHIP ---------
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
        if (payers.length === 1) {
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
    // Render selected payer chips, each with amount box and × (removal)
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

  // --- AUTO TOTAL FROM ALL PAYERS ---
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

  // --- ONLY ENABLE BUTTON IF VALID ---
  const calcBtn = container.querySelector('.calc-btn');
  const msgBox = container.querySelector('.custom-msg');
  function updateCalcButton() {
    const enoughFriends = selectedFriends.length >= 2 && selectedFriends.includes("me");
    let filled = payers.length && payers.every(id => parseFloat(payerAmounts[id]) > 0);
    calcBtn.disabled = !(enoughFriends && payers.length && filled);
    updateTotalDisplay();
  }

  calcBtn.onclick = () => {
    if (selectedFriends.length < 2 || !selectedFriends.includes("me")) { msgBox.textContent = "Please select at least two friends including yourself."; msgBox.style.color = "#e04444"; return; }
    if (payers.length === 0) { msgBox.textContent = "Select at least one person who paid."; msgBox.style.color = "#e04444"; return; }
    let sum = payers.reduce((acc, id) => acc + parseFloat(payerAmounts[id] || 0), 0);
    if (payers.some(id => !(parseFloat(payerAmounts[id]) > 0))) {
      msgBox.textContent = "Enter a paid amount for each payer."; msgBox.style.color = "#e04444"; return;
    }
    msgBox.textContent = `Ready! Total paid: ${sum} QAR`; 
    msgBox.style.color = "#15774d";
  };

  // Dismiss menus on outside click
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) dropdown.querySelector('.dropdown-menu').style.display = "none";
  });

  renderFriendsOptions();
  renderFriendsChosen();
  renderPayerChips();
  updateCalcButton();
}
