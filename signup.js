export function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <input type="text" id="username" required placeholder="Username" autocomplete="off">
      <input type="text" id="name" required placeholder="Full name" autocomplete="off">
      <input type="email" id="email" required placeholder="Email" autocomplete="off">
      <input type="password" id="password" required placeholder="Password" autocomplete="off">
      <input type="password" id="confirmPassword" required placeholder="Confirm password" autocomplete="off">
      <div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="terms" required>
        <label for="terms">I accept the <a href="#terms" id="termsLink">terms and conditions</a></label>
      </div>
      <button type="submit">Sign Up</button>
      <div id="formError" style="color:#e74c3c;margin-top:10px"></div>
    </form>
  `;

  // Navigate to terms panel
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
    } catch (err) {
      formError.style.color = "#e74c3c";
      formError.textContent = err.message;
    }
  });
}
