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
    <div style="padding:2em;font-size:1.2em;text-align:center;background:#ffecec;color:#c00;">
      &#9940; <b>ERROR:</b> <code>&lt;div id="app"&gt;</code> not found in HTML!
    </div>`;
  throw new Error('<div id="app"> is required!');
}

// Classic SPA router: detects Firebase Auth only, no backend check
function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;

    if (hash === '#signup') {
      showSignup(appDiv);
    } else if (hash === '#login') {
      showLogin(appDiv);
    } else if (hash === '#terms') {
      showTerms(appDiv);
    } else if (hash === '#resend') {
      showResendVerification(appDiv);
    } else if (hash === '#forgot') {
      showForgot(appDiv);
    } else if (hash === '#user') {
      auth.onAuthStateChanged(user => {
        if (user) {
          showUserPanel(appDiv, auth);
        } else {
          window.location.hash = "#login";
        }
      });
      return;
    } else if (hash === '#admin') {
      auth.onAuthStateChanged(user => {
        if (user) {
          showAdminPanel(appDiv, auth);
        } else {
          window.location.hash = "#login";
        }
      });
      return;
    } else if (hash === '#moderator') {
      auth.onAuthStateChanged(user => {
        if (user) {
          showModeratorPanel(appDiv, auth);
        } else {
          window.location.hash = "#login";
        }
      });
      return;
    } else {
      window.location.hash = '#login';
    }
  } catch (err) {
    appDiv.innerHTML = `<div style="background:#ffecec;color:#c00;padding:1em;text-align:center;">
      &#9940; <b>Router error:</b> ${err && err.message ? err.message : err}
    </div>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router();
