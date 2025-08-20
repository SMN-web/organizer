import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';     // You can expand later
import { showAdminPanel } from './adminPanel.js';   // You can expand later
import { showModeratorPanel } from './moderatorPanel.js'; // You can expand later

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
      showAdminPanel(appDiv);
    } else if (hash === '#moderator') {
      showModeratorPanel(appDiv);
    } else {
      window.location.hash = '#login';
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err.message}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router();
