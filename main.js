import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

import { getSessionStatus, showError } from './session.js';

const appDiv = document.getElementById('app');
if (!appDiv) {
  document.body.innerHTML = `<div style="padding:2em;font-size:1.2em;text-align:center;background:#ffecec;color:#c00;">
    &#9940; <b>ERROR:</b> <code>&lt;div id="app"&gt;</code> not found in HTML!
  </div>`;
  throw new Error('<div id="app"> is required!');
}

async function router() {
  const hash = window.location.hash || '#login';
  const auth = window.firebaseAuth;

  // Public pages
  if (hash === '#signup')         return showSignup(appDiv);
  if (hash === '#terms')          return showTerms(appDiv);
  if (hash === '#resend')         return showResendVerification(appDiv);
  if (hash === '#forgot')         return showForgot(appDiv);

  // App: get backend session, trust backend
  const user = auth.currentUser;
  if (!user) {
    showLogin(appDiv);
    return;
  }

  const session = await getSessionStatus(auth, appDiv);
  if (!session) return;    // If backend returns error, it's displayed—nothing else happens

  // Backend already approved/verified and supplied role
  if (hash === '#admin' && session.role === 'admin') {
    showAdminPanel(appDiv, auth);
  } else if (hash === '#moderator' && session.role === 'moderator') {
    showModeratorPanel(appDiv, auth);
  } else if (hash === '#user') {
    showUserPanel(appDiv, auth);
  } else if (hash === '#login') {
    // Always redirect logged-in, backend-approved user to their panel
    if (session.role === 'admin')        window.location.hash = '#admin';
    else if (session.role === 'moderator') window.location.hash = '#moderator';
    else                                  window.location.hash = '#user';
  } else {
    showLogin(appDiv);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  window.firebaseAuth.onAuthStateChanged(() => { router(); });
  router();
});
