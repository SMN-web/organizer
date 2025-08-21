import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';

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
    } else if (hash === '#user') {
      showUserPanel(appDiv);
    } else if (hash === '#admin') {
      // Only render adminPanel if login is confirmed
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          showAdminPanel(appDiv);
        } else {
          // Show login UI if not signed in
          window.location.hash = "#login";
        }
      });
      return; // Prevents double rendering on hashchange
    } else if (hash === '#moderator') {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          showModeratorPanel(appDiv);
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
