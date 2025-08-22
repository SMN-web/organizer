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
  document.body.innerHTML = `
    <div style="background:#ffecec;color:#c00;padding:2em;font-size:1.1em;text-align:center;">
      &#9888;&#65039; <b>ERROR:</b> <code>&lt;div id="app"&gt;</code> not found in HTML!
    </div>`;
  throw new Error('<div id="app"> is required!');
}

// Show visible error or warning message in the app container (never blank)
function showWarning(message) {
  appDiv.innerHTML = `
    <div style="background:#ffeb3b;color:#444;padding:1em;border-radius:8px;max-width:400px;margin:2em auto;box-shadow:0 2px 6px #ddd;text-align:center;font-weight:bold;">
      <span style="margin-right:8px;">&#9888;&#65039;</span>${message}
    </div>
  `;
}

function showError(message) {
  appDiv.innerHTML = `
    <div style="background:#ffecec;color:#c00;padding:1.1em;border-radius:8px;max-width:410px;margin:2em auto;box-shadow:0 2px 6px #ddd;text-align:center;font-weight:bold;">
      <span style="margin-right:8px;">&#9940;</span>${message}
    </div>
  `;
}

// Get session status from backend; display fetch errors inline
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
      showError(`Session status API failed (${resp.status}):<br>${text}`);
      return null;
    }
    return await resp.json(); // {email, role, adminApproval, emailVerified}
  } catch (e) {
    showError(`Network or backend error:<br>${e && e.message ? e.message : e}`);
    return null;
  }
}

async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    // Public routes
    if (hash === '#signup')         return showSignup(appDiv);
    if (hash === '#terms')          return showTerms(appDiv);
    if (hash === '#resend')         return showResendVerification(appDiv);
    if (hash === '#forgot')         return showForgot(appDiv);

    // Panels: require login and status/role/approval from backend
    const user = auth.currentUser;
    if (!user) {
      showLogin(appDiv);
      showWarning("Log in required to continue.");
      return;
    }

    // Always read status from backend
    const session = await getSessionStatus(auth);
    if (!session) return; // error already shown

    if (session.adminApproval !== "approved") {
      await auth.signOut();
      showWarning("Your account is not approved yet. Please contact support or wait for admin approval.");
      return;
    }
    if (!session.emailVerified) {
      await auth.signOut();
      showWarning("Your email is not verified. Please verify your email to continue.");
      return;
    }

    // Role-based page routing
    if (hash === '#admin') {
      if (session.role === 'admin') {
        showAdminPanel(appDiv, auth);
      } else {
        showWarning("You do not have admin access.");
      }
    } else if (hash === '#moderator') {
      if (session.role === 'moderator') {
        showModeratorPanel(appDiv, auth);
      } else {
        showWarning("You do not have moderator access.");
      }
    } else if (hash === '#user') {
      showUserPanel(appDiv, auth);
    } else if (hash === '#login') {
      // If already approved/verified, redirect to panel based on backend role
      if (session.role === 'admin') window.location.hash = '#admin';
      else if (session.role === 'moderator') window.location.hash = '#moderator';
      else window.location.hash = '#user';
    } else {
      showLogin(appDiv);
      showWarning("Unknown route. Redirected to login.");
    }
  } catch (err) {
    showError(`Router error:<br>${err && err.message ? err.message : err}`);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  try {
    window.firebaseAuth.onAuthStateChanged(() => router());
    router();
  } catch (err) {
    showError(`Startup error:<br>${err && err.message ? err.message : err}`);
  }
});
