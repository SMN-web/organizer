import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { sessionRedirect } from './session.js';
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging.js";



export function showLogin(container) {
  if (window.firebaseAuth && window.firebaseAuth.currentUser) {
    sessionRedirect(window.firebaseAuth, container);
    return; 
  }
  container.innerHTML = `
    <h2>Login</h2>
    <form id="loginForm" novalidate>
      <div class="form-group">
        <label for="loginId">Email or Username <span style="color:#e74c3c">*</span></label>
        <input type="text" id="loginId" autocomplete="username" required aria-label="Email or Username">
        <div class="input-error" id="loginIdError"></div>
      </div>
      <div class="form-group" style="position:relative;">
        <label for="loginPassword">Password <span style="color:#e74c3c">*</span></label>
        <input type="password" id="loginPassword" autocomplete="current-password" required aria-label="Password" style="width:100%;padding-right:42px;">
        <button type="button" id="toggleLoginPassword" class="toggle-btn" tabindex="-1" aria-label="Show Password">
          <span id="eyeIconLoginPwd"></span>
        </button>
        <div class="input-error" id="loginPasswordError"></div>
      </div>
      <div style="margin:10px 0 12px 0;">
        <label style="display:flex;align-items:center;gap:7px;">
          <input type="checkbox" id="keepSignedIn" style="width:1.2em;height:1.2em;">
          Keep me signed in
        </label>
      </div>
      <button type="submit" id="loginBtn" class="signup-btn">Login</button>
      <div id="loginError" style="color:#e74c3c;margin-top:10px;"></div>
    </form>
    <div style="margin-top:12px;display:flex;flex-direction:column;align-items:center;">
      <a href="#forgot" id="forgotLink" style="font-size:0.97em;color:#3498db;cursor:pointer;margin-bottom:6px;">Forgot password?</a>
      <a href="#signup" style="font-size:0.97em;color:#3498db;cursor:pointer;">Create an account</a>
    </div>
  `;

  const loginForm = container.querySelector("#loginForm"),
        idInput = container.querySelector("#loginId"),
        pwdInput = container.querySelector("#loginPassword"),
        idErr = container.querySelector("#loginIdError"),
        pwdErr = container.querySelector("#loginPasswordError"),
        errBox = container.querySelector("#loginError"),
        loginBtn = container.querySelector("#loginBtn"),
        keepSignedInCheckbox = container.querySelector("#keepSignedIn"),
        forgotLink = container.querySelector("#forgotLink");

  // PASSWORD TOGGLE LOGIC
  const pwdToggleBtn = container.querySelector("#toggleLoginPassword");
  const eyeIcon = container.querySelector("#eyeIconLoginPwd");
  eyeIcon.innerHTML = getEyeSvg(false);

  pwdToggleBtn.onclick = function(e) {
    e.preventDefault();
    if (pwdInput.type === "password") {
      pwdInput.type = "text";
      eyeIcon.innerHTML = getEyeSvg(true);
      pwdToggleBtn.setAttribute('aria-label', 'Hide Password');
    } else {
      pwdInput.type = "password";
      eyeIcon.innerHTML = getEyeSvg(false);
      pwdToggleBtn.setAttribute('aria-label', 'Show Password');
    }
    pwdInput.focus();
  };

  function getEyeSvg(isOpen) {
    return isOpen
      ? `<svg height="21" stroke="#444" viewBox="0 0 24 24" width="23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="12" rx="7" ry="5.5" stroke-width="1.7"/>
          <circle cx="12" cy="12" r="2.5" fill="#444" />
        </svg>`
      : `<svg height="21" stroke="#444" viewBox="0 0 24 24" width="23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="12" rx="7" ry="5.5" stroke-width="1.7"/>
          <circle cx="12" cy="12" r="2.5" fill="#fff" />
          <line x1="4" y1="20" x2="20" y2="4" stroke="#b33" stroke-width="2"/>
        </svg>`;
  }

  // LOGIN FORM HANDLING
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.textContent = idErr.textContent = pwdErr.textContent = "";

    const rawId = idInput.value.trim(),
          password = pwdInput.value.trim();
    if (!rawId) { idErr.textContent = "Username or email required"; return; }
    if (!password) { pwdErr.textContent = "Password required"; return; }

    loginBtn.classList.add("loading");
    loginBtn.innerHTML = `<span class="spinner"></span>Logging in...`;
    try {
      // Backend login-lookup
      const resp = await fetch(
        "https://lucky-dawn-90bb.nafil-8895-s.workers.dev/api/login-lookup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: rawId }),
        }
      );
      const lookup = await resp.json();
      if (!resp.ok) {
        errBox.textContent = lookup.error || "Login failed";
        loginBtn.classList.remove("loading");
        loginBtn.innerHTML = "Login";
        return;
      }
      if (!lookup.email) {
        errBox.textContent = "Incorrect username/email or password.";
        loginBtn.classList.remove("loading");
        loginBtn.innerHTML = "Login";
        return;
      }
      if (lookup.adminApproval !== "approved") {
        errBox.textContent =
          lookup.adminApproval === "blocked"
            ? "Your account is blocked."
            : "Account pending approval.";
        loginBtn.classList.remove("loading");
        loginBtn.innerHTML = "Login";
        return;
      }
      // Firebase Auth with persistence
      const auth = window.firebaseAuth;
      const persistenceType = keepSignedInCheckbox.checked
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      try {
        await signInWithEmailAndPassword(auth, lookup.email, password);
        await auth.currentUser.reload();
        if (!auth.currentUser.emailVerified) {
          errBox.innerHTML = `Please verify your email to continue.<br>
            <a href="#resend" style="color:#3498db;">Resend verification email</a>`;
          await auth.signOut();
          loginBtn.classList.remove("loading");
          loginBtn.innerHTML = "Login";
          return;
        }
        await sessionRedirect(auth, container);

        // -- Secure FCM registration: --
        try {
          const reg = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
          const perm = await Notification.requestPermission();
          if (perm === "granted") {
            const messaging = getMessaging();
            const vapidKey = "BNsBdePtEeGZPBbTvE9MxHtq0EYzM6H8OYhHC_M46jDYCFSDyqN2NKEBXVpjU1MBMbY1lChkyVrCRP2bGc4ISZQ"; // <- put your real key here
            const fcmToken = await getToken(messaging, {
              vapidKey,
              serviceWorkerRegistration: reg
            });
            if (fcmToken && auth.currentUser) {
              const idToken = await auth.currentUser.getIdToken(true);
              await fetch("https://pu-no.nafil-8895-s.workers.dev/api/save-user-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + idToken
                },
                body: JSON.stringify({ fcmToken })
              });
            }
            window.currentFcmToken = fcmToken;
          }
        } catch (err) {
          // Optionally handle push registration error
        }

      } catch (firebaseErr) {
        errBox.textContent = "Incorrect username/email or password.";
        loginBtn.classList.remove("loading");
        loginBtn.innerHTML = "Login";
        return;
      }
    } catch (err) {
      errBox.textContent = "Network error. Try again.";
    }
    loginBtn.classList.remove("loading");
    loginBtn.innerHTML = "Login";
  });

  forgotLink.onclick = (e) => {
    e.preventDefault();
    window.location.hash = "#forgot";
  };
}
