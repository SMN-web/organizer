const CURRENCY = localStorage.getItem('currency') || "QAR";

// Helper: for legacy string or {name,username} object
function displayName(user) {
  if (!user) return "";
  if (typeof user === "string") return user;
  if (typeof user.name === "string") return user.name;
  return "";
}

// Helper for safe escape
function escapeHtml(str) {
  return String(str || "").replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const then = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - then) / 1000);
  if (isNaN(seconds)) return "";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [full] = dateStr.split(' ');
  const [y, m, d] = full.split('-');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${parseInt(d, 10)}-${months[parseInt(m, 10) - 1]}-${y.slice(2)}`;
}

function approvalBranchHTML(creator, rows) {
  const rowHeight = 31;
  const branchHeight = rows.length * rowHeight - 8;
  const statusColor = s => s === "accepted" ? "#187f2c" : (s === "disputed" ? "#cc2020" : "#b08c00");
  const nameColor = s => s === "accepted" ? "#187f2c" : (s === "disputed" ? "#cc2020" : "#a89a00");
  return `
  <div>
    <div style="font-weight:700;color:#222;font-size:0.99em;letter-spacing:0.04em;margin-bottom:1.5px;">
      ${escapeHtml(displayName(creator))}
    </div>
    <div style="display:flex;">
      <div style="display:flex;flex-direction:column;align-items:center;width:22px;position:relative;">
        <div style="height:2px;"></div>
        <div style="width:0; border-left:2.2px solid #b0b8be; height:${branchHeight}px; min-height:13px;"></div>
      </div>
      <div>
      ${rows.map(r => `
        <div style="display:flex;align-items:center;height:${rowHeight}px;">
          <div style="width:24px;border-bottom:2.2px solid #b0b8be;"></div>
          <span style="color:${nameColor(r.status)};font-weight:600;font-size:0.98em;margin-left:8px;margin-right:8px;">
            ${escapeHtml(displayName(r))}
          </span>
          <span style="color:${statusColor(r.status)};font-weight:700;font-size:0.96em;margin-right:7px;">
            ${r.status.charAt(0).toUpperCase() + r.status.slice(1)}
          </span>
          ${(r.status !== "pending" && r.timestamp)
      ? `<span style="color:#848189;font-size:0.93em;font-weight:500;margin-left:4px;">${timeAgo(r.timestamp)}</span>`
      : ""}
        </div>
      `).join('\n')}
      </div>
    </div>
  </div>
  `;
}

// Main entry point
export async function showCreatedByMePanel(container, user) {
  container.innerHTML = '<div style="padding:30px;text-align:center;font-size:1.05em;">Loading...</div>';
  let spendsData = [];
  let errMsg = '';
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://cr-me.nafil-8895-s.workers.dev/api/spends/created-by-me', {
      headers: { Authorization: "Bearer " + token }
    });
    const text = await resp.text();
    try { spendsData = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(spendsData)) {
      if (spendsData && spendsData.error) errMsg = "Backend error: " + spendsData.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  if (errMsg) {
    container.innerHTML = `<div style="font-weight:600;font-size:1.09em;margin-bottom:8px;">Created By Me</div>
      <div style="color:#d12020;font-size:1em;margin:1.2em 0 1em 0;text-align:center;">${escapeHtml(errMsg)}</div>`;
    return;
  }
  renderSpendsArea(container, user, spendsData);
}

function renderSpendsArea(container, user, spendsData) {
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.01em;margin-bottom:7px;">Created By Me</div>
    <div class="createdbyme-folder-list"></div>
  `;
  const listArea = container.querySelector('.createdbyme-folder-list');
  if (!spendsData.length) {
    listArea.innerHTML = `<div style="color:#666;text-align:center;margin:2em 0 1em 0;font-size:0.98em;">
      No spends created by you yet.
    </div>`;
    return;
  }
  spendsData.forEach(item => {
    const accepted = (item.involvedStatus || []).filter(u => u.status === 'accepted').length;
    const total = (item.involvedStatus || []).length;
    const statusHtml = item.status === 'disputed'
      ? `<span class="status-pill disputed">Disputed</span>`
      : `<span class="status-pill pending">${item.status === "accepted" ? "Accepted" : "Pending"} ${accepted}/${total}</span>`;
    const row = document.createElement("div");
    row.className = "approval-folder";
    row.tabIndex = 0;
    row.style = `display:flex;align-items:flex-start;gap:11px;
      padding:9px 7px 10px 7px;
      border-bottom:1px solid #eee;font-size:0.97em;cursor:pointer;transition:background 0.2s;`;
    row.innerHTML = `
      <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:6px;">${item.sn}.</span>
      <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
        <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:2.5px;">${escapeHtml(item.remarks || "")}</div>
        <div class="date" style="color:#566b89;font-size:0.95em;">${formatDisplayDate(item.date || "")}</div>
        <div class="by" style="color:#209;font-size:0.93em;">by You</div>
      </div>
      ${statusHtml}
    `;
    row.onclick = () => showCreatedByMeDetails(container, user, item);
    row.onmouseover = () => row.style.backgroundColor = '#f8f9fa';
    row.onmouseout = () => row.style.backgroundColor = '';
    listArea.appendChild(row);
  });
}

function showCreatedByMeDetails(container, user, item) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <button id="backBtn" style="background:none;border:1px solid #ddd;border-radius:7px;padding:6px 14px;cursor:pointer;display:flex;align-items:center;gap:7px;font-size:0.96em;">← Back</button>
      <h3 style="margin:0;font-weight:600;font-size:1.07em;color:#1b2837;">Expense Details</h3>
      <div></div>
    </div>
    <div id="detailArea"></div>
  `;
  container.querySelector('#backBtn').onclick = function () {
    showCreatedByMePanel(container, user);
  };
  const detailArea = container.querySelector('#detailArea');
  // Dispute message
  let disputeMsg = "";
  if (item.status === "disputed" && item.disputed_by) {
    disputeMsg = `<div style="color:#d12020;font-weight:700;font-size:0.98em;margin:15px 0 8px 0;">
      ${escapeHtml(displayName(item.disputed_by))} has disputed this expense <span style="color:#656;font-weight:500;">${timeAgo(item.disputed_at)}</span>.
    </div>`;
  }
  detailArea.innerHTML = `
    <div style="margin-bottom:12px;">
      <div style="font-weight:700;font-size:1em;color:#1b2837;">${escapeHtml(item.remarks)}</div>
      <div style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
      <div style="color:#209;font-size:0.93em;margin-bottom:4px;">by You</div>
      <div style="font-size:0.99em;color:#222;margin-bottom:2px;">Total: <span style="font-weight:700;">${item.total_amount} ${CURRENCY}</span></div>
      <div style="color:#888;font-size:0.96em; margin-bottom:3px;">Status last updated: <b>${timeAgo(item.status_at)}</b></div>
    </div>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#164fa4;letter-spacing:.2px;">Paid/Shares</div>
    <table style="border-collapse:collapse;width:auto;margin-bottom:9px;">
      ${(item.splits||[]).map(s => `
        <tr>
          <td style="padding:2px 8px 2px 0; color:#221;font-weight:600;min-width:5em;">
            ${escapeHtml(displayName(s))}:
          </td>
          <td style="padding:2px 8px; color:#222;">paid <span style="font-weight:700;color:#222">${s.paid} ${CURRENCY}</span></td>
          <td style="padding:2px 5px; color:#567;">share <span style="font-weight:700;color:#222">${s.share} ${CURRENCY}</span></td>
        </tr>
      `).join('')}
    </table>
    <div style="font-weight:700;margin:10px 0 5px 0;color:#23875e;letter-spacing:.2px;">Settlements</div>
    <table style="border-collapse:collapse;margin-bottom:8px;">
      ${(item.settlements||[]).length
        ? item.settlements.map(st => `
          <tr>
            <td style="padding:2px 8px 2px 0; color:#555;min-width:8em;text-align:right;">
              ${escapeHtml(displayName(st.from))}
            </td>
            <td style="padding:2px 2px; color:#888;width:24px;text-align:center;">
              <span style="font-size:1.12em;">&#8594;</span>
            </td>
            <td style="padding:2px 9px 2px 0; color:#333;">
              ${escapeHtml(displayName(st.to))}: <span style="font-weight:700;color:#222">${st.amount} ${CURRENCY}</span>
            </td>
          </tr>
        `).join('')
        : '<tr><td>No settlements needed</td></tr>'}
    </table>
    <div style="border-top:1px solid #e8eaed;margin-top:10px;padding-top:8px;margin-bottom:9px;">
      <div style="font-size:0.96em;color:#556;margin-bottom:6px;font-weight:700;">Participants approvals:</div>
      ${approvalBranchHTML(
        item.created_by,
        (item.involvedStatus || []).map(u => ({
          ...u,
          name: displayName(u)
        }))
      )}
      ${disputeMsg}
      ${(item.status === "disputed")
        ? `<button id="editBtn" style="margin-top:14px; padding:8px 24px; font-size:1em; border-radius:8px; background:#2268c5; color:#fff; border:none; font-weight:600;">Edit</button>`
        : ""}
    </div>
  `;
  if (item.status === "disputed") {
    document.getElementById('editBtn').onclick = function(){ alert('Edit pressed!'); };

  }
}


// Paste the full 'showCreatedByMeEditPanel' implementation from the previous answer here!
// In createdByMe.js - paste this after your helpers, and call this from your edit button



async function showCreatedByMeEditPanel(container, user, item) {
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

  // Helper for display
  function getFriendById(username) {
    return FRIENDS.find(f => f.username === username);
  }

  // Prefill state ONLY with known usernames (robust against deleted/unknowns)
  const selectedFriends = [];
  const payers = [];
  const payerAmounts = {};
  (item.splits || []).forEach(s => {
    // prefill only if user is actually in FRIENDS
    if (FRIENDS.some(f => f.username === s.username)) {
      if (!selectedFriends.includes(s.username)) selectedFriends.push(s.username);
      if (Number(s.paid) > 0 && !payers.includes(s.username)) payers.push(s.username);
      payerAmounts[s.username] = s.paid;
    }
  });

  // For diagnostics, you may want to know if any user not found in FRIENDS
  const notFound = (item.splits || []).filter(s => !FRIENDS.some(f=>f.username===s.username));
  if (notFound.length) {
    console.warn("Some usernames from splits not found in FRIENDS:", notFound.map(s=>s.username));
  }

  let state = {
    editing: true,
    selectedFriends: [...selectedFriends],
    payers: [...payers],
    payerAmounts: { ...payerAmounts },
    lastSplit: null,
    spendDate: (item.date && item.date.length === 10) ? item.date : (item.date ? item.date.split(' ')[0] : todayDate()),
    remarks: item.remarks || ""
  };

  renderAll();

  function renderAll() {
    container.innerHTML = `
      <button style="margin-bottom:20px" class="primary-btn" id="editBackBtn">← Back</button>
      <div class="split-setup-panel" style="max-width:500px;margin:0 auto;">
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
        <div class="distribution-meta" style="margin:19px 0 13px 0;">
          <label>Date: <input type="date" class="spend-date-input" value="${state.spendDate || ""}" max="${todayDate()}" /></label>
          <label class="distrib-remarks-label" style="margin-top:7px;">Remarks/Place:
            <input type="text" class="spend-remarks-input" maxlength="90" style="width:99%;margin-top:4px;" value="${state.remarks || ""}" placeholder="E.g. Dinner, Mall, Friends..." />
          </label>
        </div>
        <button type="button" class="primary-btn calc-btn">${state.editing ? "Split & Next" : "Edit"}</button>
        <div class="custom-msg calc-btn-msg" style="margin-top:7px;"></div>
      </div>
      <div class="split-results-container" style="margin-top:20px;"></div>
    `;
    container.querySelector('#editBackBtn').onclick = () => showCreatedByMeDetails(container, user, item);
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
    chips.innerHTML = state.selectedFriends.map(username =>
      `<span class="chosen-chip" data-id="${username}">${
        getFriendById(username)?.name || `[Unknown: ${username}]`
      }${state.editing && username!==loggedInUsername ? '<span class="chip-x">×</span>' : ''}</span>`
    ).join('');
    if (state.editing) {
      chips.querySelectorAll('.chosen-chip').forEach(chip => {
        chip.onclick = () => {
          if(chip.dataset.id===loggedInUsername) return;
          state.selectedFriends = state.selectedFriends.filter(fid => fid !== chip.dataset.id);
          state.payers = state.payers.filter(pid => pid !== chip.dataset.id);
          delete state.payerAmounts[chip.dataset.id];
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
        const isSel = state.selectedFriends.includes(f.username);
        let div = document.createElement('div');
        div.className = "selector-item" + (isSel ? " selected used" : "");
        div.textContent = f.name + (f.username && f.name!==f.username ? " (" + f.username + ")" : "");
        if (!isSel && state.editing) {
          div.onclick = () => {
            state.selectedFriends.push(f.username);
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
    let addOptions = state.selectedFriends.filter(username => !state.payers.includes(username));
    addOptions.forEach(username => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip';
      chip.textContent = getFriendById(username)?.name || `[Unknown: ${username}]`;
      let x = document.createElement('span');
      x.className = 'chip-x'; x.textContent = '+';
      chip.appendChild(x);
      if (state.editing) {
        chip.onclick = () => {
          state.payers.push(username); state.payerAmounts[username] = '';
          renderAll();
        };
      }
      chip.style.background = "#f7f7f7"; chip.style.color = "#393939"; chip.style.border = "1.1px solid #d2dbe0";
      payersDiv.appendChild(chip);
    });
    state.payers.forEach(username => {
      let chip = document.createElement('span');
      chip.className = 'chosen-chip selected-payer';
      chip.innerHTML = `
        ${getFriendById(username)?.name || `[Unknown: ${username}]`}
        ${state.editing ? '<span class="chip-x" style="pointer-events:all;">×</span>' : ''}
        <input type="number" class="payer-amt" min="0" step="1" value="${state.payerAmounts[username] ?? ''}" placeholder="Amt" ${state.editing ? '' : 'readonly'} />
      `;
      if (state.editing) {
        chip.onclick = e => {
          if (e.target.classList.contains('chip-x') || e.target === chip) {
            state.payers = state.payers.filter(pid => pid !== username);
            delete state.payerAmounts[username];
            renderAll();
          }
        };
        chip.querySelector('.payer-amt').oninput = (ev) => {
          let val = ev.target.value.replace(/[^0-9]/g, '');
          ev.target.value = val;
          state.payerAmounts[username] = val;
          updateTotalDisplay();
        };
      }
      payersDiv.appendChild(chip);
    });
    updateTotalDisplay();
  }

  function updateTotalDisplay() {
    let sum = state.payers.reduce((acc, username) => acc + rup(state.payerAmounts[username]), 0);
    const disp = container.querySelector('#totalDisplay');
    if (state.payers.length) {
      disp.style.display = '';
      disp.textContent = isNaN(sum) ? "" : `Total Paid: ${sum} ${CURRENCY}`;
    } else {
      disp.style.display = "none"; disp.textContent = "";
    }
  }

  function setupButton() {
    const calcBtn = container.querySelector('.calc-btn');
    const msgBox = container.querySelector('.calc-btn-msg');
    calcBtn.onclick = () => {
      if (!state.selectedFriends.includes(loggedInUsername) || state.selectedFriends.length < 2) {
        msgBox.textContent = "Please select yourself and at least one more friend.";
        return;
      }
      if (!state.payers.includes(loggedInUsername) || !/^\d+$/.test(state.payerAmounts[loggedInUsername] || "") || rup(state.payerAmounts[loggedInUsername]) < 0) {
        msgBox.textContent = "You must be added as a payer and have a paid amount (0 or more).";
        return;
      }
      for (let username of state.payers) {
        if (!/^\d+$/.test(state.payerAmounts[username] || "") || rup(state.payerAmounts[username]) < 0) {
          msgBox.textContent = "All payers must have a non-negative paid amount.";
          return;
        }
      }
      let total = state.payers.reduce((acc, username) => acc + rup(state.payerAmounts[username]), 0);
      if (total <= 0) {
        msgBox.textContent = "Total paid amount must be positive.";
        return;
      }
      msgBox.textContent = "";
      state.lastSplit = { sharers: state.selectedFriends.slice(), total };
      state.editing = false;
      renderAll();
    };
  }

  function renderSplitPanel(sharers, totalAmount) {
    const splitWrap = container.querySelector('.split-results-container');
    splitWrap.innerHTML = `
      <h3 style="font-size:1.12em;margin:0 0 10px;font-weight:600;">Split Among Friends</h3>
      <div class="split-list"></div>
      <button type="button" class="primary-btn distribute-btn" style="margin-top:12px;">Distribute</button>
      <div class="custom-msg distribute-btn-msg" style="margin-top:10px"></div>
    `;
    let locked = {};
    let lockError = {};
    function renderList() {
      const splitDiv = splitWrap.querySelector('.split-list');
      splitDiv.innerHTML = '';
      let lockedSum = Object.values(locked).reduce((a, b) => a + rup(b), 0);
      let unlocked = sharers.filter(username => !(locked[username]));
      let toSplit = totalAmount - lockedSum;
      let share = unlocked.length > 0 ? rup(toSplit / unlocked.length) : 0;
      let sumPreview = lockedSum + share * unlocked.length;
      let diff = sumPreview - totalAmount;
      sharers.forEach((username, idx) => {
        let isLocked = username in locked;
        let value = isLocked ? rup(locked[username]) : share;
        if (!isLocked && diff > 0 && idx === sharers.length - 1) value -= diff;
        let showErr = false;
        if (value < 0 || (isLocked && value > totalAmount)) {
          lockError[username] = true;
          showErr = true;
        } else {
          lockError[username] = false;
        }
        splitDiv.innerHTML += `
          <div class="split-row${isLocked ? " locked-row" : ""}">
            <span class="split-row-name">${getFriendById(username)?.name || `[Unknown: ${username}]`}</span>
            <input type="number" class="split-amt" min="0" step="1" value="${value}" data-id="${username}"
              ${isLocked ? 'readonly' : ''}
              style="background:${isLocked ? '#e2eef4' : '#fff'};color:${isLocked ? (showErr ? '#c43422' : '#156b97'):'#25304d'};border:2.2px solid ${(showErr ? '#e44b56' : isLocked ? '#288944':'#d3dae4')};">
            <button class="lock-btn" data-id="${username}" aria-label="${isLocked ? 'Unlock' : 'Lock'}" style="background:none;border:none;font-size:1.42em;">
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
          let username = btn.dataset.id;
          let val = splitDiv.querySelector(`.split-amt[data-id="${username}"]`).value;
          if (rup(val) > totalAmount || rup(val) < 0) {
            lockError[username] = true;
            renderList();
            return;
          }
          if (locked[username] === undefined) {
            locked[username] = rup(val);
          } else {
            delete locked[username];
          }
          renderList();
        };
      });
      splitDiv.querySelectorAll('.split-amt').forEach(input => {
        input.onblur = () => {
          let username = input.dataset.id;
          let val = input.value.replace(/[^0-9]/g, '');
          if (Number(val) > totalAmount || Number(val) < 0) {
            input.value = '';
            renderList();
          }
        };
        input.oninput = () => {
          let username = input.dataset.id;
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

    splitWrap.querySelector('.distribute-btn').onclick = async () => {
      const distributeMsg = splitWrap.querySelector('.distribute-btn-msg');
      distributeMsg.textContent = "";

      let shares = {};
      splitWrap.querySelectorAll('.split-amt').forEach(input => {
        const val = rup(input.value);
        shares[input.dataset.id] = val;
      });

      const spendDate = container.querySelector('.spend-date-input')?.value?.trim();
      const remarks = container.querySelector('.spend-remarks-input')?.value?.trim();
      if (!spendDate) {
        distributeMsg.textContent = "Please select the date";
        return;
      }
      if (!remarks) {
        distributeMsg.textContent = "Please enter a remark";
        return;
      }
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

      const splits = sharers.map(username => ({
        username: username,
        paid: Number(state.payerAmounts[username] ?? 0),
        share: shares[username]
      }));

      distributeMsg.textContent = "Processing preview (add preview and Save here)...";
      // Here you can insert settlement preview + save logic for update.
    };
  }
}
