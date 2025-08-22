// session.js

/**
 * Checks backend session and redirects to the correct panel after verifying everything on the backend.
 * Use: import { sessionRedirect } from './session.js';
 *      Call sessionRedirect(window.firebaseAuth, appDiv) after login, or in main.js hash logic.
 */
export async function sessionRedirect(auth, container) {
  const user = auth.currentUser;
  if (!user) {
    window.location.hash = "#login";
    return;
  }
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch('https://session.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    let data = {};
    try {
      data = await resp.json();
    } catch (e) {
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">Session-status response not valid JSON.</div>`;
      await auth.signOut();
      window.location.hash = "#login";
      return;
    }
    if (!resp.ok || data.error) {
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">${data.error || "Access denied by backend."}</div>`;
      await auth.signOut();
      window.location.hash = "#login";
      return;
    }
    // Redirect to correct panel based on backend role
    if (data.role === 'admin')        window.location.hash = "#admin";
    else if (data.role === 'moderator') window.location.hash = "#moderator";
    else                                window.location.hash = "#user";
  } catch (e) {
    container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">Network/backend error:<br>${e && e.message ? e.message : e}</div>`;
    await auth.signOut();
    window.location.hash = "#login";
  }
}
