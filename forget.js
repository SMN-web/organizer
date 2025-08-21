import {
  getAuth,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export function showForgot(container) {
  container.innerHTML = `
    <div style="max-width:370px;margin:2em auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #ececec;padding:1.3em 1em 1em 1em;">
      <h2 style="text-align:center;">Reset Your Password</h2>
      <form id="forgotForm" novalidate style="margin-top:1.8em;">
        <input type="email" id="fpEmail" required placeholder="Enter your email"
          autocomplete="email" style="width:100%;padding:0.8em;font-size:1.07em;margin-bottom:8px;"/>
        <button type="submit" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:0.65em 1.3em;cursor:pointer;width:100%;font-size:1em;">
          Send Reset Link
        </button>
        <div id="fpMsg" style="margin-top:12px;min-height:1.2em;font-size:.98em;text-align:center;"></div>
      </form>
    </div>
  `;

  const form = container.querySelector('#forgotForm');
  const emailInput = container.querySelector('#fpEmail');
  const msgEl = container.querySelector('#fpMsg');

  form.onsubmit = async (e) => {
    e.preventDefault();
    msgEl.style.color = "#666";
    msgEl.textContent = "Sending reset link...";
    const email = emailInput.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
      msgEl.style.color = "#e74c3c";
      msgEl.textContent = "Please enter a valid email address.";
      return;
    }
    try {
      const auth = window.firebaseAuth || getAuth();
      // Optional: check if there's at least one sign-in method (avoid error for unregistered email)
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (!methods || methods.length === 0) {
        // Show privacy-respecting message regardless
        msgEl.style.color = "#27ae60";
        msgEl.textContent = "If your email is registered, a reset link has been sent. Please check your inbox and spam folders.";
        return;
      }
      await sendPasswordResetEmail(auth, email);
      msgEl.style.color = "#27ae60";
      msgEl.textContent = "If your email is registered, a reset link has been sent. Please check your inbox and spam folders.";
    } catch (error) {
      // Show privacy-respecting message regardless of error
      msgEl.style.color = "#27ae60";
      msgEl.textContent = "If your email is registered, a reset link has been sent. Please check your inbox and spam folders.";
    }
  };
}
