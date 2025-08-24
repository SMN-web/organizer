// sendRequest.js
export function showSendRequest(container, user) {
  container.innerHTML = `
    <h3 style="margin-bottom:0.2em;">Send Friend Request</h3>
    <input id="friendUsername" type="text" placeholder="Enter username" style="width:100%;padding:0.7em 0.8em;margin-bottom:0.6em;">
    <button id="sendRequestBtn" style="background:#27ae60;color:#fff;border:none;border-radius:6px;padding:0.7em 2em;cursor:pointer;">
      Send Request
    </button>
    <div id="sendRequestMsg" style="margin-top:0.7em;color:#3498db;font-size:1em;"></div>
  `;
  container.querySelector("#sendRequestBtn").onclick = async () => {
    const username = container.querySelector("#friendUsername").value.trim();
    if (!username) {
      container.querySelector("#sendRequestMsg").textContent = "Please enter a username.";
      return;
    }
    // TODO: Call backend
    container.querySelector("#sendRequestMsg").textContent = `Friend request sent to ${username}`;
    setTimeout(() => { container.querySelector("#sendRequestMsg").textContent = ""; }, 1800);
  };
}
