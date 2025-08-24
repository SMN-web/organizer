import { showSendRequest } from './sendRequest.js';
import { showInbox } from './inbox.js';
import { showFriendsList } from './listFriends.js';

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
    ["tabSend", "tabInbox", "tabFriends"].forEach((id, i) => {
      const btn = container.querySelector("#" + id);
      btn.style.background = i === idx ? "#3498db" : "#eee";
      btn.style.color = i === idx ? "#fff" : "#333";
    });
  }
  container.querySelector("#tabSend").onclick = () => {
    activateTab(0);
    showSendRequest(section, user);
  };
  container.querySelector("#tabInbox").onclick = () => {
    activateTab(1);
    showInbox(section, user);
  };
  container.querySelector("#tabFriends").onclick = () => {
    activateTab(2);
    showFriendsList(section, user);
  };
  // Init to first tab
  activateTab(0);
  showSendRequest(section, user);
}
