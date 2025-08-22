// session.js

/**
 * Shows a visible error in the given container.
 */
export function showError(container, message) {
  container.innerHTML = `
    <div style="background:#ffecec;color:#c00;padding:1.1em;border-radius:10px;max-width:430px;margin:3em auto;text-align:center;font-weight:bold;box-shadow:0 2px 8px #eee;">
      &#9940; ${message}
    </div>
  `;
}

/**
 * Calls backend for session status. 
 * ONLY displays backend error/denial messages; all approval/role logic is on backend.
 * Returns session JSON if successful, else null.
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
    const data = await resp.json();
    if (!resp.ok || data.error) {
      // Backend returns { error: "..."} on any failed check
      showError(container, data.error || "Access denied by backend.");
      return null;
    }
    // Backend decided: data contains allowed session info!
    return data;
  } catch (e) {
    showError(container, `Network/backend error:<br>${e && e.message ? e.message : e}`);
    return null;
  }
}
