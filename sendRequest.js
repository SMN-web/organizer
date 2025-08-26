export function showSendRequest(container, user) {
  container.innerHTML = `
    <h3>Send Friend Request</h3>
    <input id="friendUsername" type="text" placeholder="Enter a friend's username" autocomplete="off" style="
      width:100%;padding:0.7em;border-radius:6px;border:1px solid #ccc;font-size:1em;margin-bottom:8px;" />
    <button id="searchBtn" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:0.6em 1.4em;cursor:pointer;font-size:1em;">Search</button>
    <div id="searchResult" style="margin-top:22px;"></div>
  `;
  container.querySelector("#searchBtn").onclick = async () => {
    const input = container.querySelector("#friendUsername").value.trim().toLowerCase();
    const resultDiv = container.querySelector("#searchResult");

    // Basic debug: show who is logged in, searching for whom
    resultDiv.innerHTML = `<div style="color:#888;">
      DEBUG: Searching for <b>${input}</b> as logged-in <b>${user?.firebaseUser?.displayName || user?.firebaseUser?.email || "[unknown]"}</b>
    </div>`;

    if (!input) {
      resultDiv.innerHTML += `<div style="color:#d12020;">Please enter a username.</div>`;
      return;
    }
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        resultDiv.innerHTML += `<div style="color:#d12020;">Please log in first.</div>`;
        return;
      }
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://se-re.nafil-8895-s.workers.dev/api/friends/search-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target: input })
      });
      const result = await res.json();

      // Always show backend debug in UI
      if (result.debug) {
        resultDiv.innerHTML += `<pre style="background:#fafafa;border:1px solid #eee;border-radius:6px;color:#222;font-size:.94em;padding:7px 10px;margin:0 0 12px 0;">${JSON.stringify(result.debug, null, 2)}</pre>`;
      }

      // Only show "User not found" or "Found" message:
      if (!result.exists) {
        resultDiv.innerHTML += `<div style='color:#d12020;font-size:1.13em;'>User not found.</div>`;
        return;
      }

      // For debugging: show found message (you can remove for production)
      resultDiv.innerHTML += `<div style='color:#178d3c;font-size:1.13em;'>User found (not blocked): <b>${result.username}</b></div>`;
    } catch (e) {
      resultDiv.innerHTML += `<div style="color:#d12020;">Error: ${e.message.replace(/"/g, '')}</div>`;
    }
  };
}
