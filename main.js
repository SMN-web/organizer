import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

import { getSessionStatus } from './session.js';

const appDiv = document.getElementById('app');
if (!appDiv) {
  document.body.innerHTML = `<div style="padding:2em;font-size:1.2em;text-align:center;background:#ffecec;color:#c00;">
    &#9940; <b>ERROR:</b> <code>&lt;div id="app"&gt;</code> not found in HTML!
  </div>`;
  throw new Error('<div id="app"> is required!');
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

    const user = auth.currentUser;
    if (!user) {
      showLogin(appDiv);
      return;
    }

    // Get session/role from backend. Don't check anything in frontend.
    const session = await getSessionStatus(auth, appDiv);
    if (!session) return;   // If backend says error, the error is already displayed as a message!

    // Backend sends { role: "...", ... } ONLY if all conditions OK.
    if      (hash === '#admin'     && session.role === 'admin')     return showAdminPanel(appDiv, auth);
    else if (hash === '#moderator' && session.role === 'moderator') return showModeratorPanel(appDiv, auth);
    else if (hash === '#user')                                   return showUserPanel(appDiv, auth);
    else if (hash === '#login') {
      // Always redirect logged-in, backend-approved user to correct panel!
      if      (session.role === 'admin')     window.location.hash = '#admin';
      else if (session.role === 'moderator') window.location.hash = '#moderator';
      else                                   window.location.hash = '#user';
    } else {
      showLogin(appDiv); // Fallback
    }
  } catch (err) {
    appDiv.innerHTML = `<div style="background:#ffecec;color:#c00;padding:1em;text-align:center;">
      &#9940; <b>Router error:</b> ${err && err.message ? err.message : err}
    </div>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  window.firebaseAuth.onAuthStateChanged(() => { router(); });
  router();
});
