export function initSignup(container, auth) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <label>
        Username:<br/>
        <input type="text" id="username" required autocomplete="off" placeholder="Username">
      </label><br/>

      <label>
        Full Name:<br/>
        <input type="text" id="name" required autocomplete="off" placeholder="Full name">
      </label><br/>

      <label>
        Email:<br/>
        <input type="email" id="email" required autocomplete="off" placeholder="Email">
      </label><br/>

      <label>
        Password:<br/>
        <div style="display:flex; gap:8px;">
          <input type="password" id="password" required autocomplete="off" placeholder="Password" style="flex:1;">
          <button type="button" id="togglePassword" style="background:none;border:none;cursor:pointer;">
            <span id="eyeIconPassword"></span>
          </button>
        </div>
      </label><br/>

      <label>
        Confirm Password:<br/>
        <div style="display:flex; gap:8px;">
          <input type="password" id="confirmPassword" required autocomplete="off" placeholder="Confirm password" style="flex:1;">
          <button type="button" id="toggleConfirmPassword" style="background:none;border:none;cursor:pointer;">
            <span id="eyeIconConfirm"></span>
          </button>
        </div>
      </label><br/>

      <div style="display:flex; align-items:center; gap:6px; margin-bottom:12px;">
        <input type="checkbox" id="terms" required style="margin:0;">
        <span>
          I accept the
          <a href="#terms" id="termsLink">terms and conditions</a>
        </span>
      </div>

      <button type="submit">Sign Up</button>
    </form>
  `;

  // SVG Icons for eye (open/closed)
  const eyeOpenSVG = `<svg width="24" height="24" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2.5" fill="#333"/></svg>`;
  const eyeClosedSVG = `<svg width="24" height="24" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="8" ry="5" stroke="#333" stroke-width="2" fill="none"/><line x1="5" y1="19" x2="19" y2="5" stroke="#333" stroke-width="2"/></svg>`;

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

  // SPA style: redirect/hash change for terms
  const termsLink = container.querySelector('#termsLink');
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#terms';
  });
}
