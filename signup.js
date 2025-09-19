import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Utility for throttling uniqueness API calls
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <div class="form-group">
        <label for="username">Username <span style="color:#e74c3c">*</span></label>
        <input type="text" id="username" autocomplete="off" aria-label="Username" aria-invalid="false" tabindex="1">
        <div class="input-error" id="usernameError"></div>
      </div>
      <div class="form-group">
        <label for="name">Full name <span style="color:#e74c3c">*</span></label>
        <input type="text" id="name" autocomplete="off" aria-label="Full name" tabindex="2">
        <div class="input-error" id="nameError"></div>
      </div>
      <div class="form-group">
        <label for="email">Email <span style="color:#e74c3c">*</span></label>
        <input type="email" id="email" autocomplete="off" aria-label="Email" aria-invalid="false" tabindex="3">
        <div class="input-error" id="emailError"></div>
      </div>
      <div class="form-group" style="position:relative;">
        <label for="password">Password <span style="color:#e74c3c">*</span></label>
        <input type="password" id="password" autocomplete="off" aria-label="Password" tabindex="4" style="width:100%;padding-right:42px;">
        <button type="button" id="togglePassword" class="toggle-btn" aria-label="Show Password">
          <span id="eyeIconPassword"></span>
        </button>
        <div style="margin:2px 0 0 2px;font-size:0.95em;color:#888;">
          <span id="passwordStrength"></span>
        </div>
        <div class="input-error" id="passwordError"></div>
      </div>
      <div class="form-group" style="position:relative;">
        <label for="confirmPassword">Confirm password <span style="color:#e74c3c">*</span></label>
        <input type="password" id="confirmPassword" autocomplete="off" aria-label="Confirm password" tabindex="5" style="width:100%;padding-right:42px;">
        <button type="button" id="toggleConfirmPassword" class="toggle-btn" aria-label="Show Confirm Password">
          <span id="eyeIconConfirm"></span>
        </button>
        <div class="input-error" id="confirmPasswordError"></div>
      </div>
      <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="terms" required tabindex="6">
        <label for="terms" style="margin:0;">I accept the <a href="#terms" id="termsLink">terms and conditions</a></label>
      </div>
      <button type="submit" id="signupBtn" class="signup-btn" tabindex="7">Sign Up</button>
      <div id="formError" style="color:#e74c3c;margin-top:10px"></div>
      <div style="margin-top:18px;text-align:center;">
  <a href="#resend" style="font-size:0.98em;color:#3498db;cursor:pointer;">
    Didn't get your verification email? Resend
  </a>
</div>

    </form>
  `;

  // Eye icons
  const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2.5" fill="#333"/></svg>`;
  const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><line x1="5" y1="19" x2="19" y2="5" stroke="#333" stroke-width="2"/></svg>`;

  // Password toggles
  const passwordInput = container.querySelector('#password');
  const togglePasswordBtn = container.querySelector('#togglePassword');
  const eyeIconPassword = container.querySelector('#eyeIconPassword');
  eyeIconPassword.innerHTML = eyeClosedSVG;
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeIconPassword.innerHTML = isHidden ? eyeOpenSVG : eyeClosedSVG;
  });

  const confirmPasswordInput = container.querySelector('#confirmPassword');
  const toggleConfirmPasswordBtn = container.querySelector('#toggleConfirmPassword');
  const eyeIconConfirm = container.querySelector('#eyeIconConfirm');
  eyeIconConfirm.innerHTML = eyeClosedSVG;
  toggleConfirmPasswordBtn.addEventListener('click', () => {
    const isHidden = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isHidden ? 'text' : 'password';
    eyeIconConfirm.innerHTML = isHidden ? eyeOpenSVG : eyeClosedSVG;
  });

  // Terms SPA navigation
  container.querySelector('#termsLink').onclick = function(e) {
    e.preventDefault();
    window.location.hash = '#terms';
  };

  // Debounced uniqueness check
  const checkUnique = debounce(async (field, value) => {
    if (!value) return;
    try {
      const res = await fetch('https://lo-in.smnglobal.workers.dev/api/check-unique', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value.toLowerCase() })
      });
      const json = await res.json();
      if (field === "username" && json.usernameAvailable === false) {
        usernameDuplicateError = "Username already exists.";
      } else if (field === "username") {
        usernameDuplicateError = "";
      }
      if (field === "email" && json.emailAvailable === false) {
        emailDuplicateError = "Email already registered.";
      } else if (field === "email") {
        emailDuplicateError = "";
      }
      updateValidation();
    } catch (e) {
      // Network or backend error: don't block form, but clear errors!
      if (field === "username") usernameDuplicateError = "";
      if (field === "email") emailDuplicateError = "";
      updateValidation();
    }
  }, 600);

  // Password strength meter
  function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 2) return "Weak";
    if (score <= 4) return "Medium";
    return "Strong";
  }
  const passwordStrengthEl = container.querySelector('#passwordStrength');
  passwordInput.addEventListener("input", () => {
    if (passwordInput.value) {
      passwordStrengthEl.textContent = "Strength: " + getPasswordStrength(passwordInput.value);
      passwordStrengthEl.style.color = getPasswordStrength(passwordInput.value) === "Strong" ? "#27ae60"
        : getPasswordStrength(passwordInput.value) === "Medium" ? "#f39c12" : "#e74c3c";
    } else {
      passwordStrengthEl.textContent = "";
    }
  });

  // Validation helpers
  function validateUsername(val) {
    if (!val) return "";
    if (!/^[a-zA-Z0-9]+$/.test(val)) return "Use only letters (a-z) and numbers (0-9).";
    return "";
  }
  function validateName(val) {
    if (!val) return "";
    if (!/^[a-zA-Z ]+$/.test(val)) return "Only letters and spaces allowed.";
    return "";
  }
  function validateEmail(val) {
    if (!val) return "";
    if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(val)) return "Enter a valid email address.";
    return "";
  }
  function validatePassword(val) {
    if (!val) return "";
    if (val.length < 8) return "Min 8 characters.";
    if (!/[a-zA-Z]/.test(val) || !/\d/.test(val)) return "One letter and one number required.";
    return "";
  }
  function validateConfirm(val, passVal) {
    if (!val) return "";
    if (val !== passVal) return "Passwords do not match.";
    return "";
  }
  function setErrorHighlight(input, error) {
    if (error) input.classList.add('error');
    else input.classList.remove('error');
  }
  // Duplicate state
  let usernameDuplicateError = "";
  let emailDuplicateError = "";
  // State for 'touched' fields
  let touched = {
    username: false, name: false, email: false, password: false, confirmPassword: false
  };

  // Field refs
  const usernameInput = container.querySelector('#username');
  const nameInput = container.querySelector('#name');
  const emailInput = container.querySelector('#email');
  const signupBtn = container.querySelector('#signupBtn');

  // Live Uniqueness Check on Blur/Input (debounced)
  usernameInput.addEventListener('blur', () => {
    touched.username = true;
    if (!validateUsername(usernameInput.value.trim())) {
      checkUnique('username', usernameInput.value.trim());
    }
    updateValidation();
  });
  emailInput.addEventListener('blur', () => {
    touched.email = true;
    if (!validateEmail(emailInput.value.trim())) {
      checkUnique('email', emailInput.value.trim());
    }
    updateValidation();
  });

  // Other live validation triggers
  [usernameInput, nameInput, passwordInput, confirmPasswordInput].forEach((input) => {
    input.addEventListener('blur', () => { touched[input.id] = true; updateValidation(); });
    input.addEventListener('input', () => updateValidation());
  });
  emailInput.addEventListener('input', () => updateValidation());

  // Accessibility: aria-invalid updates
  function updateAriaInvalid(input, error) {
    input.setAttribute('aria-invalid', !!error);
  }

  function updateValidation(showAll = false) {
    const usernameVal = usernameInput.value.trim();
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value.trim();
    const confirmVal = confirmPasswordInput.value.trim();

    // Individual validation
    const usernameErr = (touched.username || showAll) ? (validateUsername(usernameVal) || usernameDuplicateError) : "";
    const nameErr = (touched.name || showAll) ? validateName(nameVal) : "";
    const emailErr = (touched.email || showAll) ? (validateEmail(emailVal) || emailDuplicateError) : "";
    const passwordErr = (touched.password || showAll) ? validatePassword(passwordVal) : "";
    const confirmErr = (touched.confirmPassword || showAll) ? validateConfirm(confirmVal, passwordVal) : "";

    container.querySelector('#usernameError').textContent = usernameErr;
    container.querySelector('#nameError').textContent = nameErr;
    container.querySelector('#emailError').textContent = emailErr;
    container.querySelector('#passwordError').textContent = passwordErr;
    container.querySelector('#confirmPasswordError').textContent = confirmErr;

    setErrorHighlight(usernameInput, usernameErr);
    setErrorHighlight(nameInput, nameErr);
    setErrorHighlight(emailInput, emailErr);
    setErrorHighlight(passwordInput, passwordErr);
    setErrorHighlight(confirmPasswordInput, confirmErr);

    updateAriaInvalid(usernameInput, usernameErr);
    updateAriaInvalid(emailInput, emailErr);

    signupBtn.disabled = false; // Always enabled
  }

  // Signup + spinner, uniqueness/validation
  const signupForm = container.querySelector('#signupForm');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    updateValidation(true);

    // Gather values
    const usernameVal = usernameInput.value.trim().toLowerCase();
    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim().toLowerCase();
    const passwordVal = passwordInput.value.trim();
    const confirmVal = confirmPasswordInput.value.trim();
    const terms = container.querySelector('#terms').checked;
    const formError = container.querySelector('#formError');
    formError.style.color = "#e74c3c";
    formError.textContent = "";

    // Check terms first
    if (!terms) {
      formError.textContent = "Please accept terms and conditions.";
      return;
    }

    // Check all errors (including uniqueness)
    if (
      !usernameVal || !nameVal || !emailVal || !passwordVal || !confirmVal ||
      validateUsername(usernameVal) ||
      validateName(nameVal) ||
      validateEmail(emailVal) ||
      validatePassword(passwordVal) ||
      validateConfirm(confirmVal, passwordVal) ||
      usernameDuplicateError ||
      emailDuplicateError
    ) {
      formError.textContent = "Please fill all the required fields.";
      updateValidation(true);
      return;
    }

    // Show spinner
    signupBtn.classList.add('loading');
    signupBtn.innerHTML = `<span class="spinner"></span>Signing up...`;

    try {
      const auth = window.firebaseAuth;
      const cred = await createUserWithEmailAndPassword(auth, emailVal, passwordVal);
      await sendEmailVerification(cred.user);

      // Call backend to create user record (no emailVerified)
      await fetch("https://lo-in.smnglobal.workers.dev/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: cred.user.uid,
          username: usernameVal,
          email: emailVal,
          name: nameVal,
          adminApproval: "pending",
          role: "user"
        })
      });

      formError.style.color = "#27ae60";
      formError.textContent = "Signup successful! Please check your email to verify.";
      signupForm.reset();
      eyeIconPassword.innerHTML = eyeClosedSVG;
      eyeIconConfirm.innerHTML = eyeClosedSVG;
      passwordInput.type = "password";
      confirmPasswordInput.type = "password";
      usernameDuplicateError = "";
      emailDuplicateError = "";
      Object.keys(touched).forEach(k => touched[k] = false);
      passwordStrengthEl.textContent = "";
      passwordStrengthEl.style.color = "#888";
      updateValidation();
    } catch (err) {
      formError.style.color = "#e74c3c";
      formError.textContent = err.message || "Signup failed";
    }
    signupBtn.classList.remove('loading');
    signupBtn.innerHTML = "Sign Up";
  });

  updateValidation();
}
