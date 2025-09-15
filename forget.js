import { 
  getAuth,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export function showForgot(container) {
  container.innerHTML = `
    <div style="max-width:370px;margin:2em auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #ececec;padding:1.3em 1em 1em 1em;">
      <h2 style="text-align:center;">Reset Your Password</h2>
      <form id="forgotForm" novalidate style="margin-top:1.8em;">
        <input type="email" id="fpEmail" required placeholder="Enter your email"
          autocomplete="email" style="width:100%;padding:0.8em;font-size:1.07em;margin-bottom:8px;" />
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

    // Normalize email input for reliability
    const email = emailInput.value.trim().toLowerCase();

    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(email)) {
      msgEl.style.color = "#e74c3c";
      msgEl.textContent = "Please enter a valid email address.";
      return;
    }

    try {
      // Use the pre-initialized auth instance from window.firebaseAuth if available
      const auth = window.firebaseAuth || getAuth();
      await sendPasswordResetEmail(auth, email);
      msgEl.style.color = "#27ae60";
      msgEl.textContent = "Reset link sent! Check your inbox and spam folders.";
    } catch (error) {
      // Show Firebase error code or message directly
      msgEl.style.color = "#e74c3c";

      // Friendly error messages for common cases
      if (error.code === "auth/user-not-found") {
        msgEl.textContent = "No account found with this email.";
      } else if (error.code === "auth/invalid-email") {
        msgEl.textContent = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        msgEl.textContent = "Too many attempts. Please try again later.";
      } else {
        msgEl.textContent = "Error sending reset email: " + (error.message || error.code || error.toString());
      }
    }
  };
}
