export function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <div class="form-group">
        <label for="username">Username <span style="color:#e74c3c">*</span></label>
        <input type="text" id="username" autocomplete="off">
        <div class="input-error" id="usernameError"></div>
      </div>
      <div class="form-group">
        <label for="name">Full name <span style="color:#e74c3c">*</span></label>
        <input type="text" id="name" autocomplete="off">
        <div class="input-error" id="nameError"></div>
      </div>
      <div class="form-group">
        <label for="email">Email <span style="color:#e74c3c">*</span></label>
        <input type="email" id="email" autocomplete="off">
        <div class="input-error" id="emailError"></div>
      </div>
      <div class="form-group" style="position:relative;">
        <label for="password">Password <span style="color:#e74c3c">*</span></label>
        <input type="password" id="password" autocomplete="off" style="width:100%;padding-right:42px;">
        <button type="button" id="togglePassword" class="toggle-btn" aria-label="Show Password">
          <span id="eyeIconPassword"></span>
        </button>
        <div class="input-error" id="passwordError"></div>
      </div>
      <div class="form-group" style="position:relative;">
        <label for="confirmPassword">Confirm password <span style="color:#e74c3c">*</span></label>
        <input type="password" id="confirmPassword" autocomplete="off" style="width:100%;padding-right:42px;">
        <button type="button" id="toggleConfirmPassword" class="toggle-btn" aria-label="Show Confirm Password">
          <span id="eyeIconConfirm"></span>
        </button>
        <div class="input-error" id="confirmPasswordError"></div>
      </div>
      <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="terms" required>
        <label for="terms" style="margin:0;">I accept the <a href="#terms" id="termsLink">terms and conditions</a></label>
      </div>
      <button type="submit" id="signupBtn" class="signup-btn">Sign Up</button>
      <div id="formError" style="color:#e74c3c;margin-top:10px"></div>
    </form>
  `;

  // Styles for error highlighting and mobile fit -- add to your CSS file:
  /*
  .form-group { margin-bottom: 14px; }
  .input-error { font-size: 0.98em; color: #e74c3c; min-height: 1.1em; }
  input.error { border-color: #e74c3c !important; background: #fff9f9 !important; }
  .signup-btn { background:#3498db; color:#fff; border:none; border-radius:6px; padding:0.7em 1.4em; margin-top:1em; font-size:1em; cursor:pointer; transition:background 0.2s;}
  .signup-btn:disabled { background: #b2bec3; cursor: not-allowed; }
  */

  // SVG icons
  const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2.5" fill="#333"/></svg>`;
  const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><line x1="5" y1="19" x2="19" y2="5" stroke="#333" stroke-width="2"/></svg>`;

  // Password toggle
  const passwordInput = container.querySelector('#password');
  const togglePasswordBtn = container.querySelector('#togglePassword');
  const eyeIconPassword = container.querySelector('#eyeIconPassword');
  eyeIconPassword.innerHTML = eyeClosedSVG;
  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    eyeIconPassword.innerHTML = isHidden ? eyeOpenSVG : eyeClosedSVG;
  });

  // Confirm Password toggle
  const confirmPasswordInput = container.querySelector('#confirmPassword');
  const toggleConfirmPasswordBtn = container.querySelector('#toggleConfirmPassword');
  const eyeIconConfirm = container.querySelector('#eyeIconConfirm');
  eyeIconConfirm.innerHTML = eyeClosedSVG;
  toggleConfirmPasswordBtn.addEventListener('click', () => {
    const isHidden = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isHidden ? 'text' : 'password';
    eyeIconConfirm.innerHTML = isHidden ? eyeOpenSVG : eyeClosedSVG;
  });

  // Terms navigation (SPA)
  container.querySelector('#termsLink').onclick = function(e) {
    e.preventDefault();
    window.location.hash = '#terms';
  };

  // Live validation helpers
  function validateUsername(val) {
    if (!val) return "Mandatory";
    if (!/^[a-zA-Z0-9]+$/.test(val)) return "Use only letters (a-z) and numbers (0-9).";
    return "";
  }
  function validateName(val) {
    if (!val) return "Mandatory";
    if (!/^[a-zA-Z ]+$/.test(val)) return "Only letters and spaces allowed.";
    return "";
  }
  function validateEmail(val) {
    if (!val) return "Mandatory";
    if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z]+$/.test(val)) return "Invalid email format.";
    return "";
  }
  function validatePassword(val) {
    if (!val) return "Mandatory";
    if (val.length < 8) return "Min 8 characters.";
    if (!/[a-zA-Z]/.test(val) || !/\\d/.test(val)) return "One letter and one number required.";
    return "";
  }
  function validateConfirm(val, passVal) {
    if (!val) return "Mandatory";
    if (val !== passVal) return "Passwords do not match.";
    return "";
  }

  // Helper for error class toggling
  function setErrorHighlight(input, error) {
    if (error) {
      input.classList.add('error');
    } else {
      input.classList.remove('error');
    }
  }

  // Live validation
  const usernameInput = container.querySelector('#username');
  const nameInput = container.querySelector('#name');
  const emailInput = container.querySelector('#email');
  const signupBtn = container.querySelector('#signupBtn');

  function updateValidation(showAll = false) {
    const usernameErr = validateUsername(usernameInput.value.trim());
    const nameErr = validateName(nameInput.value.trim());
    const emailErr = validateEmail(emailInput.value.trim());
    const passwordErr = validatePassword(passwordInput.value.trim());
    const confirmErr = validateConfirm(confirmPasswordInput.value.trim(), passwordInput.value.trim());

    const userErrBox = container.querySelector('#usernameError');
    const nameErrBox = container.querySelector('#nameError');
    const emailErrBox = container.querySelector('#emailError');
    const passErrBox = container.querySelector('#passwordError');
    const confErrBox = container.querySelector('#confirmPasswordError');

    userErrBox.textContent = usernameErr;
    nameErrBox.textContent = nameErr;
    emailErrBox.textContent = emailErr;
    passErrBox.textContent = passwordErr;
    confErrBox.textContent = confirmErr;

    setErrorHighlight(usernameInput, usernameErr);
    setErrorHighlight(nameInput, nameErr);
    setErrorHighlight(emailInput, emailErr);
    setErrorHighlight(passwordInput, passwordErr);
    setErrorHighlight(confirmPasswordInput, confirmErr);

    // If submitting, highlight all errors in red
    if (showAll) {
      userErrBox.style.color = usernameErr ? "#e74c3c" : "";
      nameErrBox.style.color = nameErr ? "#e74c3c" : "";
      emailErrBox.style.color = emailErr ? "#e74c3c" : "";
      passErrBox.style.color = passwordErr ? "#e74c3c" : "";
      confErrBox.style.color = confirmErr ? "#e74c3c" : "";
    } else {
      userErrBox.style.color = usernameErr ? "#e74c3c" : "#888";
      nameErrBox.style.color = nameErr ? "#e74c3c" : "#888";
      emailErrBox.style.color = emailErr ? "#e74c3c" : "#888";
      passErrBox.style.color = passwordErr ? "#e74c3c" : "#888";
      confErrBox.style.color = confirmErr ? "#e74c3c" : "#888";
    }

    // Disable signup if any error
    signupBtn.disabled = !!(usernameErr || nameErr || emailErr || passwordErr || confirmErr);
  }

  [usernameInput, nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
    input.addEventListener('blur', () => updateValidation());
    input.addEventListener('input', () => updateValidation());
  });

  // Firebase sign up logic
  const signupForm = container.querySelector('#signupForm');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show all missing/invalid fields
    updateValidation(true);
    if (signupBtn.disabled) {
      container.querySelector('#formError').textContent = "Fill required fields correctly.";
      return;
    }
    const terms = container.querySelector('#terms').checked;
    const formError = container.querySelector('#formError');
    formError.style.color = "#e74c3c";
    formError.textContent = "";

    if (!terms) {
      formError.textContent = "You must accept terms!";
      return;
    }

    try {
      const auth = window.firebaseAuth;
      await auth.createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value.trim());
      formError.style.color = "#27ae60";
      formError.textContent = "Signup successful!";
      signupForm.reset();
      eyeIconPassword.innerHTML = eyeClosedSVG;
      eyeIconConfirm.innerHTML = eyeClosedSVG;
      passwordInput.type = "password";
      confirmPasswordInput.type = "password";
      updateValidation();
    } catch (err) {
      formError.style.color = "#e74c3c";
      formError.textContent = err.message;
    }
  });

  // Initial validation state
  updateValidation();
}
