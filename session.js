export async function sessionRedirect(auth, container) {
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
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">${data.error || "Session error."}</div>`;
      await auth.signOut();
      window.location.hash = "#login";
      return;
    }
    if (user.email.toLowerCase() !== data.email.toLowerCase()) {
      container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">
        Session email mismatch. Please login again.<br>
        <pre>Firebase: ${user.email} <br>Backend: ${data.email}</pre>
      </div>`;
      await auth.signOut();
      window.location.hash = "#login";
      return;
    }
    // Only the backend decides panel/role!
    if (data.role === "admin")        window.location.hash = "#admin";
    else if (data.role === "moderator") window.location.hash = "#moderator";
    else                                window.location.hash = "#user";
  } catch (e) {
    container.innerHTML = `<div style="color:#c00;background:#ffecec;padding:1em;">${e.message || "Network error."}</div>`;
    await auth.signOut();
    window.location.hash = "#login";
  }
}
