export function showInbox(container, user) {
  container.innerHTML = `<div style="padding:8px 0 0 0;">Loading...</div>`;

  async function loadInbox() {
    if (!user?.firebaseUser) {
      container.innerHTML = `<div style="color:#c00">Please log in.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken();
    const res = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/inbox', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const requests = await res.json();
    if (!Array.isArray(requests) || requests.length === 0) {
      container.innerHTML = `<div style="margin:2em 0;color:#888;">No pending friend requests.</div>`;
      return;
    }
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.12em;">
        Friend Requests Inbox
        <span style="font-weight:500;background:#eee;color:#444;padding:2px 10px 2px 8px;border-radius:12px;font-size:1em;position:relative;top:-2px;margin-left:0.5em;">
          ${requests.length}
        </span>
      </div>
      <div id="reqList" style="margin-top:16px;"></div>
    `;
    const reqList = container.querySelector("#reqList");
    requests.forEach(req => {
      const row = document.createElement("div");
      row.style = "margin:12px 0 14px 0;display:flex;align-items:center;gap:18px;";
      row.innerHTML = `
        <div style="flex:1 1 0;font-weight:500;">${req.username}</div>
        <button class="acceptBtn" style="background:#3AC66F;color:#fff;border:none;border-radius:6px;padding:0.5em 1.2em;font-size:1em;cursor:pointer;">Accept</button>
        <button class="rejectBtn" style="background:#D84040;color:#fff;border:none;border-radius:6px;padding:0.5em 1.2em;font-size:1em;margin-left:4px;cursor:pointer;">Reject</button>
      `;

      // Accept request
      row.querySelector(".acceptBtn").onclick = async () => {
        row.querySelector(".acceptBtn").disabled = true;
        row.querySelector(".rejectBtn").disabled = true;
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/accept', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: req.username })
        });
        if (resp.ok) {
          row.innerHTML = `<span style="color:#178d3c;">Accepted!</span>`;
        } else {
          row.innerHTML = `<span style="color:#d12020;">Error!</span>`;
        }
      };

      // Reject request
      row.querySelector(".rejectBtn").onclick = async () => {
        row.querySelector(".acceptBtn").disabled = true;
        row.querySelector(".rejectBtn").disabled = true;
        const token = await user.firebaseUser.getIdToken();
        const resp = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/reject', {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ username: req.username })
        });
        if (resp.ok) {
          row.innerHTML = `<span style="color:#d12020;">Rejected</span>`;
        } else {
          row.innerHTML = `<span style="color:#d12020;">Error!</span>`;
        }
      };

      reqList.appendChild(row);
    });
  }

  loadInbox();
}
