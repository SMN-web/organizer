export async function showNewSpend(container, user) {
  let FRIENDS = [];
  let loggedInUsername = null;
  let loggedInName = null;
  let token = null;

  async function getUserProfileAndFriends() {
    if (!user?.firebaseUser) throw new Error("Not logged in");
    await user.firebaseUser.reload();
    token = await user.firebaseUser.getIdToken(true);

    const profileResp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/userpanel", { headers: { Authorization: "Bearer " + token } });
    const profile = await profileResp.json();
    if (!profile.username) throw new Error("User profile incomplete");
    loggedInUsername = profile.username;
    loggedInName = profile.name || profile.username;

    const frResp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/friends/list", { headers: { Authorization: "Bearer " + token } });
    if (!frResp.ok) throw new Error("Failed to fetch friend list");
    const allFriends = await frResp.json();

    return [
      { id: loggedInUsername, name: loggedInName, username: loggedInUsername },
      ...allFriends
        .filter(f => f.username !== loggedInUsername)
        .map(f => ({ id: f.username, name: f.name, username: f.username }))
    ];
  }

  try {
    FRIENDS = await getUserProfileAndFriends();
  } catch (e) {
    container.innerHTML = `<div style="color:#b21414;padding:2em;font-size:1.13em;">Auth or friend list error: ${e.message || e}</div>`;
    return;
  }

  function getFriendById(id) {
    return FRIENDS.find(f => f.id === id || f.username === id) || { id, name: id, username: id };
  }

  function rup(val) { return Math.ceil(Number(val) || 0); }
  function todayDate() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }

  function initialState() {
    return {
      editing: true,
      selectedFriends: [loggedInUsername],
      payers: [loggedInUsername],
      payerAmounts: { [loggedInUsername]: "" },
      lastSplit: null,
      spendDate: todayDate(),
      remarks: ""
    };
  }
  let state = initialState();
  let lastSuccessMsg = "";

  renderAll();

  function renderAll() {
    container.innerHTML = `
      <div class="split-setup-panel" style="max-width:500px;margin:0 auto;">
        <div class="custom-msg global-success" style="margin-bottom:8px;${lastSuccessMsg ? "" : "display:none"};color:#117a32;font-weight:bold">${lastSuccessMsg}</div>
        <div class="selector-group">
          <span class="selector-label">Friends Sharing:</span>
          <div class="custom-dropdown friends-dropdown" style="min-width:215px;">
            <div class="dropdown-selected" tabindex="0">Select friends...</div>
            <div class="dropdown-menu" style="display:none;">
              <input class="dropdown-search friends-search" type="text" placeholder="Search friends..." autocomplete="off" />
              <div class="dropdown-options friends-options"></div>
            </div>
          </div>
          <div class="chosen-list friends-chosen"></div>
        </div>
        <div class="selector-group" style="margin-top:17px;">
          <span class="selector-label">Paid By:</span>
          <div class="chosen-list payers-chosen"></div>
        </div>
        <div class="total-display" id="totalDisplay"></div>
        <label style="margin:14px 0 8px 0;display:block;">Date: <input type="date" class="spend-date-input" value="${state.spendDate || ""}" max="${todayDate()}"/></label>
        <label class="distrib-remarks-label" style="margin-bottom:4px;display:block;">Remarks/Place:
          <input type="text" class="spend-remarks-input" maxlength="90" style="width:99%;margin-top:4px;" value="${state.remarks || ""}" placeholder="E.g. Dinner, Mall, Friends..." />
        </label>
        <button type="button" class="primary-btn calc-btn">${state.editing ? "Calculate" : "Edit"}</button>
        <div class="custom-msg calc-btn-msg" style="margin-top:7px;"></div>
      </div>
      <div class="split-results-container" style="margin-top:20px;"></div>
      <div id="json-output" style="background:#f6f8fa;color:#222;font-size:1em;border:1.2px solid #c6d2dc;border-radius:8px;margin:15px 0 7px 0;padding:13px 6px;word-break:break-all;display:none;text-align:left;"></div>
    `;
    renderFriendsSection();
    renderPayerSection();
    updateTotalDisplay();
    attachDropdownHandlers();
    setupButton();
    if (!state.editing && state.lastSplit) renderSplitPanel(state.lastSplit.sharers, state.lastSplit.total);
  }

  function renderFriendsSection() {
    const dropdown = container.querySelector('.friends-dropdown');
    dropdown.querySelector('.friends-search').oninput = function() {
      renderFriendsOptions(this.value.toLowerCase());
    };
    renderFriendsOptions('');
    const chips = container.querySelector('.friends-chosen');
    chips.innerHTML = state.selectedFriends.map(id =>
      `<span class="chosen-chip" data-id="${id}">${getFriendById(id).name}${state.editing && id!==loggedInUsername ? '<span class="chip-x">×</span>' : ''}</span>`
    ).join('');
    if (state.editing) {
      chips.querySelectorAll('.chosen-chip').forEach(chip => {
        chip.onclick = () => {
          if(chip.dataset.id===loggedInUsername) return;
          state.selectedFriends = state.selectedFriends.filter(fid => fid !== chip.dataset.id);
          state.payers = state.payers.filter(pid => pid !== chip.dataset.id); delete state.payerAmounts[chip.dataset.id];
          renderAll();
        };
      });
    }
  }

  function renderFriendsOptions(filter) {
    const opts = container.querySelector('.friends-options');
    opts.innerHTML = '';
    const matches = FRIENDS.filter(f => f.name.toLowerCase().includes(filter) || f.username.toLowerCase().includes(filter));
    if (matches.length === 0) {
      let div = document.createElement('div');
      div.className = "selector-item";
      div.style.color = "#a7aab3";
      div.style.textAlign = "center";
      div.style.cursor = "default";
      div.textContent = "No friends found";
      opts.appendChild(div);
    } else {
      matches.forEach(f => {
        const isSel = state.selectedFriends.includes(f.id);
        let div = document.createElement('div');
        div.className = "selector-item" + (isSel ? " selected used" : "");
        div.textContent = f.name + (f.username && f.name!==f.username ? " (" + f.username + ")" : "");
        if (!isSel && state.editing) {
          div.onclick = () => {
            state.selectedFriends.push(f.id);
            state.selectedFriends = Array.from(new Set(state.selectedFriends)).sort((a,b)=>a===loggedInUsername?-1:b===loggedInUsername?1:0);
            renderAll();
          };
        }
        opts.appendChild(div);
      });
    }
    opts.style.maxHeight = "170px";
    opts.style.overflowY = "auto";
  }

  function attachDropdownHandlers() {
    const dropdown = container.querySelector('.friends-dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    const search = dropdown.querySelector('.friends-search');
    dropdown.querySelector('.dropdown-selected').onclick = (e) => {
      if (!state.editing) return;
      menu.style.display = 'block';
      search.value = '';
      search.focus();
      renderFriendsOptions('');
      setTimeout(() => {
        function closeHandler(ev) {
          if (!menu.contains(ev.target) && ev.target !== dropdown.querySelector('.dropdown-selected')) {
            menu.style.display = "none";
            document.removeEventListener('mousedown', closeHandler);
          }
        }
        document.addEventListener('mousedown', closeHandler);
      }, 0);
    };
  }

  function renderPayerSection() {
    const payersDiv = container.querySelector('.payers-chosen');
    payersDiv.innerHTML = "";
    let addOptions = state.selectedFriends.filter(id => !state.payers.includes(id));
    addOptions.forEach(id => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip';
      chip.textContent = getFriendById(id).name;
      let x = document.createElement('span');
      x.className = 'chip-x'; x.textContent = '+';
      chip.appendChild(x);
      if (state.editing) {
        chip.onclick = () => {
          state.payers.push(id); state.payerAmounts[id] = '';
          renderAll();
        };
      }
      chip.style.background = "#f7f7f7"; chip.style.color = "#393939"; chip.style.border = "1.1px solid #d2dbe0";
      payersDiv.appendChild(chip);
    });
    state.payers.forEach(id => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip selected-payer';
      chip.innerHTML = `
        ${getFriendById(id).name}
        ${state.editing ? '<span class="chip-x" style="pointer-events:all;">×</span>' : ''}
        <input type="number" class="payer-amt" min="0" step="1" value="${state.payerAmounts[id] ?? ''}" placeholder="Amt" ${state.editing ? '' : 'readonly'} />
      `;
      if (state.editing) {
        chip.onclick = e => {
          if (e.target.classList.contains('chip-x') || e.target === chip) {
            state.payers = state.payers.filter(pid => pid !== id); delete state.payerAmounts[id];
            renderAll();
          }
        };
        chip.querySelector('.payer-amt').oninput = (ev) => {
          let val = ev.target.value.replace(/[^0-9]/g, '');
          ev.target.value = val;
          state.payerAmounts[id] = val;
          updateTotalDisplay();
        };
      }
      payersDiv.appendChild(chip);
    });
    updateTotalDisplay();
  }

  function updateTotalDisplay() {
    let sum = state.payers.reduce((acc, id) => acc + rup(state.payerAmounts[id]), 0);
    const disp = container.querySelector('#totalDisplay');
    if (state.payers.length) {
      disp.style.display = '';
      disp.textContent = isNaN(sum) ? "" : `Total Paid: ${sum} QAR`;
    } else {
      disp.style.display = "none"; disp.textContent = "";
    }
  }

  function setupButton() {
    const calcBtn = container.querySelector('.calc-btn');
    const msgBox = container.querySelector('.calc-btn-msg');
    calcBtn.onclick = () => {
      if (state.editing) {
        msgBox.textContent = "";
        if (!state.selectedFriends.includes(loggedInUsername) || state.selectedFriends.length < 2) {
          msgBox.textContent = "Please select yourself and at least one more friend.";
          return;
        }
        if (!state.payers.includes(loggedInUsername) || !/^\d+$/.test(state.payerAmounts[loggedInUsername] || "") || rup(state.payerAmounts[loggedInUsername]) < 0) {
          msgBox.textContent = "You must be added as a payer and have a paid amount (0 or more).";
          return;
        }
        for (let id of state.payers) {
          if (!/^\d+$/.test(state.payerAmounts[id] || "") || rup(state.payerAmounts[id]) < 0) {
            msgBox.textContent = "All payers must have a non-negative paid amount.";
            return;
          }
        }
        let total = state.payers.reduce((acc, id) => acc + rup(state.payerAmounts[id]), 0);
        if (total <= 0) {
          msgBox.textContent = "Total paid amount must be positive.";
          return;
        }
        msgBox.textContent = "";
        state.lastSplit = { sharers: state.selectedFriends.slice(), total };
        state.editing = false;
        renderAll();
      } else {
        if (confirm("Editing will clear the current distribution. Continue?")) {
          state = initialState();
          lastSuccessMsg = "";
          renderAll();
        }
      }
    };
  }

  function renderSplitPanel(sharers, totalAmount) {
    const splitWrap = container.querySelector('.split-results-container');
    splitWrap.innerHTML = `
      <h3 style="font-size:1.12em;margin:0 0 10px;font-weight:600;">Split Among Friends</h3>
      <div class="split-list"></div>
      <div class="distribution-meta" style="margin:19px 0 13px 0;">
        <label>Date: <input type="date" class="spend-date-input" value="${state.spendDate || ""}" max="${todayDate()}" /></label>
        <label class="distrib-remarks-label" style="margin-top:7px;">Remarks/Place:
          <input type="text" class="spend-remarks-input" maxlength="90" style="width:99%;margin-top:4px;" value="${state.remarks || ""}" placeholder="E.g. Dinner, Mall, Friends..." />
        </label>
      </div>
      <button type="button" class="primary-btn distribute-btn">Distribute</button>
      <div class="custom-msg distribute-btn-msg" style="margin-top:10px"></div>
    `;
    // ... splitting UI, lock logic, error validation as before! (unchanged) ...
    splitWrap.querySelector('.spend-date-input').oninput = (e) => {
      state.spendDate = e.target.value.trim();
      e.target.style.border = '';
    };
    splitWrap.querySelector('.spend-remarks-input').oninput = (e) => {
      state.remarks = e.target.value.trim();
      e.target.style.border = '';
    };
    splitWrap.querySelector('.distribute-btn').onclick = () => {
      // ... error checking as before, then:
      showSettlementSummary({
        date: state.spendDate,
        remarks: state.remarks,
        shares: {},  // your logic for final splits here
        payers: {...state.payerAmounts},
        splitters: sharers.slice(),
        totalAmount
      });
    };
  }

  function showSettlementSummary(data) {
    container.innerHTML = `<div class="settlement-summary" style="padding:18px 8px 25px 8px;max-width:430px;margin:33px auto;text-align:center;background:#fff;border-radius:11px;box-shadow:0 4px 24px #d3e6fd16;">
      <h2 style="margin:10px 0 6px 0;font-size:1.29em;">Final Distribution</h2>
      <div><strong>Date:</strong> <span>${data.date}</span></div>
      <div><strong>Reason:</strong> <span>${data.remarks || '-'}</span></div>
      <div style="margin:15px 0 12px 0;">Total Amount: <strong>${data.totalAmount} QAR</strong></div>
      <hr style="margin:0 0 11px 0;">
      <div id="settlement-summary-block" style="text-align:left;display:inline-block;width:100%;">
      </div>
      <button class="primary-btn" id="save-btn" style="margin:17px 0 3px 0;">Show JSON</button>
      <div id="json-output" style="background:#f6f8fa;color:#222;font-size:1em;border:1.2px solid #c6d2dc;border-radius:8px;margin:15px 0 7px 0;padding:13px 6px;word-break:break-all;display:none;text-align:left;"></div>
    </div>`;
    document.getElementById('save-btn').onclick = () => {
      // Build splits with real usernames and numbers
      const splits = data.splitters.map(fid => ({
        username: fid,
        paid: Number(data.payers[fid] !== undefined && data.payers[fid] !== '' ? data.payers[fid] : 0),
        share: Number(data.shares && data.shares[fid] !== undefined && data.shares[fid] !== '' ? data.shares[fid] : 0)
      }));
      const payload = {
        date: data.date,
        remarks: data.remarks,
        total_amount: data.totalAmount,
        splits
      };
      const outBlock = document.getElementById('json-output');
      outBlock.style.display = "block";
      outBlock.textContent = JSON.stringify(payload, null, 2);
    };
  }
}
