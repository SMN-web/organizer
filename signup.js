export function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <input type="text" id="username" required placeholder="Username" autocomplete="off">
      <input type="text" id="name" required placeholder="Full name" autocomplete="off">
      <input type="email" id="email" required placeholder="Email" autocomplete="off">

      <div style="position:relative;margin-bottom:12px;">
        <input type="password" id="password" required placeholder="Password" autocomplete="off"
          style="width:100%;padding-right:42px;">
        <button type="button" id="togglePassword" class="toggle-btn" aria-label="Show Password">
          <span id="eyeIconPassword"></span>
        </button>
      </div>

      <div style="position:relative;margin-bottom:12px;">
        <input type="password" id="confirmPassword" required placeholder="Confirm password" autocomplete="off"
          style="width:100%;padding-right:42px;">
        <button type="button" id="toggleConfirmPassword" class="toggle-btn" aria-label="Show Confirm Password">
          <span id="eyeIconConfirm"></span>
        </button>
      </div>

      <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="terms" required>
        <label for="terms" style="margin:0;">I accept the <a href="#terms" id="termsLink">terms and conditions</a></label>
      </div>
      <button type="submit">Sign Up</button>
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

  // Firebase sign up logic
  const signupForm = container.querySelector('#signupForm');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = container.querySelector('#username').value.trim();
    const name = container.querySelector('#name').value.trim();
    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value.trim();
    const confirmPassword = container.querySelector('#confirmPassword').value.trim();
    const terms = container.querySelector('#terms').checked;
    const formError = container.querySelector('#formError');
    formError.textContent = "";

    // Validate required fields
    if (!username || !name || !email || !password || !confirmPassword || !terms) {
      formError.textContent = "All fields must be filled and terms accepted!";
      return;
    }
    if (password !== confirmPassword) {
      formError.textContent = "Passwords do not match!";
      return;
    }
    try {
      const auth = window.firebaseAuth;
      await auth.createUserWithEmailAndPassword(auth, email, password);
      formError.style.color = "#27ae60";
      formError.textContent = "Signup successful!";
      signupForm.reset();
      // Reset icon state and field type to password
      eyeIconPassword.innerHTML = eyeClosedSVG;
      eyeIconConfirm.innerHTML = eyeClosedSVG;
      passwordInput.type = "password";
      confirmPasswordInput.type = "password";
    } catch (err) {
      formError.style.color = "#e74c3c";
      formError.textContent = err.message;
    }
  });
}
