// manageSpend.js
export function showManageSpend(contentContainer) {
  contentContainer.innerHTML = `
    <div style="padding:2em 1em;text-align:center;">
      <h2 style="margin-top:0;">Manage Spend</h2>
      <p>Here you'll track and manage your spendings.</p>
      <button onclick="window.location.reload()" style="margin-top:2em;">Back</button>
    </div>
  `;
}
