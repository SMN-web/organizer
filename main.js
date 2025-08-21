import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showForgot } from './forget.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';


const appDiv = document.getElementById('app');

// Central session status check.
// Returns: { email, emailVerified, username, adminApproval, role }
async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken();
    const resp = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// Robust router: checks both Firebase Auth and backend DB/user status.
async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    // Always check login state before showing any restricted panel
    const user = auth.currentUser;

    // Always verify session status if logged in
    let session = null;
    if (user) session = await getSessionStatus(auth);

    if (hash === '#signup') {
      showSignup(appDiv);
    } else if (hash === '#login') {
      showLogin(appDiv);
    } else if (hash === '#terms') {
      showTerms(appDiv);
    } else if (hash === '#forgot') {
      showForgot(appDiv);
    } else if (hash === '#resend') {
      showResendVerification(appDiv);
    } else if (hash === '#admin') {
      // Only show admin panel if verified, approved, role=admin
      if (session && session.emailVerified && session.adminApproval === "approved" && session.role === "admin") {
        showAdminPanel(appDiv, auth);
      } else {
        window.location.hash = "#login";
      }
    } else if (hash === '#moderator') {
      if (session && session.emailVerified && session.adminApproval === "approved" && session.role === "moderator") {
        showModeratorPanel(appDiv, auth);
      } else {
        window.location.hash = "#login";
      }
    } else if (hash === '#user') {
      if (session && session.emailVerified && session.adminApproval === "approved") {
        showUserPanel(appDiv, auth);
      } else {
        window.location.hash = "#login";
      }
    } else {
      window.location.hash = '#login';
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

// On user status change, always re-route (e.g. after login/logout)
window.firebaseAuth.onAuthStateChanged(() => router());
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
