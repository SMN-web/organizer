import { showSpinner, hideSpinner } from './spinner.js';

// Modal utility
function showModal({ title, content, okText = "OK", onOk, showCancel = false, cancelText = "Cancel", onCancel }) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal transfer-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      ${title ? `<h3>${title}</h3>` : ""}
      <div class="modal-msg">${content || ''}</div>
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

export async function showTransferPopup(container, user, defaultFromUsername = "") {
  showSpinner(container);
  let friends = [];
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') throw new Error("Not logged in");
    const token = await user.firebaseUser.getIdToken(true);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    await wait(2000);
    const resp = await fetch('https://tr-am.nafil-8895-s.workers.dev/api/friends/list', {
      headers: { Authorization: "Bearer " + token }
    });
    friends = await resp.json();
    if (!Array.isArray(friends) || friends.length < 2)
      throw new Error("You need at least two friends to create a transfer.");
    friends = friends.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    hideSpinner(container);
  } catch (e) {
    hideSpinner(container);
    showModal({
      title: "Transfer Not Available",
      content: e.message || e,
      okText: "OK"
    });
    return;
  }

  let fromOpen = false, toOpen = false;
  let fromSearchVal = "", toSearchVal = "";
  let fromSelected = "", toSelected = "";

  if (defaultFromUsername && friends.some(f => f.username === defaultFromUsername)) {
    fromSelected = defaultFromUsername;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal transfer-modal">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h3>Create Transfer</h3>
      <div class="modal-row">
        <label class="modal-label">From:</label>
        <div class="custom-dropdown-box" id="fromDropdownBox">
          <div class="dropdown-selected-row" tabindex="0">
            <input id="fromSelectedInput" class="dropdown-selected-input" type="text" readonly placeholder="Select Friend" />
            <span class="custom-dropdown-arrow">&#x25BC;</span>
          </div>
          <div class="dropdown-menu" id="fromDropdownMenu">
            <input type="text" class="dropdown-search" id="fromSearchBox" placeholder="Search..." autocomplete="off" />
            <div class="dropdown-options" id="fromOptions"></div>
          </div>
        </div>
      </div>
      <div class="username-display" id="fromUsernameDisplay"></div>
      <div class="modal-row">
        <label class="modal-label">To:</label>
        <div class="custom-dropdown-box" id="toDropdownBox">
          <div class="dropdown-selected-row" tabindex="0">
            <input id="toSelectedInput" class="dropdown-selected-input" type="text" readonly placeholder="Select Friend" />
            <span class="custom-dropdown-arrow">&#x25BC;</span>
          </div>
          <div class="dropdown-menu" id="toDropdownMenu">
            <input type="text" class="dropdown-search" id="toSearchBox" placeholder="Search..." autocomplete="off" />
            <div class="dropdown-options" id="toOptions"></div>
          </div>
        </div>
      </div>
      <div class="username-display" id="toUsernameDisplay"></div>
      <div class="modal-row">
        <label class="modal-label">Amount:</label>
        <input id="amountInput" type="number" min="1" placeholder="Amount" />
      </div>
      <div class="modal-row error-row"></div>
      <div class="modal-btn-row">
        <button class="modal-btn" id="transferBtn">Transfer</button>
        <button class="modal-btn modal-btn-alt" id="cancelBtn" type="button">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // FROM
  const fromDropdownBox = modal.querySelector('#fromDropdownBox');
  const fromDropdownMenu = modal.querySelector('#fromDropdownMenu');
  const fromSelectedInput = modal.querySelector('#fromSelectedInput');
  const fromSearchBox = modal.querySelector('#fromSearchBox');
  const fromOptions = modal.querySelector('#fromOptions');
  const fromUsernameDisplay = modal.querySelector('#fromUsernameDisplay');
  // TO
  const toDropdownBox = modal.querySelector('#toDropdownBox');
  const toDropdownMenu = modal.querySelector('#toDropdownMenu');
  const toSelectedInput = modal.querySelector('#toSelectedInput');
  const toSearchBox = modal.querySelector('#toSearchBox');
  const toOptions = modal.querySelector('#toOptions');
  const toUsernameDisplay = modal.querySelector('#toUsernameDisplay');
  // REST
  const amountInput = modal.querySelector('#amountInput');
  const errorRow = modal.querySelector('.error-row');
  const transferBtn = modal.querySelector('#transferBtn');
  const cancelBtn = modal.querySelector('#cancelBtn');
  const closeBtn = modal.querySelector('.modal-close');

  function renderOptions(where) {
    const searchVal = (where === 'from' ? fromSearchVal : toSearchVal).trim().toLowerCase();
    const selected = (where === 'from' ? fromSelected : toSelected);
    const disableVal = (where === 'from' ? toSelected : fromSelected);
    const root = where === 'from' ? fromOptions : toOptions;
    root.innerHTML = "";
    let any = false;
    friends.forEach(f => {
      const disabled = f.username === disableVal;
      if (!searchVal || f.name.toLowerCase().includes(searchVal) || f.username.toLowerCase().includes(searchVal)) {
        any = true;
        const div = document.createElement('div');
        div.className = `dropdown-option${disabled ? " disabled" : ""}${selected === f.username ? " selected" : ""}`;
        div.textContent = f.name;
        if (!disabled) {
          div.onclick = () => {
            if (where === 'from') {
              fromSelected = f.username;
              fromSelectedInput.value = f.name;
              fromDropdownMenu.classList.remove('open');
              fromOpen = false;
              renderOptions('from'); renderOptions('to'); renderUsernameDisplays();
            } else {
              toSelected = f.username;
              toSelectedInput.value = f.name;
              toDropdownMenu.classList.remove('open');
              toOpen = false;
              renderOptions('to'); renderOptions('from'); renderUsernameDisplays();
            }
          };
        }
        if (disabled) div.setAttribute('tabindex', '-1');
        root.appendChild(div);
      }
    });
    if (!any) {
      const div = document.createElement('div');
      div.className = 'dropdown-option disabled';
      div.textContent = "No friends found.";
      div.tabIndex = "-1";
      root.appendChild(div);
    }
  }

  function renderUsernameDisplays() {
    fromUsernameDisplay.innerHTML = fromSelected
      ? `<span class="username-tag">@${fromSelected}</span>`
      : '';
    toUsernameDisplay.innerHTML = toSelected
      ? `<span class="username-tag">@${toSelected}</span>`
      : '';
  }

  function closeMenus() {
    fromOpen = false; toOpen = false;
    fromDropdownMenu.classList.remove('open');
    toDropdownMenu.classList.remove('open');
  }

  fromSelectedInput.onclick = () => {
    closeMenus();
    fromOpen = true;
    fromDropdownMenu.classList.add('open');
    setTimeout(() => { fromSearchBox.value = fromSearchVal; fromSearchBox.focus(); renderOptions('from'); }, 30);
  };
  fromDropdownBox.querySelector('.custom-dropdown-arrow').onclick = fromSelectedInput.onclick;
  toSelectedInput.onclick = () => {
    closeMenus();
    toOpen = true;
    toDropdownMenu.classList.add('open');
    setTimeout(() => { toSearchBox.value = toSearchVal; toSearchBox.focus(); renderOptions('to'); }, 30);
  };
  toDropdownBox.querySelector('.custom-dropdown-arrow').onclick = toSelectedInput.onclick;

  document.addEventListener('mousedown', (e) => {
    if (!modal.contains(e.target)) closeMenus();
  });

  fromSearchBox.oninput = function() { fromSearchVal = fromSearchBox.value; renderOptions('from'); };
  toSearchBox.oninput = function() { toSearchVal = toSearchBox.value; renderOptions('to'); };

  function showError(msg) { errorRow.textContent = msg; }
  function resetError() { errorRow.textContent = ""; }

  transferBtn.onclick = () => {
    resetError();
    if (!fromSelected || !toSelected) return showError("Select both 'From' and 'To' friends.");
    if (fromSelected === toSelected) return showError("From and To friends cannot be the same.");
    const amount = Number(amountInput.value);
    if (!amountInput.value || isNaN(amount) || amount <= 0) return showError("Enter a valid positive amount.");
    showModal({
      title: "Confirm Transfer",
      content: `Transfer <b>${amount} QAR</b> from <b>${friends.find(f=>f.username===fromSelected).name}</b> to <b>${friends.find(f=>f.username===toSelected).name}</b>?<br>Are these details correct?`,
      okText: "Confirm",
      cancelText: "Cancel",
      showCancel: true,
      onOk: () => {
        showModal({
          title: "Transfer Successful",
          content: `Transfer completed.`,
          okText: "OK"
        });
      }
    });
  };

  closeBtn.onclick = () => modal.remove();
  cancelBtn.onclick = () => modal.remove();

  if (fromSelected) {
    const match = friends.find(f => f.username === fromSelected);
    if (match) fromSelectedInput.value = match.name;
  }
  toSelectedInput.value = '';
  renderOptions('from');
  renderOptions('to');
  renderUsernameDisplays();
  setTimeout(() => fromSelectedInput.focus(), 120);
}
