
export async function sessionRedirect(auth, container) {
  container.innerHTML = `<div style="padding:2em;text-align:center;">Authorizing...<br><span class="spinner"></span></div>`;
  const user = auth.currentUser;
  if (!user) {
    window.location.hash = "#login";
    return;
  }
  try {
    const token = await user.getIdToken(true);
    const resp = await fetch("https://session.nafil-8895-s.workers.dev/api/session-status", {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;"><b>Session error:</b> ${data.error || "Server error"}</div>`;
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
    // Trust backend panel verdict—set hash for router
    if (data.role === "admin")        window.location.hash = "#admin";
    else if (data.role === "moderator") window.location.hash = "#moderator";
    else                                window.location.hash = "#user";
  } catch (e) {
    container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">${e.message || "Network error"}</div>`;
    await auth.signOut();
    window.location.hash = "#login";
  }
}
