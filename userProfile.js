import { showSpinner, hideSpinner } from './spinner.js';
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export async function showUserProfile(container, user) {
  showSpinner(container);

  let profile = {};
  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function')
      throw new Error("No valid user session found.");
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch("https://us-pr.nafil-8895-s.workers.dev/api/userpanel", {
      headers: { Authorization: "Bearer " + token }
    });
    if (!resp.ok) throw new Error("Failed to fetch profile");
    profile = await resp.json();
    profile.username = profile.username || "";
    profile.name = profile.name || "";
    profile.email = profile.email || "";
    if (!profile.email) throw new Error("No email returned from backend.");
  } catch (e) {
    hideSpinner(container);
    container.innerHTML = `<div style="padding:2.3em;text-align:center;color:#c22;">
      Could not load profile: ${e.message || e}
    </div>`;
    return;
  }
  hideSpinner(container);

  container.innerHTML = `
    <div style="max-width:410px;margin:2.6em auto 2em auto;background:#fff;border-radius:16px;box-shadow:0 4px 20px #e9f2fa;padding:2em 1.3em 2.5em 1.3em;">
      <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:2.1em;">
        <div style="background:#e9eff7;color:#246;font-weight:700;border-radius:50%;display:flex;align-items:center;justify-content:center;width:68px;height:68px;font-size:2.2em;box-shadow:0 2px 8px #e2eaf7;margin-bottom:1.2em;letter-spacing:0.07em;">
          ${(profile.name.match(/[A-Z]/gi)||[]).join('').toUpperCase().slice(0,2) || "--"}
        </div>
        <div style="width:100%">
          <div style="margin-bottom:1.2em;text-align:center;">
            <label style="font-size:1em;color:#788;display:block;margin-bottom:3px;font-weight:600;">Username</label>
            <span style="font-family:monospace;color:#238;font-size:1.05em;word-break:break-all;">${profile.username}</span>
          </div>
          <div style="margin-bottom:1.2em;text-align:center;">
            <label style="font-size:1em;color:#788;display:block;margin-bottom:3px;font-weight:600;">Name</label>
            <span style="font-size:1.21em;font-weight:700;color:#1b2737;letter-spacing:0.02em;">${profile.name}</span>
          </div>
          <div style="margin-bottom:1.2em;text-align:center;">
            <label style="font-size:1em;color:#788;display:block;margin-bottom:3px;font-weight:600;">Email</label>
            <span style="font-size:1.07em;color:#455;">${profile.email}</span>
          </div>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:1em 0 2em 0;">
      <div style="text-align:center;margin-bottom:1.1em;">
        <a id="changePasswordLink"
           href="#" 
           style="color:#2068c8; font-weight:600; font-size:1.09em; text-decoration:underline; border-radius:6px;
                  padding:4px 15px; transition:background 0.15s; display:inline-block;">
          Change Password
        </a>
      </div>
      <div id="resetMsg" style="margin:0.7em 0;font-size:0.99em;color:#168c34;font-weight:500;text-align:center;"></div>
      <div style="color:#999;font-size:0.97em;text-align:center;padding-top:1.2em;">
        Your full user profile and future settings will be displayed here.
      </div>
    </div>
  `;

  // Password reset logic
  const link = container.querySelector('#changePasswordLink');
  const msgEl = container.querySelector('#resetMsg');
  if (link && profile.email) {
    link.onclick = async (e) => {
      e.preventDefault();
      link.style.pointerEvents = 'none';
      link.style.background = "#e7eef8";
      msgEl.style.color = "#666";
      msgEl.textContent = "Sending reset link...";
      try {
        const auth = window.firebaseAuth || getAuth();
        await sendPasswordResetEmail(auth, profile.email);
        msgEl.style.color = "#27ae60";
        msgEl.textContent = "Reset link sent! Check your inbox and spam folders.";
      } catch (error) {
        msgEl.style.color = "#e74c3c";
        if (error.code === "auth/user-not-found") {
          msgEl.textContent = "No account found with this email.";
        } else if (error.code === "auth/invalid-email") {
          msgEl.textContent = "Invalid email address.";
        } else if (error.code === "auth/too-many-requests") {
          msgEl.textContent = "Too many attempts. Please try again later.";
        } else {
          msgEl.textContent = "Error sending reset email: " + (error.message || error.code || error.toString());
        }
      }
      setTimeout(() => {
        msgEl.textContent = "";
        link.style.pointerEvents = "";
        link.style.background = "";
      }, 3300);
    };
  }
}
