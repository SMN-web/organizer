// session.js

/**
 * Shows a visible error in the specified container (call from anywhere).
 */
export function showError(container, message) {
  container.innerHTML = `
    <div style="background:#ffecec;color:#c00;padding:1.1em;border-radius:10px;max-width:430px;margin:3em auto;text-align:center;font-weight:bold;box-shadow:0 2px 8px #eee;">
      &#9940; ${message}
    </div>
  `;
}

/**
 * Shows a visible warning in the specified container.
 */
export function showWarning(container, message) {
  container.innerHTML = `
    <div style="background:#fff7cf;color:#744800;padding:1.1em;border-radius:10px;max-width:430px;margin:3em auto;text-align:center;font-weight:bold;box-shadow:0 2px 8px #eee;">
      &#9888;&#65039; ${message}
    </div>
  `;
}

/**
 * Fetches backend session status for the logged-in user.
 * Displays a visible error on any network/API failure.
 * Returns session JSON or null.
 *
 * Usage: const session = await getSessionStatus(window.firebaseAuth, appDiv);
 */
export async function getSessionStatus(auth, container) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch('https://session.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });
    if (!resp.ok) {
      const text = await resp.text();
      showError(container, `Session status error [${resp.status}]:<br>${text}`);
      return null;
    }
    return await resp.json(); // { email, role, adminApproval, emailVerified }
  } catch (e) {
    showError(container, `Network or backend error:<br>${e && e.message ? e.message : e}`);
    return null;
  }
}
