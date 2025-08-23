import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';

const appDiv = document.getElementById('app');

function router() {
  const hash = window.location.hash || "#login";
  if (hash === "#signup")      return showSignup(appDiv);
  if (hash === "#login")       return showLogin(appDiv);
  if (hash === "#terms")       return showTerms(appDiv);
  if (hash === "#resend")      return showResendVerification(appDiv);
  if (hash === "#forgot")      return showForgot(appDiv);
  if (hash === "#user") {
    window.firebaseAuth.onAuthStateChanged(user => {
      if (user) showUserPanel(appDiv, window.firebaseAuth);
      else window.location.hash = "#login";
    });
    return;
  }
  if (hash === "#admin") {
    window.firebaseAuth.onAuthStateChanged(user => {
      if (user) showAdminPanel(appDiv, window.firebaseAuth);
      else window.location.hash = "#login";
    });
    return;
  }
  if (hash === "#moderator") {
    window.firebaseAuth.onAuthStateChanged(user => {
      if (user) showModeratorPanel(appDiv, window.firebaseAuth);
      else window.location.hash = "#login";
    });
    return;
  }
  window.location.hash = "#login";
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router();
