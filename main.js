import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

window.firebaseAuth = getAuth();
const appDiv = document.getElementById('app');

async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true); // Always get the latest token
    const resp = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) return null;
    return await resp.json(); // {email, emailVerified, username, adminApproval, role}
  } catch (e) {
    return null;
  }
}

async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;
    const user = auth.currentUser;

    // Always show these public pages immediately
    if (hash === '#signup')      return showSignup(appDiv);
    if (hash === '#terms')       return showTerms(appDiv);
    if (hash === '#resend')      return showResendVerification(appDiv);
    if (hash === '#forgot')      return showForgot(appDiv);

    // For all others, require authentication
    if (!user) {
      window.location.hash = "#login";
      showLogin(appDiv);
      return;
    }

    // Check backend session status for every route
    const session = await getSessionStatus(auth);

    if (!session || session.adminApproval !== "approved" || !session.emailVerified) {
      await auth.signOut();
      window.location.hash = "#login";
      showLogin(appDiv);
      return;
    }

    // Correct panel routing by role
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
      // Redirect logged-in, approved user to correct panel
      if (session.role === "admin") {
        window.location.hash = "#admin";
      } else if (session.role === "moderator") {
        window.location.hash = "#moderator";
      } else {
        window.location.hash = "#user";
      }
    } else {
      // Unknown route fallback
      window.location.hash = "#login";
      showLogin(appDiv);
    }
  } catch (err) {
    // Show error in UI for easy debugging, not just blank page
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

// Watch all 3: hash (route), page load, and auth state changes (login/logout/session restore)
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  // Ensure router runs **after** auth state resumes
  window.firebaseAuth.onAuthStateChanged(() => router());
  router(); // also run here for immediate load
});
