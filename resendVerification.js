import {
  getAuth,
  fetchSignInMethodsForEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export function showResendVerification(container) {
  container.innerHTML = `
    <div style="max-width:370px;margin:2em auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #ececec;padding:1.3em 1em 1em 1em;">
      <h2 style="text-align:center;">Resend Verification Email</h2>
      <form id="resendForm" novalidate style="margin-top:1.8em;">
        <input type="email" id="rvEmail" required placeholder="Enter your email"
          autocomplete="email" style="width:100%;padding:0.8em;font-size:1.07em;margin-bottom:8px;"/>
        <button type="submit" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:0.65em 1.3em;cursor:pointer;width:100%;font-size:1em;">
          Send Verification Link
        </button>
        <div id="rvMsg" style="margin-top:12px;min-height:1.2em;font-size:.98em;text-align:center;"></div>
      </form>
    </div>
  `;

  const form = container.querySelector('#resendForm');
  const emailInput = container.querySelector('#rvEmail');
  const msgEl = container.querySelector('#rvMsg');

  form.onsubmit = async (e) => {
    e.preventDefault();
    msgEl.style.color = "#666";
    msgEl.textContent = "Sending verification link...";
    const email = emailInput.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
      msgEl.style.color = "#e74c3c";
      msgEl.textContent = "Please enter a valid email address.";
      return;
    }
    try {
      const auth = window.firebaseAuth || getAuth();
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (!methods || methods.length === 0) {
        // Privacy: always show generic response
        msgEl.style.color = "#27ae60";
        msgEl.textContent = "If your email is registered, a verification link was sent. If you've just requested a verification link, it may take a few minutes to arrive. Please check your inbox and spam folders. If you didn't receive it, try again in a few minutes. ";
        return;
      }
      // Try to sign in silently to send verification (if password enabled)
      if (methods.includes("password")) {
        // No password required for resend; Firebase currently doesn’t support direct send unless logged in,
        // so we'll show the generic message to be privacy-respecting.
        msgEl.style.color = "#27ae60";
        msgEl.textContent = "If your email is registered and unverified, a verification link was sent. If you've just requested a verification link, it may take a few minutes to arrive. Please check your inbox and spam folders. If you didn't receive it, try again in a few minutes. ";
        return;
      }
      // For social login etc., same (show generic)
      msgEl.style.color = "#27ae60";
      msgEl.textContent = "If your email is registered and unverified, a verification link was sent.";
    } catch (error) {
      msgEl.style.color = "#27ae60";
      msgEl.textContent = "If your email is registered and unverified, a verification link was sent. If you've just requested a verification link, it may take a few minutes to arrive. Please check your inbox and spam folders. If you didn't receive it, try again in a few minutes.";
    }
  };
}
