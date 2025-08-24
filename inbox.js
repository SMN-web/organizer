import { showSpinner, hideSpinner, delay } from './spinner.js';

export function showInbox(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  async function loadInbox() {
    const start = Date.now();
    if (!user?.firebaseUser) {
      await delay(1200); hideSpinner(container);
      container.innerHTML = `<div style="color:#c00">Please log in.</div>`;
      return;
    }
    let requests = [], errMsg = "";
    try {
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/inbox', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const text = await res.text();
      try { requests = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
      if (!Array.isArray(requests)) {
        if (requests && requests.error) errMsg = "Backend error: " + requests.error;
        else errMsg = "Unexpected backend error: " + text;
      }
    } catch (e) { errMsg = "Network error: " + e.message; }

    await delay(Math.max(0, 2000 - (Date.now() - start))); // at least 2 seconds
    hideSpinner(container);

    if (errMsg) {
      container.innerHTML = `<div style="color:#d12020;font-size:1.1em;margin:1.5em 0;">${errMsg}</div>`;
      return;
    }
    if (requests.length === 0) {
      container.innerHTML = `<div style="margin:2em 0;color:#888;">No pending friend requests.</div>`;
      return;
    }
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;">
        Friend Requests Inbox
        <span style="font-weight:500;background:#eee;color:#444;padding:0px 11px 2px 9px;border-radius:12px;font-size:1em;position:relative;top:-2px;margin-left:0.7em;">
          ${requests.length}
        </span>
      </div>
      <div id="reqList" style="margin-top:18px;"></div>
    `;
    const reqList = container.querySelector("#reqList");
    requests.forEach(req => {
      const name = req.name || req.username;
      const uname = req.username;
      const row = document.createElement("div");
      row.style = "margin:14px 0;display:flex;align-items:center;gap:18px;";
      row.innerHTML = `
        <div style="flex:1 1 0;display:flex;flex-direction:column;">
          <span style="font-size:1.08em;font-weight:500;">${name}</span>
          <span style="font-size:0.97em;color:#888;margin-top:-1px;">@${uname}</span>
        </div>
        <button class="acceptBtn" style="background:#3AC66F;color:#fff;border:none;border-radius:6px;padding:0.5em 1.2em;font-size:1em;cursor:pointer;">Accept</button>
        <button class="rejectBtn" style="background:#D84040;color:#fff;border:none;border-radius:6px;padding:0.5em 1.2em;font-size:1em;margin-left:4px;cursor:pointer;">Reject</button>
        <span class="actionResp" style="margin-left:10px;font-size:0.96em;"></span>
      `;

      row.querySelector(".acceptBtn").onclick = async () => {
        row.querySelector(".acceptBtn").disabled = true;
        row.querySelector(".rejectBtn").disabled = true;
        row.querySelector(".actionResp").innerText = "Processing...";
        showSpinner(container);
        await delay(1200);
        try {
          const token = await user.firebaseUser.getIdToken();
          const resp = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/accept', {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ username: req.username })
          });
          const result = await resp.json();
          hideSpinner(container);
          if (result.ok) {
            row.innerHTML = `
              <div style="flex:1 1 0;display:flex;flex-direction:column;">
                <span style="font-size:1.08em;font-weight:500;">${name}</span>
                <span style="font-size:0.97em;color:#888;margin-top:-1px;">@${uname}</span>
              </div>
              <span style="color:#178d3c;font-weight:600;">Accepted!</span>`;
          } else {
            row.querySelector(".actionResp").innerHTML = `<span style="color:#d12020;">${result.error || "Error"}</span>`;
          }
        } catch (e) {
          hideSpinner(container);
          row.querySelector(".actionResp").innerHTML = `<span style="color:#d12020;">${e.message}</span>`;
        }
      };
      row.querySelector(".rejectBtn").onclick = async () => {
        row.querySelector(".acceptBtn").disabled = true;
        row.querySelector(".rejectBtn").disabled = true;
        row.querySelector(".actionResp").innerText = "Processing...";
        showSpinner(container);
        await delay(1200);
        try {
          const token = await user.firebaseUser.getIdToken();
          const resp = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/reject', {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ username: req.username })
          });
          const result = await resp.json();
          hideSpinner(container);
          if (result.ok) {
            row.innerHTML = `
              <div style="flex:1 1 0;display:flex;flex-direction:column;">
                <span style="font-size:1.08em;font-weight:500;">${name}</span>
                <span style="font-size:0.97em;color:#888;margin-top:-1px;">@${uname}</span>
              </div>
              <span style="color:#d12020;font-weight:600;">Rejected</span>`;
          } else {
            row.querySelector(".actionResp").innerHTML = `<span style="color:#d12020;">${result.error || "Error"}</span>`;
          }
        } catch (e) {
          hideSpinner(container);
          row.querySelector(".actionResp").innerHTML = `<span style="color:#d12020;">${e.message}</span>`;
        }
      };
      reqList.appendChild(row);
    });
  }
  loadInbox();
}
