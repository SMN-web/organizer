import { showSignup } from './signup.js';
import { showLogin } from './login.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js';
import { showUserPanel } from './userPanel.js';
import { showAdminPanel } from './adminPanel.js';
import { showModeratorPanel } from './moderatorPanel.js';
import { showForgot } from './forget.js';
import { getSessionStatus, showWarning } from './session.js';

const appDiv = document.getElementById('app');

async function router() {
  const hash = window.location.hash || '#login';
  const auth = window.firebaseAuth;

  // Public pages (no login needed)
  if (hash === '#signup')         return showSignup(appDiv);
  if (hash === '#terms')          return showTerms(appDiv);
  if (hash === '#resend')         return showResendVerification(appDiv);
  if (hash === '#forgot')         return showForgot(appDiv);

  // Always check login state on load/hashchange
  const user = auth.currentUser;
  if (!user) {
    showLogin(appDiv);
    showWarning(appDiv, "Log in required to continue.");
    return;
  }

  // Now, mimic login.js: fetch canonical role/approval from backend
  const session = await getSessionStatus(auth, appDiv);
  if (!session) return; // (error box is already shown by getSessionStatus)

  if (session.adminApproval !== "approved") {
    await auth.signOut();
    showWarning(appDiv, "Your account is not approved yet. Please contact support or wait for admin approval.");
    return;
  }
  if (!session.emailVerified) {
    await auth.signOut();
    showWarning(appDiv, "Your email is not verified. Please verify your email to continue.");
    return;
  }

  // If user lands on login page while already logged in, redirect to correct role panel
  if (hash === '#login') {
    if (session.role === 'admin')        window.location.hash = '#admin';
    else if (session.role === 'moderator') window.location.hash = '#moderator';
    else                                  window.location.hash = '#user';
    return;
  }

  // Route to correct role-based panel
  if (hash === '#admin') {
    if (session.role === 'admin')      return showAdminPanel(appDiv, auth);
    showWarning(appDiv, "You do not have admin access.");
  } else if (hash === '#moderator') {
    if (session.role === 'moderator')  return showModeratorPanel(appDiv, auth);
    showWarning(appDiv, "You do not have moderator access.");
  } else if (hash === '#user') {
    showUserPanel(appDiv, auth);
  } else {
    showLogin(appDiv);
    showWarning(appDiv, "Unknown page. Redirected to login.");
  }
}

window.addEventListener('hashchange', () => { router(); });
window.addEventListener('load', () => {
  window.firebaseAuth.onAuthStateChanged(() => { router(); });
  router();
});
