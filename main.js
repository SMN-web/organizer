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
    <div style="padding:2em;font-size:1.1em;text-align:center;background:#ffecec;color:#c00;">
      &#9940; <b>ERROR:</b> <code>&lt;div id="app"&gt;</code> not found in HTML!
    </div>`;
  throw new Error('<div id="app"> is required!');
}

// Display a visible error
function showError(message) {
  appDiv.innerHTML = `
    <div style="background:#ffecec;color:#c00;padding:1.1em;border-radius:10px;max-width:430px;margin:3em auto;text-align:center;font-weight:bold;box-shadow:0 2px 8px #eee;">
      &#9940; ${message}
    </div>
  `;
}

// Display a warning (not fatal)
function showWarning(message) {
  appDiv.innerHTML = `
    <div style="background:#fff7cf;color:#744800;font-weight:bold;padding:1.1em;border-radius:10px;max-width:430px;margin:3em auto;text-align:center;box-shadow:0 2px 8px #eee;">
      &#9888;&#65039; ${message}
    </div>
  `;
}

// Fetch session/role/approval from backend and always show error on failure
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
      showError(`Session status error [${resp.status}]:<br>${text}`);
      return null;
    }
    return await resp.json(); // { email, role, adminApproval, emailVerified }
  } catch (e) {
    showError(`Network or backend error:<br>${e && e.message ? e.message : e}`);
    return null;
  }
}

async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    // Public pages (no auth required)
    if (hash === '#signup')         return showSignup(appDiv);
    if (hash === '#terms')          return showTerms(appDiv);
    if (hash === '#resend')         return showResendVerification(appDiv);
    if (hash === '#forgot')         return showForgot(appDiv);

    // All panels: require login and backend approval
    const user = auth.currentUser;
    if (!user) {
      showLogin(appDiv);
      showWarning("Log in required to continue.");
      return;
    }

    // Always get role/approval from backend; show error inline if fails
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

    // Role-based access
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
      // Redirect role-based after login
      if (session.role === 'admin') window.location.hash = '#admin';
      else if (session.role === 'moderator') window.location.hash = '#moderator';
      else window.location.hash = '#user';
    } else {
      showLogin(appDiv);
      showWarning("Unknown page. Redirected to login.");
    }
  } catch (err) {
    showError(`App/router error:<br>${err && err.message ? err.message : err}`);
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
