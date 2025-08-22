import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js'; // <-- Add this import!

const appDiv = document.getElementById('app');

function router() {
  try {
    const hash = window.location.hash || '#login';

    if (hash === '#signup') {
      showSignup(appDiv);
    } else if (hash === '#login') {
      showLogin(appDiv);
    } else if (hash === '#terms') {
      showTerms(appDiv);
    } else if (hash === '#resend') {
      showResendVerification(appDiv);
    } else if (hash === '#forgot') {               // <-- Add this route
      showForgot(appDiv);
    } else if (hash === '#user') {
      window.firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          showUserPanel(appDiv, window.firebaseAuth);
        } else {
          window.location.hash = "#login";
        }
      });
      return;
    } else if (hash === '#admin') {
      window.firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          showAdminPanel(appDiv, window.firebaseAuth);
        } else {
          window.location.hash = "#login";
        }
      });
      return;
    } else if (hash === '#moderator') {
      window.firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          showModeratorPanel(appDiv, window.firebaseAuth);
        } else {
          window.location.hash = "#login";
        }
      });
      return;
    } else {
      window.location.hash = '#login';
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router();
