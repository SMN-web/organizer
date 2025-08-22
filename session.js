// session.js

export function showError(container, message) {
  container.innerHTML = `
    <div style="background:#ffecec;color:#c00;padding:1.1em;border-radius:10px;max-width:430px;margin:3em auto;text-align:center;font-weight:bold;box-shadow:0 2px 8px #eee;">
      &#9940; ${message}
    </div>
  `;
}

/**
 * Calls backend session-status.
 * If backend sends {error: "..."} or non-200, shows error directly.
 * Returns session JSON if success, else null.
 */
export async function getSessionStatus(auth, container) {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch('https://session.nafil-8895-s.workers.dev/api/session-status', {
      headers: { "Authorization": "Bearer " + token }
    });

    let data = {};
    try {
      data = await resp.json();
    } catch (e) {
      showError(container, "Session-status response not valid JSON.");
      return null;
    }
    if (!resp.ok || data.error) {
      showError(container, data.error || "Access denied by backend.");
      return null;
    }
    return data;
  } catch (e) {
    showError(container, `Network/backend error:<br>${e && e.message ? e.message : e}`);
    return null;
  }
}
