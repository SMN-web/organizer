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
  document.body.innerHTML = `<pre style="color:red;font-size:1.2em">Error: &lt;div id="app"&gt; not found in HTML</pre>`;
  throw new Error('<div id="app"> is required!');
}

// Main session-getter for backend validation. Shows reason if error.
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
      appDiv.innerHTML = `<pre style="color:red">session-status failed: HTTP ${resp.status}\n${text}</pre>`;
      return null;
    }
    return await resp.json();
  } catch (e) {
    appDiv.innerHTML = `<pre style="color:red">Session status fetch error: ${e && e.message ? e.message : e}</pre>`;
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

    const user = auth.currentUser;
    if (!user) {
      showLogin(appDiv);
      return;
    }

    const session = await getSessionStatus(auth);

    if (!session || session.adminApproval !== "approved" || !session.emailVerified) {
      await auth.signOut();
      showLogin(appDiv);
      return;
    }

    // Secure role routing
    if (hash === '#admin' && session.role === 'admin') {
      showAdminPanel(appDiv, auth);
    } else if (hash === '#moderator' && session.role === 'moderator') {
      showModeratorPanel(appDiv, auth);
    } else if (hash === '#user') {
      showUserPanel(appDiv, auth);
    } else if (hash === '#login') {
      // If logged in and approved, force-redirect
      if (session.role === 'admin') window.location.hash = "#admin";
      else if (session.role === 'moderator') window.location.hash = "#moderator";
      else window.location.hash = "#user";
    } else {
      // any unknown route: redirect to login
      window.location.hash = "#login";
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  // Hot-reload on any login/logout/session restore as well as page loads
  window.firebaseAuth.onAuthStateChanged(() => router());
  router();
});
