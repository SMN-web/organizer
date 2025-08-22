import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

const appDiv = document.getElementById('app');

// Always get session from backend using the user's token
async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    // Edit below URL to match your backend endpoint!
    const resp = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) return null;
    return await resp.json(); // { email, role, adminApproval, emailVerified }
  } catch (e) {
    // Show error in UI for debugging
    appDiv.innerHTML = `<pre style="color:red">Session status fetch error: ${e && e.message ? e.message : e}</pre>`;
    return null;
  }
}

async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    // Public pages (don’t require auth/session)
    if (hash === '#signup')       return showSignup(appDiv);
    if (hash === '#terms')        return showTerms(appDiv);
    if (hash === '#resend')       return showResendVerification(appDiv);
    if (hash === '#forgot')       return showForgot(appDiv);

    const user = auth.currentUser;
    if (!user) {
      // Not logged in: show login
      showLogin(appDiv);
      return;
    }

    // Always perform backend session check if logged in
    const session = await getSessionStatus(auth);

    // If not approved or missing session, logout and force login
    if (!session || session.adminApproval !== "approved" || !session.emailVerified) {
      await auth.signOut();
      showLogin(appDiv);
      return;
    }

    // Route to correct panel based on backend role
    if (hash === "#admin" && session.role === "admin") {
      showAdminPanel(appDiv, auth);
    } else if (hash === "#moderator" && session.role === "moderator") {
      showModeratorPanel(appDiv, auth);
    } else if (hash === "#user") {
      showUserPanel(appDiv, auth);
    } else {
      // For #login (and unknown routes), auto-redirect logged-in users
      if (session.role === "admin")        window.location.hash = "#admin";
      else if (session.role === "moderator") window.location.hash = "#moderator";
      else                                 window.location.hash = "#user";
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

// Watch hash changes, load, and auth state restoration
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  window.firebaseAuth.onAuthStateChanged(() => router());
  router();
});
