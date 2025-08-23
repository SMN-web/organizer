// manageSpend.js
export function showManageSpend(container, user) {
  container.innerHTML = `
    <div style="padding:2em 1em;text-align:center;">
      <h2 style="margin-top:0;">Manage Spend</h2>
      <p>Here you'll track and manage your spendings.</p>
      <!-- Add spend form, history, logic here -->
      <button onclick="window.location.reload()">Back</button>
    </div>
  `;
  // Optionally use `user` for personalized UI
}
