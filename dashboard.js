export function showDashboard(container, user) {
  container.innerHTML = `
    <div style="padding:2em 1em;text-align:center;">
      <h2 style="margin-top:0;">Dashboard</h2>
      <p>Welcome to your dashboard, <b>${user.name || "User"}</b>!</p>
      <div style="margin:2em 0;">
        <span style="color:#888;">All your key stats will appear here in future!</span>
      </div>
    </div>
  `;
}
