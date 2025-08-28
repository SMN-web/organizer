export async function showNewSpend(container, user) {
  // --- FETCH DYNAMIC FRIENDS & USER ---
  let FRIENDS = [];
  let loggedInUsername = null;
  let token = null;

  async function getUserProfileAndFriends() {
    if (!user?.firebaseUser) throw new Error("Not logged in");
    await user.firebaseUser.reload();
    token = await user.firebaseUser.getIdToken(true);

    // Get current user's username and name
    const profileResp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/userpanel", { headers: { Authorization: "Bearer " + token } });
    const profile = await profileResp.json();
    if (!profile.username) throw new Error("User profile incomplete");
    loggedInUsername = profile.username;

    // Get actual friends (accepted)
    const frResp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/friends/list", { headers: { Authorization: "Bearer " + token } });
    if (!frResp.ok) throw new Error("Failed to fetch friend list");
    const allFriends = await frResp.json();

    // Always prepend "me" to the dynamic friend list
    return [
      { id: "me", name: "Me", username: loggedInUsername },
      ...allFriends.map(f => ({ id: f.username, name: f.name, username: f.username }))
    ];
  }

  try {
    FRIENDS = await getUserProfileAndFriends();
  } catch (e) {
    container.innerHTML = `<div style="color:#b21414;padding:2em;font-size:1.13em;">Auth or friend list error: ${e.message || e}</div>`;
    return;
  }

  function getFriendById(id) {
    if (id === "me") return { id: "me", name: "Me", username: loggedInUsername };
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
      selectedFriends: ["me"],
      payers: ["me"],
      payerAmounts: { "me": "" },
      lastSplit: null,
      spendDate: "",
      remarks: ""
    };
  }
  let state = initialState();
  let lastSuccessMsg = "";

  renderAll();

  // --- MAIN RENDER ---
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
      `<span class="chosen-chip" data-id="${id}">${getFriendById(id).name}${state.editing && id!=="me" ? '<span class="chip-x">×</span>' : ''}</span>`
    ).join('');
    if (state.editing) {
      chips.querySelectorAll('.chosen-chip').forEach(chip => {
        chip.onclick = () => {
          if(chip.dataset.id==="me") return;
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
            state.selectedFriends = Array.from(new Set(state.selectedFriends)).sort((a,b)=>a==='me'?-1:b==='me'?1:0);
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
        if (!state.selectedFriends.includes('me') || state.selectedFriends.length < 2) {
          msgBox.textContent = "Please select yourself ('Me') and at least one more friend.";
          return;
        }
        if (!state.payers.includes('me') || !/^\d+$/.test(state.payerAmounts['me'] || "") || rup(state.payerAmounts['me']) < 0) {
          msgBox.textContent = "'Me' must be added and have a paid amount (0 or more).";
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

    splitWrap.querySelector('.distribute-btn').onclick = () => {
      const distributeMsg = splitWrap.querySelector('.distribute-btn-msg');
      distributeMsg.textContent = "";
      let shares = {};
      splitWrap.querySelectorAll('.split-amt').forEach(input => {
        const val = rup(input.value);
        shares[input.dataset.id] = val;
      });
      let sum = Object.values(shares).reduce((a, b) => a + b, 0);

      const dateInput = splitWrap.querySelector('.spend-date-input');
      const remarkInput = splitWrap.querySelector('.spend-remarks-input');
      let valid = true;
      if (!state.spendDate) {
        dateInput.style.border = '2px solid #e44b56';
        distributeMsg.textContent = "Date is required.";
        valid = false;
      }
      if (!state.remarks) {
        remarkInput.style.border = '2px solid #e44b56';
        distributeMsg.textContent = distributeMsg.textContent
          ? "Date and Remarks/Place are required."
          : "Remarks/Place is required.";
        valid = false;
      }
      if (!valid) return;

      let overAssigned = Object.values(shares).some(v => v > totalAmount);
      let negativeAssigned = Object.values(shares).some(v => v < 0);

      if (overAssigned) {
        distributeMsg.textContent = "You are assigning more than the total spend value to a user.";
        distributeMsg.style.color = "#e44b56";
        return;
      }
      if (negativeAssigned) {
        distributeMsg.textContent = "Negative values are not allowed.";
        distributeMsg.style.color = "#e44b56";
        return;
      }
      if (sum !== totalAmount) {
        distributeMsg.textContent = sum > totalAmount
          ? "Distribution exceeds total spend!"
          : "Distributed amount is less than the total spend!";
        distributeMsg.style.color = "#e44b56";
        return;
      }

      showSettlementSummary({
        date: state.spendDate,
        remarks: state.remarks,
        shares,
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
      ${renderSettlementBlock(data)}
      </div>
      <button class="primary-btn" id="save-btn" style="margin:17px 0 3px 0;">Save</button>
      <button class="primary-btn" id="pdf-btn" style="margin-left:12px;display:none;">Print as PDF</button>
      <button class="primary-btn" id="new-expense-btn" style="display:none;">Add New Expense</button>
      <div id="save-result" style="margin-top:10px;font-weight:bold"></div>
    </div>`;

    document.getElementById('save-btn').onclick = async () => {
      const saveStatus = document.getElementById('save-result');
      saveStatus.textContent = "Saving...";
      const splits = data.splitters.map(fid => ({
        username: fid === "me" ? loggedInUsername : fid,
        paid: data.payers[fid] || 0,
        share: data.shares[fid] || 0
      }));
      try {
        const resp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/spends", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            date: data.date,
            remarks: data.remarks,
            total_amount: data.totalAmount,
            splits
          })
        });
        let out = null;
        try {
          out = await resp.json();
        } catch (err) {
          saveStatus.textContent = "Couldn't parse server response. Status: " + resp.status;
          return;
        }
        if (resp.ok && out && out.ok) {
          saveStatus.textContent = "Saved! Now you can print or add another.";
          document.getElementById('save-btn').style.display = "none";
          document.getElementById('pdf-btn').style.display = "";
          document.getElementById('new-expense-btn').style.display = "";
        } else {
          saveStatus.textContent = "Error saving: " + (out && out.error ? out.error : resp.status);
        }
      } catch (e) {
        saveStatus.textContent = "Error: " + (e.message || e);
      }
    };

    document.getElementById('pdf-btn').onclick = () => {
      window.print();
    };

    document.getElementById('new-expense-btn').onclick = () => {
      state = initialState();
      lastSuccessMsg = "";
      renderAll();
    };
  }

  function renderSettlementBlock(data) {
    let paidLines = data.splitters.map(id =>
      `<div class="row-settle">${getFriendById(id).name} paid: <em>${rup(data.payers[id]||0)} QAR</em></div>`
    ).join('');
    let shareLines = data.splitters.map(id =>
      `<div class="row-settle">${getFriendById(id).name}'s share: <em>${rup(data.shares[id]||0)} QAR</em></div>`
    ).join('');

    let settlements = [];
    let net = {};
    data.splitters.forEach(id => {
      net[id] = (rup(data.payers[id]||0)) - (rup(data.shares[id]||0));
    });
    let debtors = data.splitters.filter(id => net[id] < 0);
    let creditors = data.splitters.filter(id => net[id] > 0);

    let netCopy = {...net};
    let MAX_ITER = 1000, iter = 0;
    for (let d of debtors) {
      for (let c of creditors) {
        if (netCopy[d] >= 0 || netCopy[c] <= 0) continue;
        let amount = Math.min(-netCopy[d], netCopy[c]);
        if (!amount || amount < 0) continue;
        settlements.push({ from: d, to: c, amount });
        netCopy[d] += amount;
        netCopy[c] -= amount;
        iter++; if (iter > MAX_ITER) break;
      }
    }
    let owesLines = settlements.length
      ? settlements.map(s =>
          `<div class="row-settle"><strong>${getFriendById(s.from).name}</strong> owes <em>${s.amount} QAR</em> to <strong>${getFriendById(s.to).name}</strong></div>`
        ).join('')
      : `<div>All settled up. No pending amounts.</div>`;

    return `
      <div><u>Paid Amounts:</u></div>${paidLines}
      <div style="margin:10px 0 0 0"><u>Each Share:</u></div>${shareLines}
      <div style="margin:10px 0 0 0"><u>Owes/Settlement:</u></div>${owesLines}
    `;
  }
}
