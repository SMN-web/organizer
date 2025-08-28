export async function showNewSpend(container, user) {
  // Helper: get token & profile username
  async function fetchTokenAndUsername() {
    if (!user?.firebaseUser) throw new Error("Not logged in");
    await user.firebaseUser.reload();
    const token = await user.firebaseUser.getIdToken(true);
    // Fetch backend user profile (for username)
    const profileResp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/userpanel", {
      headers: { Authorization: "Bearer " + token }
    });
    const profile = await profileResp.json();
    if (!profile.username) throw new Error("User profile incomplete");
    return { token, username: profile.username, name: profile.name };
  }

  // Fetch all friends (accepted only)
  let currentUser, currentName, token, FRIENDS = [];
  try {
    let rec = await fetchTokenAndUsername();
    token = rec.token;
    currentUser = rec.username;
    currentName = rec.name;
    let fr = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/friends/list", { headers: { Authorization: "Bearer " + token }});
    if (!fr.ok) throw new Error("Failed to fetch friend list");
    let freshFriends = await fr.json();
    FRIENDS = [{ id: "me", name: "Me", username: currentUser }]
      .concat(freshFriends.map(f => ({ id: f.username, name: f.name, username: f.username })));
  } catch (e) {
    container.innerHTML = "Auth or friend list error: " + e.message;
    return;
  }

  function getFriendById(id) {
    return id === "me"
      ? { id: "me", name: "Me", username: currentUser }
      : FRIENDS.find(f => f.id === id || f.username === id) || { id, name: id, username: id };
  }

  // State management
  let state = {
    editing: true,
    selectedFriends: ["me"],
    payers: ["me"],
    payerAmounts: { "me": "" },
    spendDate: "",
    remarks: "",
    lastSplit: null
  };

  renderAll();

  function renderAll() {
    container.innerHTML = `
      <div class="split-setup-panel">
        <h2>Add New Expense</h2>
        <div style="margin:7px 0;">
          <span style="font-weight:bold;">Friends Sharing:</span>
          <div>
            ${FRIENDS.map(f =>
              `<label style="margin-right:10px;">
                <input type="checkbox" name="friend" value="${f.id}" ${state.selectedFriends.includes(f.id) ? "checked" : ""} ${f.id === "me" ? "disabled" : ""}>
                ${f.name} <span style="color:#888;font-size:0.93em;">(${f.username})</span>
              </label>`
            ).join('')}
          </div>
        </div>
        <div style="margin:7px 0;">
          <span style="font-weight:bold;">Paid By:</span>
          <div>
            ${state.selectedFriends.map(fid =>
              `<span style="margin-right:10px;">
                <input type="checkbox" class="payer-check" value="${fid}" ${state.payers.includes(fid) ? "checked" : ""}>
                ${getFriendById(fid).name}
                <input type="number" class="payer-amt" style="width:52px" min="0" placeholder="0" value="${state.payerAmounts[fid] ?? ""}" ${state.payers.includes(fid) ? "" : "disabled"}>
              </span>`
            ).join('')}
          </div>
        </div>
        <div style="margin:7px 0;">
          <label>Date: <input type="date" id="spend-date" value="${state.spendDate || ""}" max="${todayDate()}" /></label>
        </div>
        <div style="margin:7px 0;">
          <label>Remarks/Place:
            <input type="text" id="spend-remarks" maxlength="90" style="width:80%;" value="${state.remarks || ""}" placeholder="E.g. Dinner, Mall, Friends..."/>
          </label>
        </div>
        <div id="calc-messages" style="color:#b21414;font-weight:bold;margin-bottom:4px;"></div>
        <button id="calc-btn">${state.editing ? "Calculate Distribution" : "Edit"}</button>
      </div>
      <div id="distribution-result"></div>
    `;

    container.querySelectorAll("input[name=friend]").forEach(box => {
      box.onchange = () => {
        if (box.checked && !state.selectedFriends.includes(box.value)) {
          state.selectedFriends.push(box.value);
        } else if (!box.checked && box.value !== "me") {
          state.selectedFriends = state.selectedFriends.filter(f => f !== box.value);
          state.payers = state.payers.filter(f => state.selectedFriends.includes(f));
          delete state.payerAmounts[box.value];
        }
        renderAll();
      };
    });

    container.querySelectorAll(".payer-check").forEach(box => {
      box.onchange = () => {
        if (box.checked && !state.payers.includes(box.value)) {
          state.payers.push(box.value);
        } else if (!box.checked) {
          state.payers = state.payers.filter(f => f !== box.value);
        }
        renderAll();
      };
    });

    container.querySelectorAll(".payer-amt").forEach(input => {
      input.oninput = e => {
        const v = e.target.value.replace(/[^0-9]/g, "");
        state.payerAmounts[input.parentNode.querySelector("input").value] = v;
        e.target.value = v;
      };
    });

    container.querySelector("#spend-date").oninput = e => state.spendDate = e.target.value;
    container.querySelector("#spend-remarks").oninput = e => state.remarks = e.target.value;

    container.querySelector("#calc-btn").onclick = () => {
      if (state.editing) {
        const msgEl = container.querySelector('#calc-messages');
        if (state.selectedFriends.length < 2 || !state.selectedFriends.includes("me")) {
          msgEl.textContent = "Select yourself ('Me') and at least one friend.";
          return;
        }
        if (state.payers.length === 0) {
          msgEl.textContent = "At least one payer required.";
          return;
        }
        let amt = 0;
        for (let f of state.payers) {
          let v = parseInt(state.payerAmounts[f] || "0", 10);
          if (isNaN(v) || v < 0) {
            msgEl.textContent = "All payers must have a non-negative amount.";
            return;
          }
          amt += v;
        }
        if (amt <= 0) {
          msgEl.textContent = "Total paid must be positive.";
          return;
        }
        if (!state.spendDate) {
          msgEl.textContent = "Enter a date.";
          return;
        }
        if (!state.remarks.trim()) {
          msgEl.textContent = "Enter a remark or place.";
          return;
        }
        // --> Calculate distribution
        const nSplit = state.selectedFriends.length;
        let perShare = Math.round(amt / nSplit);
        let shares = {};
        state.selectedFriends.forEach((f, i) => shares[f] = perShare + (i == nSplit - 1 ? amt - perShare * nSplit : 0));
        state.lastSplit = {
          totalAmount: amt,
          shares,
          payers: Object.fromEntries(state.payers.map(f => [f, parseInt(state.payerAmounts[f] || "0", 10)])),
          date: state.spendDate,
          remarks: state.remarks.trim(),
          splitters: state.selectedFriends.slice()
        };
        state.editing = false;
        renderAll();
        renderDistribution();
      } else {
        // Edit - reset
        state.editing = true;
        state.lastSplit = null;
        renderAll();
      }
    };
  }

  function renderDistribution() {
    const dRes = container.querySelector("#distribution-result");
    const data = state.lastSplit;
    dRes.innerHTML = `
      <h3>Final Distribution</h3>
      <div><b>Date:</b> ${data.date}</div>
      <div><b>Remarks:</b> ${data.remarks}</div>
      <div><b>Total Amount:</b> ${data.totalAmount}</div>
      <div><u>Paid:</u><br>
        ${data.splitters.map(fid => `${getFriendById(fid).name} (${getFriendById(fid).username}): ${data.payers[fid] || 0}`).join('<br>')}
      </div>
      <div><u>Share:</u><br>
        ${data.splitters.map(fid => `${getFriendById(fid).name}: ${data.shares[fid]}`).join('<br>')}
      </div>
      <div id="save-messages" style="color:#b21414;font-weight:bold;margin:8px 0;"></div>
      <button id="save-btn">Save</button>
      <button id="pdf-btn" style="display:none;">Print as PDF</button>
      <button id="back-btn" style="display:none;">Add New Expense</button>
      <div id="settlement-result"></div>
    `;
    dRes.querySelector("#save-btn").onclick = async () => {
      const saveMsg = dRes.querySelector("#save-messages");
      saveMsg.textContent = "Saving...";
      let splits = data.splitters.map(fid => ({
        username: fid === "me" ? currentUser : fid,
        paid: data.payers[fid] || 0,
        share: data.shares[fid] || 0
      }));
      const payload = {
        date: data.date,
        remarks: data.remarks,
        total_amount: data.totalAmount,
        splits
      };
      let resp = await fetch("https://ne-sp.nafil-8895-s.workers.dev/api/spends", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      if (resp.ok && json.ok) {
        saveMsg.style.color = "#148830";
        saveMsg.textContent = "Saved! Now you can print or add another.";
        dRes.querySelector("#save-btn").style.display = "none";
        dRes.querySelector("#pdf-btn").style.display = "inline-block";
        dRes.querySelector("#back-btn").style.display = "inline-block";
        dRes.querySelector("#pdf-btn").onclick = () => window.print();
        dRes.querySelector("#back-btn").onclick = () => location.reload();
      } else {
        saveMsg.textContent = "Save error: " + (json.error || resp.status);
      }
    };
  }

  function todayDate() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
}
