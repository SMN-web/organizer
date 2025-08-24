import { showSpinner, hideSpinner, delay } from './spinner.js';

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
    if (!input) {
      resultDiv.innerHTML = `<div style="color:#d12020;">Please enter a username.</div>`;
      return;
    }
    try {
      if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
        resultDiv.innerHTML = `<div style="color:#d12020;">Please log in first.</div>`;
        return;
      }
      showSpinner(container); await delay(1200);
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://se-re.nafil-8895-s.workers.dev/api/friends/search-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target: input })
      });
      hideSpinner(container);
      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      if (!result.exists) {
        resultDiv.innerHTML = `<div style='color:#d12020;'>User not found.</div>`;
        return;
      }
      if (result.status === 'blocked') {
        resultDiv.innerHTML = `<div style='color:#d12020;'>Blocked: You cannot interact with this user.</div>`;
        return;
      }
      if (result.status === 'friends') {
        resultDiv.innerHTML = `<div style='padding:10px;background:#e8fce5;border-radius:6px;color:#178d3c;'>Already friends with <b>${result.name || result.username}</b>.</div>`;
        return;
      }
      if (result.status === 'pending') {
        resultDiv.innerHTML = `<div style='padding:10px;background:#fff4e0;border-radius:6px;color:#ad670f;'>Friend request already sent to <b>${result.name || result.username}</b>.</div>`;
        return;
      }
      const myUsername = user.firebaseUser.displayName?.toLowerCase() || user.firebaseUser.email?.toLowerCase() || '';
      if (result.username.toLowerCase() === myUsername) {
        resultDiv.innerHTML = `<div style="color:#d12020;background:#ffe6e6;padding:10px 12px;border-radius:6px;">You cannot send a friend request to yourself.</div>`;
        return;
      }
      resultDiv.innerHTML = `
        <div style="padding:12px 16px;background:#f5f6fa;border-radius:6px;display:flex;align-items:center;gap:12px;">
          <span style="font-weight:500;font-size:1.1em;">${result.name || result.username}</span>
          <span style="color:#888;">@${result.username}</span>
          <button id="sendRequestBtn" style="background:#27ae60;color:#fff;border:none;border-radius:5px;padding:0.5em 1.1em;cursor:pointer;">Send Friend Request</button>
          <span id="sendMsg" style="margin-left:1em;color:#158b46;"></span>
        </div>
      `;
      container.querySelector("#sendRequestBtn").onclick = async () => {
        showSpinner(container); await delay(1000);
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
          hideSpinner(container);
          if (!req.ok) {
            const err = await req.text();
            let msg = '';
            if (err.includes('Cannot friend yourself')) {
              msg = "You cannot send a friend request to yourself.";
            } else {
              msg = (JSON.parse(err).error || err);
            }
            container.querySelector("#sendMsg").textContent = msg;
            container.querySelector("#sendMsg").style.color = "#d12020";
            return;
          }
          container.querySelector("#sendMsg").textContent = "Friend request sent!";
          container.querySelector("#sendMsg").style.color = "#158b46";
          container.querySelector("#sendRequestBtn").disabled = true;
        } catch (e) {
          hideSpinner(container);
          container.querySelector("#sendMsg").textContent = e.message;
          container.querySelector("#sendMsg").style.color = "#d12020";
        }
      };
    } catch (e) {
      hideSpinner(container);
      container.querySelector("#searchResult").innerHTML = `<div style="color:#d12020;">Error: ${e.message.replace(/"/g,'')}</div>`;
    }
  };
}
