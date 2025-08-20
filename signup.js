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
          <button type="button" id="togglePassword" style="padding: 0 12px;">Show</button>
        </div>
      </label><br/>

      <label>
        Confirm Password:<br/>
        <div style="display:flex; gap:8px;">
          <input type="password" id="confirmPassword" required autocomplete="off" placeholder="Confirm password" style="flex:1;">
          <button type="button" id="toggleConfirmPassword" style="padding: 0 12px;">Show</button>
        </div>
      </label><br/>

      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <input type="checkbox" id="terms" required style="margin:0;">
        <span>
          I accept the 
          <a href="#terms" id="termsLink">terms and conditions</a>
        </span>
      </div>

      <button type="submit">Sign Up</button>
    </form>
  `;

  // Password toggle logic
  const passwordInput = container.querySelector('#password');
  const togglePasswordBtn = container.querySelector('#togglePassword');
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
  });

  const confirmPasswordInput = container.querySelector('#confirmPassword');
  const toggleConfirmPasswordBtn = container.querySelector('#toggleConfirmPassword');
  toggleConfirmPasswordBtn.addEventListener('click', () => {
    const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    confirmPasswordInput.type = type;
    toggleConfirmPasswordBtn.textContent = type === 'password' ? 'Show' : 'Hide';
  });

  // Redirect terms link (pure SPA): changes hash to #terms for SPA router
  const termsLink = container.querySelector('#termsLink');
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#terms';
  });
}
