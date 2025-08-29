export async function showNewSpend(container, user) {
  // --- Fetch dynamic friends & user ---
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
      spendDate: "",
      remarks: ""
    };
  }
  let state = initialState();

  renderAll();

  // --- Main render ---
  function renderAll() {
    container.innerHTML = `
      <div class="split-setup-panel" style="max-width:500px;margin:0 auto;">
        <div class="selector-group">
          <span class="selector-label">Friends Sharing:</span>
          <div class="custom-dropdown friends-dropdown" style="min-width:180px;">
            <div class="dropdown-selected" style="min-width:180px;">Select friends...</div>
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
       
        
        <button type="button" class="primary-btn calc-btn">${state.editing ? "Split & Next" : "Edit"}</button>
        <div class="custom-msg calc-btn-msg" style="margin-top:7px;"></div>
      </div>
      <div class="split-results-container" style="margin-top:20px;"></div>
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
    let locked = {};
    let lockError = {};

    function renderList() {
      const splitDiv = splitWrap.querySelector('.split-list');
      splitDiv.innerHTML = '';
      let lockedSum = Object.values(locked).reduce((a, b) => a + rup(b), 0);
      let unlocked = sharers.filter(id => !(locked[id]));
      let toSplit = totalAmount - lockedSum;
      let share = unlocked.length > 0 ? rup(toSplit / unlocked.length) : 0;
      let sumPreview = lockedSum + share * unlocked.length;
      let diff = sumPreview - totalAmount;
      sharers.forEach((id, idx) => {
        let isLocked = id in locked;
        let value = isLocked ? rup(locked[id]) : share;
        if (!isLocked && diff > 0 && idx === sharers.length - 1) value -= diff;
        let showErr = false;
        if (value < 0 || (isLocked && value > totalAmount)) {
          lockError[id] = true;
          showErr = true;
        } else {
          lockError[id] = false;
        }
        splitDiv.innerHTML += `
          <div class="split-row${isLocked ? " locked-row" : ""}">
            <span class="split-row-name">${getFriendById(id).name}</span>
            <input type="number" class="split-amt" min="0" step="1" value="${value}" data-id="${id}"
              ${isLocked ? 'readonly' : ''}
              style="background:${isLocked ? '#e2eef4' : '#fff'};color:${isLocked ? (showErr ? '#c43422' : '#156b97'):'#25304d'};border:2.2px solid ${(showErr ? '#e44b56' : isLocked ? '#288944':'#d3dae4')};">
            <button class="lock-btn" data-id="${id}" aria-label="${isLocked ? 'Unlock' : 'Lock'}" style="background:none;border:none;font-size:1.42em;">
              ${isLocked
                ? `<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#288944" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="8" rx="2" fill="#e2faf4"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.5" fill="#288944" /></svg>`
                : `<svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#96a1b5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="8" rx="2" fill="#f8fafc"/><path d="M17 11V7a5 5 0 1 0-10 0"/><circle cx="12" cy="16" r="1.5" fill="#96a1b5" /></svg>`
              }
            </button>
            ${showErr 
                ? `<div class="split-error" style="color:#e44b56; font-size:.93em;margin-top:3px;">${isLocked && value > totalAmount 
                    ? "Assigned value exceeds total spend!" 
                    : "Negative value is not allowed!"}</div>` 
                : ""}
          </div>`;
      });
      splitDiv.querySelectorAll('.lock-btn').forEach(btn => {
        btn.onclick = () => {
          let id = btn.dataset.id;
          let val = splitDiv.querySelector(`.split-amt[data-id="${id}"]`).value;
          if (rup(val) > totalAmount) {
            lockError[id] = true;
            renderList();
            return;
          } else if (rup(val) < 0) {
            lockError[id] = true;
            renderList();
            return;
          }
          if (locked[id] === undefined) {
            locked[id] = rup(val);
          } else {
            delete locked[id];
          }
          renderList();
        };
      });
      splitDiv.querySelectorAll('.split-amt').forEach(input => {
        input.onblur = () => {
          let id = input.dataset.id;
          let val = input.value.replace(/[^0-9]/g, '');
          if (Number(val) > totalAmount || Number(val) < 0) {
            input.value = '';
            renderList();
          }
        };
        input.oninput = () => {
          let id = input.dataset.id;
          let val = input.value.replace(/[^0-9]/g, '');
          input.value = val;
          if (Number(val) > totalAmount || Number(val) < 0) {
            input.style.border = '2.2px solid #e44b56';
          } else {
            input.style.border = '';
          }
        };
      });
    }
    renderList();

    splitWrap.querySelector('.spend-date-input').oninput = (e) => {
      state.spendDate = e.target.value.trim();
      e.target.style.border = '';
    };
    splitWrap.querySelector('.spend-remarks-input').oninput = (e) => {
      state.remarks = e.target.value.trim();
      e.target.style.border = '';
    };
    splitWrap.querySelector('.distribute-btn').onclick = async () => {
      const distributeMsg = splitWrap.querySelector('.distribute-btn-msg');
      distributeMsg.textContent = "";

     const spendDate = splitWrap.querySelector('.spend-date-input')?.value?.trim();
     const remarks = splitWrap.querySelector('.spend-remarks-input')?.value?.trim();

      // Build shares object as per UI
      let shares = {};
      splitWrap.querySelectorAll('.split-amt').forEach(input => {
        const val = rup(input.value);
        shares[input.dataset.id] = val;
      });
      if (!spendDate) {
    distributeMsg.textContent = "Please select the date";
    return;
}

      if (!remarks) {
    distributeMsg.textContent = "Please enter a remark";
    return;
}
      // Validate (keep your checks here)
      let sum = Object.values(shares).reduce((a, b) => a + b, 0);
      if (sum !== totalAmount) {
        distributeMsg.textContent = "Distributed amount does not match total.";
        return;
      }
      let overAssigned = Object.values(shares).some(v => v > totalAmount);
      let negativeAssigned = Object.values(shares).some(v => v < 0);
      if (overAssigned) {
        distributeMsg.textContent = "Assigned value exceeds total.";
        return;
      }
      if (negativeAssigned) {
        distributeMsg.textContent = "Negative values not allowed.";
        return;
      }
      // Build splits array (username, paid, share)
      const splits = sharers.map(id => ({
        username: id,
        paid: Number(state.payerAmounts[id] ?? 0),
        share: shares[id]
      }));
      distributeMsg.textContent = "Processing (preview from backend)...";

      // Send to backend for preview/settlement calculation
      const resp = await fetch("https://cal-sp.nafil-8895-s.workers.dev/api/spends/preview", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: state.spendDate,
          remarks: state.remarks,
          total_amount: totalAmount,
          splits
        })
      });
      let preview = {};
      try {
        preview = await resp.json();
      } catch (e) {
        distributeMsg.textContent = "Backend failed to process preview";
        return;
      }
      showSettlementSummary(splits, preview.settlements);
    };
  }

  function showSettlementSummary(splits, settlements) {
    container.innerHTML = `
      <div class="settlement-summary" style="padding:18px 8px 25px 8px;max-width:430px;margin:33px auto;text-align:center;background:#fff;border-radius:11px;box-shadow:0 4px 24px #d3e6fd16;">
        <h2 style="margin:10px 0 6px 0;">Final Distribution</h2>
        <div><strong>Date:</strong> <span>${state.spendDate}</span></div>
        <div><strong>Reason:</strong> <span>${state.remarks || '-'}</span></div>
        <div style="margin:15px 0 12px 0;">Total Amount: <strong>${splits.reduce((a, s) => a + s.paid, 0)} QAR</strong></div>
        <hr>
        <div><u>Paid Amounts:</u><br>
          ${splits.map(s => `<div>${getFriendById(s.username).name} paid: <em>${s.paid} QAR</em></div>`).join('')}
        </div>
        <div style="margin:10px 0 0 0"><u>Each Share:</u><br>
          ${splits.map(s => `<div>${getFriendById(s.username).name}'s share: <em>${s.share} QAR</em></div>`).join('')}
        </div>
        <div style="margin:10px 0 0 0"><u>Owes/Settlement:</u></div>
        ${settlements && settlements.length
          ? settlements.map(st =>
              `<div class="row-settle"><strong>${getFriendById(st.from_user).name}</strong> owes <em>${st.amount} QAR</em> to <strong>${getFriendById(st.to_user).name}</strong></div>`
            ).join('')
          : `<div>All settled up. No pending amounts.</div>`}
        <button class="primary-btn" id="save-btn" style="margin:17px 0 3px 0;">Save</button>
        <button class="primary-btn" id="new-expense-btn" style="margin-left:12px;">Add New Expense</button>
        <div id="save-result" style="margin-top:10px;font-weight:bold"></div>
      </div>
    `;
    document.getElementById('save-btn').onclick = async () => {
  const saveMsg = document.getElementById('save-result');
  saveMsg.textContent = "Saving...";

  // Defensive check
  if (!Array.isArray(splits) || !splits.length) {
    saveMsg.textContent = "Save failed: Splits data missing!";
    return;
  }

  // Build payload
  const payload = {
    date: state.spendDate,
    remarks: state.remarks,
    total_amount: splits.reduce((sum, s) => sum + s.paid, 0),
    splits
  };

  try {
    const resp = await fetch("https://cal-sp.nafil-8895-s.workers.dev/api/spends/save", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let out = {};
    try {
      out = await resp.json();
    } catch {
      saveMsg.textContent = "Server error: Could not parse reply.";
      return;
    }

    if (resp.ok && out.ok) {
      // --- FINAL USER-FRIENDLY MESSAGE ---
      const settlementMsg = out.settlements && out.settlements.length > 0 
        ? ` Settlement(s) created between users.` 
        : "";
      saveMsg.textContent = `Saved! Expense finalized.${settlementMsg}`;

      // Hide save button to prevent duplicate submission
      document.getElementById('save-btn').style.display = "none";

    } else {
      // --- Clean error message ---
      saveMsg.textContent = "Save failed: " + (out.error || "Please try again.");
    }

  } catch (e) {
    saveMsg.textContent = "Save failed: " + (e && e.message ? e.message : e);
  }
};



    document.getElementById('new-expense-btn').onclick = () => {
      state = initialState();
      renderAll();
    };
  }
}
