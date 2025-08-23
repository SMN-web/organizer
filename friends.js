export function showFriends(container, user) {
  container.innerHTML = `
    <div style="padding:2em 1em;max-width:500px;margin:auto;">
      <h2 style="margin-bottom:1.2em;">Friends</h2>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:1.2em;">
        <button class="ftab" id="tabSend" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:0.7em 1.6em;cursor:pointer;font-size:1em;">Send Request</button>
        <button class="ftab" id="tabInbox" style="background:#eee;color:#333;border:none;border-radius:6px;padding:0.7em 1.6em;cursor:pointer;font-size:1em;">Inbox</button>
        <button class="ftab" id="tabFriends" style="background:#eee;color:#333;border:none;border-radius:6px;padding:0.7em 1.6em;cursor:pointer;font-size:1em;">My Friends</button>
      </div>
      <div id="friendsSection"></div>
    </div>
  `;

  const section = container.querySelector("#friendsSection");

  function activateTab(idx) {
    ["tabSend","tabInbox","tabFriends"].forEach((id,i)=>{
      const btn = container.querySelector("#"+id);
      btn.style.background = i===idx ? "#3498db":"#eee";
      btn.style.color = i===idx ? "#fff":"#333";
    });
  }

  function showSendRequest() {
    activateTab(0);
    section.innerHTML = `
      <h3 style="margin-bottom:0.2em;">Send Friend Request</h3>
      <input id="friendUsername" type="text" placeholder="Enter username" style="width:100%;padding:0.7em 0.8em;margin-bottom:0.6em;">
      <button id="sendRequestBtn" style="background:#27ae60;color:#fff;border:none;border-radius:6px;padding:0.7em 2em;cursor:pointer;">Send Request</button>
      <div id="sendRequestMsg" style="margin-top:0.7em;color:#3498db;font-size:1em;"></div>
    `;
    section.querySelector("#sendRequestBtn").onclick = () => {
      const username = section.querySelector("#friendUsername").value.trim();
      section.querySelector("#sendRequestMsg").textContent =
        username ? `Friend request sent to ${username}` : "Please enter a username.";
      setTimeout(()=>{section.querySelector("#sendRequestMsg").textContent="";},1800);
      // TODO: Insert backend call here for real functionality
    }
  }

  function showInbox() {
    activateTab(1);
    const demoRequests = [
      { username: "req_user1", id: 1 },
      { username: "req_user2", id: 2 }
    ];
    section.innerHTML = `
      <h3 style="margin-bottom:0.5em;">Friend Requests Inbox <span style="background:#eee;color:#333;border-radius:1em;padding:0.1em 0.9em;font-size:0.91em;">${demoRequests.length}</span></h3>
      <div id="inboxArea"></div>
    `;
    const inboxArea = section.querySelector("#inboxArea");
    inboxArea.innerHTML = demoRequests.length
      ? demoRequests.map(r => `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.7em;">
          <span>${r.username}</span>
          <button style="background:#2ecc71;color:#fff;border:none;border-radius:6px;padding:0.3em 1.2em;cursor:pointer;"
            onclick="this.parentElement.remove();">
            Accept
          </button>
        </div>
      `).join("")
      : `<div style="color:#aaa;">No requests</div>`;
  }

  function showMyFriends() {
    activateTab(2);
    const demoFriends = ["alice99", "bobdev", "charlie_x"];
    section.innerHTML = `
      <h3 style="margin-bottom:0.5em;">My Friends</h3>
      <ul style="list-style:none;padding:0;">
        ${demoFriends.length ? demoFriends.map(user =>
          `<li style="padding:0.6em 0;border-bottom:1px solid #eee;">${user}</li>`
        ).join("")
        : `<li style="color:#aaa;">No friends yet</li>`}
      </ul>
    `;
  }

  // Tab wiring
  container.querySelector("#tabSend").onclick = showSendRequest;
  container.querySelector("#tabInbox").onclick = showInbox;
  container.querySelector("#tabFriends").onclick = showMyFriends;
  showSendRequest();
}
