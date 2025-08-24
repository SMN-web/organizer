// inbox.js
export function showInbox(container, user) {
  container.innerHTML = `<div style="padding:1em 0;">Loading...</div>`;

  async function loadInbox() {
    if (!user?.firebaseUser) {
      container.innerHTML = `<div style="color:#c00">Please log in.</div>`;
      return;
    }
    let requests = [];
    let errMsg = "";
    try {
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-in.nafil-8895-s.workers.dev/api/friends/inbox', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const text = await res.text();
      try {
        requests = JSON.parse(text);
      } catch (e) {
        errMsg = "Invalid backend response: " + text;
      }
      // If response is not array, treat as error
      if (!Array.isArray(requests)) {
        if (requests && requests.error)
          errMsg = "Backend error: " + requests.error;
        else
          errMsg = "Unexpected backend error: " + text;
      }
    } catch (e) {
      errMsg = "Network error: " + e.message;
    }

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
      const row = document.createElement("div");
      row.style = "margin:14px 0;font-size:1.08em;font-weight:500;";
      row.textContent = req.username;
      reqList.appendChild(row);
    });
  }

  loadInbox();
}
