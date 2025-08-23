export function showUserProfile(container, user) {
  container.innerHTML = `
    <div style="padding:2.5em 1.2em;text-align:center;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <span style="background:#e1e6ef;color:#355;font-weight:700;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;font-size:2em;margin-bottom:0.7em;">
          ${(user.name.match(/[A-Z]/gi)||[]).join('').toUpperCase().slice(0,2) || "??"}
        </span>
        <div style="font-size:1.25em;font-weight:600;">${user.name}</div>
        <div style="color:#555;margin-top:0.3em;font-size:1em;">${user.email || ''}</div>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:2em 0 1.5em 0;">
      <div style="color:#999;">Your full user profile and future settings will be displayed here.</div>
    </div>
  `;
}
