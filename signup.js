export function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <div style="position:relative;margin-bottom:12px;">
        <input type="text" id="username" required placeholder="Username" autocomplete="off">
        <div class="input-error" id="usernameError"></div>
      </div>
      <div style="position:relative;margin-bottom:12px;">
        <input type="text" id="name" required placeholder="Full name" autocomplete="off">
        <div class="input-error" id="nameError"></div>
      </div>
      <div style="position:relative;margin-bottom:12px;">
        <input type="email" id="email" required placeholder="Email" autocomplete="off">
        <div class="input-error" id="emailError"></div>
      </div>
      <div style="position:relative;margin-bottom:12px;">
        <input type="password" id="password" required placeholder="Password" autocomplete="off" style="width:100%;padding-right:42px;">
        <button type="button" id="togglePassword" class="toggle-btn" aria-label="Show Password">
          <span id="eyeIconPassword"></span>
        </button>
        <div class="input-error" id="passwordError"></div>
      </div>
      <div style="position:relative;margin-bottom:12px;">
        <input type="password" id="confirmPassword" required placeholder="Confirm password" autocomplete="off" style="width:100%;padding-right:42px;">
        <button type="button" id="toggleConfirmPassword" class="toggle-btn" aria-label="Show Confirm Password">
          <span id="eyeIconConfirm"></span>
        </button>
        <div class="input-error" id="confirmPasswordError"></div>
      </div>
      <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="terms" required>
        <label for="terms" style="margin:0;">I accept the <a href="#terms" id="termsLink">terms and conditions</a></label>
      </div>
      <button type="submit" id="signupBtn" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:0.7em 1.4em;margin-top:1em;font-size:1em;cursor:pointer;transition:background 0.2s;">Sign Up</button>
      <div id="formError" style="color:#e74c3c;margin-top:10px"></div>
    </form>
  `;

  // SVG icons (open and closed eye)
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
    if (!val) return "Required";
    if (!/^[a-zA-Z0-9]+$/.test(val)) return "Only letters and numbers, no spaces";
    return "";
  }
  function validateName(val) {
    if (!val) return "Required";
    if (!/^[a-zA-Z ]+$/.test(val)) return "Only letters and spaces";
    return "";
  }
  function validateEmail(val) {
    if (!val) return "Required";
    // Simple RFC2822 regex for demo
    if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]+$/.test(val)) return "Invalid email format";
    return "";
  }
  function validatePassword(val) {
    if (!val) return "Required";
    if (val.length < 8) return "Min 8 characters";
    if (!/[a-zA-Z]/.test(val) || !/\d/.test(val)) return "Must have letter and number";
    return "";
  }
  function validateConfirm(val, passVal) {
    if (!val) return "Required";
    if (val !== passVal) return "Passwords do not match";
    return "";
  }

  // Live validation on blur and input events
  const usernameInput = container.querySelector('#username');
  const nameInput = container.querySelector('#name');
  const emailInput = container.querySelector('#email');
  const signupBtn = container.querySelector('#signupBtn');

  function updateValidation() {
    const usernameErr = validateUsername(usernameInput.value.trim());
    const nameErr = validateName(nameInput.value.trim());
    const emailErr = validateEmail(emailInput.value.trim());
    const passwordErr = validatePassword(passwordInput.value.trim());
    const confirmErr = validateConfirm(confirmPasswordInput.value.trim(), passwordInput.value.trim());

    container.querySelector('#usernameError').textContent = usernameErr;
    container.querySelector('#nameError').textContent = nameErr;
    container.querySelector('#emailError').textContent = emailErr;
    container.querySelector('#passwordError').textContent = passwordErr;
    container.querySelector('#confirmPasswordError').textContent = confirmErr;

    // Disable signup if any error
    signupBtn.disabled = !!(usernameErr || nameErr || emailErr || passwordErr || confirmErr);
  }

  usernameInput.addEventListener('blur', updateValidation);
  nameInput.addEventListener('blur', updateValidation);
  emailInput.addEventListener('blur', updateValidation);
  passwordInput.addEventListener('blur', updateValidation);
  confirmPasswordInput.addEventListener('blur', updateValidation);

  // Also update on typing for good UX
  usernameInput.addEventListener('input', updateValidation);
  nameInput.addEventListener('input', updateValidation);
  emailInput.addEventListener('input', updateValidation);
  passwordInput.addEventListener('input', updateValidation);
  confirmPasswordInput.addEventListener('input', updateValidation);

  // Firebase sign up logic
  const signupForm = container.querySelector('#signupForm');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // One last check before submit
    updateValidation();
    if (signupBtn.disabled) return;
    const username = usernameInput.value.trim();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
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
      await auth.createUserWithEmailAndPassword(auth, email, password);
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
