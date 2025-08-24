export function showSendRequest(container, user) {
  container.innerHTML = `
    <h3>Send Friend Request</h3>
    <input id="friendUsername" type="text" placeholder="Exact username" style="width:100%;padding:0.7em;">
    <button id="searchBtn" style="margin-top:10px;background:#3498db;color:#fff;">Search</button>
    <div id="searchResult" style="margin-top:16px;"></div>
  `;

  container.querySelector("#searchBtn").onclick = async () => {
    const input = container.querySelector("#friendUsername").value.trim().toLowerCase();
    if (!input) {
      container.querySelector("#searchResult").textContent = "Please enter a username.";
      return;
    }
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        container.querySelector("#searchResult").textContent = "Please log in first.";
        return;
      }
      const token = await user.firebaseUser.getIdToken();

      const res = await fetch('https://se-re.nafil-8895-s.workers.dev/api/friends/search-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target: input })
      });
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      if (!result.exists) {
        container.querySelector("#searchResult").textContent = "No user found.";
        return;
      }
      if (result.status === 'blocked') {
        container.querySelector("#searchResult").textContent = "User is not available (blocked).";
        return;
      }
      if (result.status === 'friends') {
        container.querySelector("#searchResult").textContent = "You are already friends.";
        return;
      }
      if (result.status === 'pending') {
        container.querySelector("#searchResult").textContent = "Request is already pending.";
        return;
      }
      container.querySelector("#searchResult").innerHTML = `
        <div>
          <span style="font-weight:500">${result.name || result.username}</span>
          <span style="color:#888;">@${result.username}</span>
          <button id="sendRequestBtn" style="background:#27ae60;color:#fff;margin-left:1em;">Send Friend Request</button>
          <span id="sendMsg" style="margin-left:1.5em;color:#158b46;"></span>
        </div>
      `;
      container.querySelector("#sendRequestBtn").onclick = async () => {
        try {
          const newToken = await user.firebaseUser.getIdToken();
          const req = await fetch('https://se-re.nafil-8895-s.workers.dev/api/friends/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${newToken}`
            },
            body: JSON.stringify({ to: result.username })
          });
          if (!req.ok) throw new Error(await req.text());
          container.querySelector("#sendMsg").textContent = "Friend request sent!";
        } catch (e) {
          container.querySelector("#sendMsg").textContent = e.message;
        }
      };
    } catch (e) {
      container.querySelector("#searchResult").textContent = "Error: " + e.message;
    }
  };
}
