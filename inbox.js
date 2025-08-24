// inbox.js
export function showInbox(container, user) {
  // TODO: Fetch inbox requests from backend
  const demoRequests = [
    { username: "req_user1", id: 1 },
    { username: "req_user2", id: 2 }
  ];
  container.innerHTML = `
    <h3 style="margin-bottom:0.5em;">Friend Requests Inbox <span style="background:#eee;color:#333;border-radius:1em;padding:0.1em 0.9em;font-size:0.91em;">${demoRequests.length}</span></h3>
    <div id="inboxArea"></div>
  `;
  const inboxArea = container.querySelector("#inboxArea");
  inboxArea.innerHTML = demoRequests.length
    ? demoRequests.map(r => `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.7em;">
        <span>${r.username}</span>
        <button style="background:#2ecc71;color:#fff;border:none;border-radius:6px;padding:0.3em 1.2em;cursor:pointer;">Accept</button>
        <button style="background:#d00;color:#fff;border:none;border-radius:6px;padding:0.3em 1.2em;cursor:pointer;">Reject</button>
      </div>
    `).join("")
    : `<div style="color:#aaa;">No requests</div>`;
  inboxArea.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      btn.parentElement.innerHTML = '<span style="color:#3498db;">Action completed!</span>';
    };
  });
}
