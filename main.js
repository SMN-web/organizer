import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';
import { sessionRedirect } from './session.js';

const appDiv = document.getElementById('app');

function handleRoute(user) {
  const hash = window.location.hash || "#login";
  // Public pages (no login requirement)
  if (hash === "#signup") return showSignup(appDiv);
  if (hash === "#login")  return showLogin(appDiv);
  if (hash === "#terms")  return showTerms(appDiv);
  if (hash === "#resend") return showResendVerification(appDiv);
  if (hash === "#forgot") return showForgot(appDiv);

  // Auth required for below
  if (!user) {
    showLogin(appDiv);
    window.location.hash = "#login";
    return;
  }
  // For any protected route, always delegate to sessionRedirect, which will reroute as needed
  sessionRedirect(window.firebaseAuth, appDiv);
}

// Trigger router on auth state changes & every hash change
window.firebaseAuth.onAuthStateChanged(user => handleRoute(user));
window.addEventListener('hashchange', () => {
  handleRoute(window.firebaseAuth.currentUser);
});
handleRoute(window.firebaseAuth.currentUser);
