import { showSpinner, hideSpinner } from './spinner.js';
import { sendPasswordResetEmail } from './firebaseAuth.js'; // import your actual Firebase password reset method

export async function showUserProfile(container, user) {
  showSpinner(container);

  let profile = {};
  try {
    // Get token, fetch profile from backend endpoint
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch("https://us-pr.nafil-8895-s.workers.dev/api/userpanel", {
      headers: { Authorization: "Bearer " + token }
    });
    if (!resp.ok) throw new Error("Failed to fetch profile");
    profile = await resp.json();
    if (!profile.email) throw new Error("No user profile details found.");
  } catch (e) {
    hideSpinner(container);
    container.innerHTML = `<div style="padding:2em;text-align:center;color:#c22;">
      Could not load profile: ${e.message || e}
    </div>`;
    return;
  }
  hideSpinner(container);

  container.innerHTML = `
    <div style="padding:2.5em 1.2em;text-align:center;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <span style="background:#e1e6ef;color:#355;font-weight:700;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;font-size:2em;margin-bottom:0.7em;">
          ${(profile.name && (profile.name.match(/[A-Z]/gi)||[]).join('').toUpperCase().slice(0,2)) || "??"}
        </span>
        <div style="font-size:1em;color:#444;margin-bottom:0.7em;">
          <b>Username:</b> <span style="font-family:monospace;color:#246;">${profile.username || '(not set)'}</span>
        </div>
        <div style="font-size:1.25em;font-weight:600;">${profile.name || '(name not set)'}</div>
        <div style="color:#555;margin-top:0.3em;font-size:1em;">${profile.email || ''}</div>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:2em 0 1.5em 0;">
      <div>
        <a id="changePasswordLink" href="#" style="color:#2268c5;font-weight:600;font-size:1.04em;text-decoration:underline;display:inline-block;margin-bottom:1.5em;">
          Change password
        </a>
      </div>
      <div style="color:#999;">Your full user profile and future settings will be displayed here.</div>
      <div id="resetMsg" style="margin-top:1em;color:#168c34;font-size:0.98em;font-weight:600;"></div>
    </div>
  `;

  // Handle change password click
  const link = container.querySelector('#changePasswordLink');
  const msg = container.querySelector('#resetMsg');
  if (link && profile.email) {
    link.onclick = async (e) => {
      e.preventDefault();
      link.style.pointerEvents = 'none';
      link.textContent = 'Sending email...';
      try {
        await sendPasswordResetEmail(profile.email);
        msg.textContent = 'Password reset email sent!';
        link.textContent = 'Change password';
      } catch (err) {
        msg.textContent = 'Error sending email.';
        link.textContent = 'Change password';
      }
      setTimeout(() => {
        msg.textContent = '';
        link.style.pointerEvents = '';
      }, 3300);
    };
  }
}
