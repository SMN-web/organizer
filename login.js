import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export function showLogin(container) {
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

  // Password visibility toggle
  const passwordInput = container.querySelector('#loginPassword');
  const togglePwdBtn = container.querySelector('#toggleLoginPassword');
  const eyeIcon = container.querySelector('#eyeIconLoginPwd');
  const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2.5" fill="#333"/></svg>`;
  const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><line x1="5" y1="19" x2="19" y2="5" stroke="#333" stroke-width="2"/></svg>`;
  eyeIcon.innerHTML = eyeClosedSVG;
  togglePwdBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeIcon.innerHTML = isHidden ? eyeOpenSVG : eyeClosedSVG;
  });

  // Handle Login
  const loginForm = container.querySelector('#loginForm');
  const idInput = container.querySelector('#loginId');
  const pwdInput = passwordInput;
  const idErr = container.querySelector('#loginIdError');
  const pwdErr = container.querySelector('#loginPasswordError');
  const errBox = container.querySelector('#loginError');
  const loginBtn = container.querySelector('#loginBtn');
  const keepSignedInCheckbox = container.querySelector('#keepSignedIn');
  const forgotLink = container.querySelector('#forgotLink');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.textContent = idErr.textContent = pwdErr.textContent = "";

    const rawId = idInput.value.trim();
    const password = pwdInput.value.trim();
    if (!rawId) {
      idErr.textContent = "Username or email required";
      return;
    }
    if (!password) {
      pwdErr.textContent = "Password required";
      return;
    }

    loginBtn.classList.add('loading');
    loginBtn.innerHTML = `<span class="spinner"></span>Logging in...`;
    try {
      // 1. Check backend for approval and canonical email
      const resp = await fetch("https://lucky-dawn-90bb.nafil-8895-s.workers.dev/api/login-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: rawId })
      });
      const lookup = await resp.json();
      if (!resp.ok) {
        errBox.textContent = lookup.error || "Login failed";
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = "Login";
        return;
      }
      if (!lookup.email) {
        errBox.textContent = "Incorrect username/email or password.";
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = "Login";
        return;
      }
      if (lookup.adminApproval !== "approved") {
        errBox.textContent = 
          lookup.adminApproval === "blocked"
          ? "Your account is blocked." 
          : "Account pending approval.";
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = "Login";
        return;
      }

      // 2. Firebase Auth with persistence
      const auth = window.firebaseAuth;
      const persistenceType = keepSignedInCheckbox.checked
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      try {
        const cred = await signInWithEmailAndPassword(auth, lookup.email, password);
        await auth.currentUser.reload();
        if (!auth.currentUser.emailVerified) {
          errBox.innerHTML = `Please verify your email to continue.<br>
            <a href="#resend" style="color:#3498db;">Resend verification email</a>`;
          await auth.signOut();
          loginBtn.classList.remove('loading');
          loginBtn.innerHTML = "Login";
          return;
        }
        // 3. Get ID token, send to backend for auth context/session routing
        const token = await auth.currentUser.getIdToken();
        // Example: you can fetch user context, or just route based on user's role
        if (lookup.role === "admin") {
          window.location.hash = "#admin";
        } else if (lookup.role === "moderator") {
          window.location.hash = "#moderator";
        } else {
          window.location.hash = "#user";
        }
      } catch (firebaseErr) {
        errBox.textContent = "Incorrect username/email or password.";
        loginBtn.classList.remove('loading');
        loginBtn.innerHTML = "Login";
        return;
      }
    } catch (err) {
      errBox.textContent = "Network error. Try again.";
    }
    loginBtn.classList.remove('loading');
    loginBtn.innerHTML = "Login";
  });

  // Navigation for forgot password
  forgotLink.onclick = (e) => {
    e.preventDefault();
    window.location.hash = "#forgot";
  };
}
