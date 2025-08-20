export function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <input type="email" id="email" required placeholder="Email">
      <input type="password" id="password" required placeholder="Password">
      <div style="margin-bottom:16px;">
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
    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value.trim();
    const terms = container.querySelector('#terms').checked;
    const formError = container.querySelector('#formError');
    formError.textContent = "";
    if (!email || !password || !terms) {
      formError.textContent = "All fields must be filled and terms accepted!";
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
