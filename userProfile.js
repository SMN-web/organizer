import { showSpinner, hideSpinner } from './spinner.js';
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export async function showUserProfile(container, user) {
  showSpinner(container);

  let profile = {};
  try {
    // Ensure Firebase user is valid
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
    <div style="padding:2.5em 1.2em;text-align:center;">
      <div style="display:flex;flex-direction:column;align-items:center;">
        <span style="background:#e1e6ef;color:#355;font-weight:700;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;width:66px;height:66px;font-size:2em;margin-bottom:0.7em;">
          ${(profile.name.match(/[A-Z]/gi)||[]).join('').toUpperCase().slice(0,2) || "??"}
        </span>
        <div style="font-size:1em;color:#444;margin-bottom:0.7em;">
          <b>Username:</b> <span style="font-family:monospace;color:#246;">${profile.username}</span>
        </div>
        <div style="font-size:1.25em;font-weight:600;">${profile.name}</div>
        <div style="color:#555;margin-top:0.3em;font-size:1em;">${profile.email}</div>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:2em 0 1.5em 0;">
      <div id="changePwdRow" style="margin-top:12px;">
        <a id="changePasswordLink" href="#" style="color:#2268c5;font-weight:600;font-size:1.08em;text-decoration:underline;">
          Change password
        </a>
      </div>
      <div id="resetMsg" style="margin-top:1.2em;font-size:0.99em;font-weight:500;"></div>
      <div style="color:#999;margin-top:2.9em;">Your full user profile and future settings will be displayed here.</div>
    </div>
  `;

  // Password reset: on click, send link to profile.email and show message
  const link = container.querySelector('#changePasswordLink');
  const msgEl = container.querySelector('#resetMsg');
  if (link && profile.email) {
    link.onclick = async (e) => {
      e.preventDefault();
      link.style.pointerEvents = 'none';
      msgEl.style.color = "#666";
      msgEl.textContent = "Sending reset link...";

      try {
        // Use app-wide Firebase Auth instance if defined, else getAuth()
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
      }, 3300);
    };
  }
}
