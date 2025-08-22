import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

const appDiv = document.getElementById('app');
if (!appDiv) {
  document.body.innerHTML = `<div style="color:#fff;background:#c00;padding:2em;text-align:center;font-size:1.2em;">
    Critical error: <b>&lt;div id="app"&gt;</b> not found in HTML!
  </div>`;
  throw new Error('<div id="app"> is required!');
}

// Helper to show errors in the app container as a styled message box
function showErrorBox(message) {
  appDiv.innerHTML = `
    <div style="background:#ffecec;color:#c00;border:1px solid #e74c3c;margin:2em auto;padding:1.2em 1em;max-width:430px;border-radius:8px;font-size:1.1em;text-align:center;">
      <b>Error:</b> <span>${message}</span>
    </div>
  `;
}

// Securely get session/role/approval from backend (shows any error inline)
async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch('https://session.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) {
      const text = await resp.text();
      showErrorBox(`Session status API failed (HTTP ${resp.status}):<br>${text}`);
      return null;
    }
    return await resp.json(); // { email, role, adminApproval, emailVerified }
  } catch (e) {
    showErrorBox(`Session status fetch error:<br>${e && e.message ? e.message : e}`);
    return null;
  }
}

async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    // Show public pages immediately
    if (hash === '#signup')         return showSignup(appDiv);
    if (hash === '#terms')          return showTerms(appDiv);
    if (hash === '#resend')         return showResendVerification(appDiv);
    if (hash === '#forgot')         return showForgot(appDiv);

    const user = auth.currentUser;
    if (!user) {
      showLogin(appDiv);
      return;
    }

    // Always get status from backend for role, approval, verified
    const session = await getSessionStatus(auth);
    if (!session) return; // Error already shown
    if (session.adminApproval !== "approved") {
      await auth.signOut();
      showErrorBox("Your account is not approved.<br>Please contact support or wait for admin approval.");
      return;
    }
    if (!session.emailVerified) {
      await auth.signOut();
      showErrorBox("Your email is not verified.<br>Please verify your email to continue.");
      return;
    }

    // Role-based routing from backend
    if (hash === '#admin') {
      if (session.role === 'admin') {
        showAdminPanel(appDiv, auth);
      } else {
        showErrorBox("Access Denied: You are not an admin.");
      }
    } else if (hash === '#moderator') {
      if (session.role === 'moderator') {
        showModeratorPanel(appDiv, auth);
      } else {
        showErrorBox("Access Denied: You are not a moderator.");
      }
    } else if (hash === '#user') {
      showUserPanel(appDiv, auth);
    } else if (hash === '#login') {
      // Auto-redirect if logged in and approved
      if (session.role === 'admin')        window.location.hash = '#admin';
      else if (session.role === 'moderator') window.location.hash = '#moderator';
      else                                  window.location.hash = '#user';
    } else {
      showLogin(appDiv); // Default: show login for any unknown hash
    }
  } catch (err) {
    showErrorBox(`Router error:<br>${err && err.message ? err.message : err}`);
  }
}

// Always run router on hash, load, and auth state changes
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  try {
    window.firebaseAuth.onAuthStateChanged(() => router());
    router();
  } catch (err) {
    showErrorBox(`Startup error:<br>${err && err.message ? err.message : err}`);
  }
});
