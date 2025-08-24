export function showListFriends(container) {
  container.innerHTML = `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      min-height:56vh;
      color:#666;
      font-size:1.18em;
      padding:2em 0 1.5em 0;
      text-align:center;
    ">
      <div style="font-weight:600;font-size:1.29em;margin-bottom:0.8em;">
        My Friends
      </div>
      <div style="background:#f6fafd;border-radius:11px;padding:2em 1.4em 2em 1.4em;max-width:340px;border:1px solid #eee;">
        <div style="margin-bottom:0.6em;">
          💡 You have no friends yet.
        </div>
        <div>
          Send a friend request to get started and connect with people!
        </div>
      </div>
    </div>
  `;
}
