
export async function sessionRedirect(auth, container) {
  container.innerHTML = `<div style="padding:2em;text-align:center;">Authorizing...<br><span class="spinner"></span></div>`;
  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">Session expired.<br>Please log in again.</div>`;
    window.location.hash = "#login";
    return;
  }
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch("https://session.nafil-8895-s.workers.dev/api/session-status", {
      headers: { "Authorization": "Bearer " + token }
    });
    let data = {};
    try { data = await resp.json(); } catch { data = {}; }
    if (!resp.ok || data.error) {
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;"><b>Session error:</b> ${data.error || "Server error"}<br>Status: ${resp.status}</div>`;
      await auth.signOut();
      window.location.hash = "#login";
      return;
    }
    if (user.email.toLowerCase() !== data.email.toLowerCase()) {
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">
        Session user mismatch. Please log in again.
      </div>`;
      await auth.signOut();
      window.location.hash = "#login";
      return;
    }
    // Redirect by backend role
    if (data.role === "admin")        window.location.hash = "#admin";
    else if (data.role === "moderator") window.location.hash = "#moderator";
    else                                window.location.hash = "#user";
  } catch (e) {
    container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">
      Network error: ${e.message || e}
    </div>`;
    await auth.signOut();
    window.location.hash = "#login";
  }
}
