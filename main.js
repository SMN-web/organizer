import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js'; // If using forgot password

const appDiv = document.getElementById('app');

// Checks current session and gets user details from backend
async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(/* forceRefresh= */ true); // always get the latest token
    const resp = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) return null;
    return await resp.json(); // {email, emailVerified, username, adminApproval, role}
  } catch {
    return null;
  }
}

// Centralized UI routing function
async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;
    const user = auth.currentUser;

    // Show public pages (signup, terms, resend, forgot) without auth
    if (hash === '#signup')      return showSignup(appDiv);
    if (hash === '#terms')       return showTerms(appDiv);
    if (hash === '#resend')      return showResendVerification(appDiv);
    if (hash === '#forgot')      return showForgot(appDiv);

    // For anything else (user, admin, moderator), session check is required
    if (!user) {
      // No currentUser, always show login
      window.location.hash = "#login";
      showLogin(appDiv);
      return;
    }

    // Always check backend session/approval/email-verified on every route
    const session = await getSessionStatus(auth);

    // If backend denies session, login is forced
    if (!session || !session.emailVerified || !session.adminApproval || session.adminApproval !== "approved") {
      await auth.signOut(); // Remove frontend session for extra safety
      window.location.hash = "#login";
      showLogin(appDiv);
      return;
    }

    // Now, route based on role (safe, always checked with backend)
    if (hash === "#admin") {
      if (session.role === "admin") {
        showAdminPanel(appDiv, auth);
      } else {
        window.location.hash = "#login";
        showLogin(appDiv);
      }
    } else if (hash === "#moderator") {
      if (session.role === "moderator") {
        showModeratorPanel(appDiv, auth);
      } else {
        window.location.hash = "#login";
        showLogin(appDiv);
      }
    } else if (hash === "#user") {
      showUserPanel(appDiv, auth);
    } else if (hash === "#login") {
      // If authed and completely verified, redirect to their panel
      if (session.role === "admin") {
        window.location.hash = "#admin";
      } else if (session.role === "moderator") {
        window.location.hash = "#moderator";
      } else {
        window.location.hash = "#user";
      }
    } else {
      // Default: show login for unknown routes
      window.location.hash = "#login";
      showLogin(appDiv);
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

// Re-run router for:
// - any hash change (route navigation)
// - on page load (to resume sessions)
// - whenever auth state changes (login/logout/resume)
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  // Listen to Firebase auth state: 
  window.firebaseAuth.onAuthStateChanged(() => router());
  router();
});
