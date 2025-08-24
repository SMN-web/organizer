// listFriends.js
export function showFriendsList(container, user) {
  // TODO: Fetch friends from backend
  const demoFriends = ["alice99", "bobdev", "charlie_x"];
  container.innerHTML = `
    <h3 style="margin-bottom:0.5em;">My Friends</h3>
    <ul style="list-style:none;padding:0;">
      ${demoFriends.length
        ? demoFriends.map(u => `<li style="padding:0.6em 0;border-bottom:1px solid #eee;">${u}</li>`).join("")
        : `<li style="color:#aaa;">No friends yet</li>`
      }
    </ul>
  `;
}
