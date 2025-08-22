import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

window.firebaseAuth = getAuth();

const appDiv = document.getElementById('app');
if (!appDiv) {
  document.body.innerHTML = '<pre style="color:red">FATAL: &lt;div id="app"&gt; not found in HTML</pre>';
  throw new Error('Div app not found in DOM');
}

// Robust session status fetch (returns null on any problem)
async function getSessionStatus(auth) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true); // always get latest
    const resp = await fetch('https://ad-api.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    appDiv.innerHTML = `<pre style="color:red">Session status fetch error: ${e && e.message ? e.message : e}</pre>`;
    return null;
  }
}

// Main router: always safe, always shows errors
async function router() {
  try {
    const hash = window.location.hash || '#login';
    const auth = window.firebaseAuth;
    const user = auth.currentUser;

    // Dynamic import so you see load errors!
    let showSignup, showLogin, showTerms, showResendVerification, showUserPanel, showAdminPanel, showModeratorPanel, showForgot;
    try {
      ({ showSignup }            = await import('./signup.js'));
      ({ showLogin }             = await import('./login.js'));
      ({ showTerms }             = await import('./terms.js'));
      ({ showResendVerification }= await import('./resendVerification.js'));
      ({ showUserPanel }         = await import('./userPanel.js'));
      ({ showAdminPanel }        = await import('./adminPanel.js'));
      ({ showModeratorPanel }    = await import('./moderatorPanel.js'));
      ({ showForgot }            = await import('./forget.js'));
    } catch (e) {
      appDiv.innerHTML = `<pre style="color:red">Module import error: ${e && e.message ? e.message : e}</pre>`;
      return;
    }

    // Unprotected/public pages
    if (hash === '#signup')      return showSignup(appDiv);
    if (hash === '#terms')       return showTerms(appDiv);
    if (hash === '#resend')      return showResendVerification(appDiv);
    if (hash === '#forgot')      return showForgot(appDiv);

    // All other routes require full auth/session approval
    if (!user) {
      window.location.hash = "#login";
      return showLogin(appDiv);
    }

    // Always check backend status for verified+approved before showing app
    const session = await getSessionStatus(auth);

    if (!session || session.adminApproval !== "approved" || !session.emailVerified) {
      await auth.signOut();
      window.location.hash = "#login";
      return showLogin(appDiv);
    }

    // Panel routing by role
    if (hash === "#admin") {
      if (session.role === "admin") return showAdminPanel(appDiv, auth);
      window.location.hash = "#login";
      return showLogin(appDiv);
    }
    if (hash === "#moderator") {
      if (session.role === "moderator") return showModeratorPanel(appDiv, auth);
      window.location.hash = "#login";
      return showLogin(appDiv);
    }
    if (hash === "#user") {
      return showUserPanel(appDiv, auth);
    }
    if (hash === "#login") {
      // Already logged in, approved, verified: send to correct panel
      if (session.role === "admin")         window.location.hash = "#admin";
      else if (session.role === "moderator")window.location.hash = "#moderator";
      else                                  window.location.hash = "#user";
      return;
    }
    // Fallback: always to login
    window.location.hash = "#login";
    showLogin(appDiv);

  } catch (err) {
    // Always show fatal, don't leave blank
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err && err.message ? err.message : err}</pre>`;
  }
}

// Re-route for hash, first load, AND on login/logout/session restore
window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  window.firebaseAuth.onAuthStateChanged(() => router());
  router(); // Run immediately as well
});
