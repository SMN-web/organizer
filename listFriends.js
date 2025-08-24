import { showSpinner, hideSpinner, delay } from './spinner.js';

export function showFriendsList(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  async function loadFriends() {
    let error = '', list = [];
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      hideSpinner(container);
      container.innerHTML = `
        <div style="color:#d12020;margin:2em;text-align:center;">
          Please log in to view your friends list.
        </div>
      `;
      return;
    }
    try {
      const token = await user.firebaseUser.getIdToken();
      const res = await fetch('https://fr-li.nafil-8895-s.workers.dev/api/friends/list', {
        headers: { Authorization: 'Bearer ' + token }
      });
      const text = await res.text();
      await delay(800);
      try { list = JSON.parse(text); }
      catch (e) { error = "Invalid backend response: " + text; }
      if (!Array.isArray(list)) {
        if (list && list.error) error = "Backend error: " + list.error;
        else error = "Unexpected backend error: " + text;
      }
    } catch (e) {
      error = "Network error: " + e.message;
    }
    hideSpinner(container);

    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:9px;text-align:center;">
        My Friends
      </div>
    `;

    if (error) {
      container.innerHTML += `
        <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">
          ${error}
        </div>
      `;
      return;
    }
    if (!list.length) {
      container.innerHTML += `
        <div style="margin:2em 0;color:#888;font-size:1.13em;text-align:center;">
          <div style="font-size:2em;margin-bottom:0.6em;">🙂</div>
          You have no friends yet.<br>
          Send a friend request to get started!
        </div>
      `;
      return;
    }
    container.innerHTML += `
      <div style="max-width:440px;margin:auto;">
        ${list.map(f =>
          `<div style="margin:0.85em 0 0.25em 0;padding-bottom:0.55em;border-bottom:1px solid #eee;">
            <span style="font-size:1.08em;font-weight:500;">${f.name || f.username}</span>
            <span style="color:#999;font-size:0.97em;margin-left:8px;">@${f.username}</span>
          </div>`).join('')}
      </div>
    `;
  }

  loadFriends();
}
