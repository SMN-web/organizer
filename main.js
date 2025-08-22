import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

const appDiv = document.getElementById('app');

// Helper to securely get user role + approval via backend
async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch('https://session.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) return null;
    return await resp.json(); // {email, role, adminApproval, emailVerified}
  } catch (e) {
    appDiv.innerHTML = `<pre style="color:red">Session status fetch error: ${e && e.message ? e.message : e}</pre>`;
    return null;
  }
}

async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    // No auth required for these routes
    if (hash === '#signup')         return showSignup(appDiv);
    if (hash === '#terms')          return showTerms(appDiv);
    if (hash === '#resend')         return showResendVerification(appDiv);
    if (hash === '#forgot')         return showForgot(appDiv);

    // All panel routes require user to be logged in and approved
    const user = auth.currentUser;
    if (!user) {
      showLogin(appDiv);
      return;
    }

    // Always get session from backend (role + approval)
    const session = await getSessionStatus(auth);

    if (!session || session.adminApproval !== 'approved' || !session.emailVerified) {
      await auth.signOut();
      showLogin(appDiv);
      return;
    }

    // Role-based routing from backend
    if (hash === '#admin') {
      if (session.role === 'admin') {
        showAdminPanel(appDiv, auth);
      } else {
        window.location.hash = '#user';
        showUserPanel(appDiv, auth);
      }
    } else if (hash === '#moderator') {
      if (session.role === 'moderator') {
        showModeratorPanel(appDiv, auth);
      } else {
        window.location.hash = '#user';
        showUserPanel(appDiv, auth);
      }
    } else if (hash === '#user') {
      showUserPanel(appDiv, auth);
    } else if (hash === '#login') {
      // ! Always redirect logged-in, approved, verified users to their role's panel:
      if (session.role === 'admin')        window.location.hash = '#admin';
      else if (session.role === 'moderator') window.location.hash = '#moderator';
      else                                    window.location.hash = '#user';
    } else {
      window.location.hash = '#login';
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  window.firebaseAuth.onAuthStateChanged(() => router());
  router();
});
