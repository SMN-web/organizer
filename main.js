const appDiv = document.getElementById('app');

// Sign Up view with Firebase Auth logic
function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <input type="email" id="email" required placeholder="Email" style="width:100%;margin-bottom:12px;">
      <input type="password" id="password" required placeholder="Password" style="width:100%;margin-bottom:12px;">
      <div style="margin-bottom:16px;">
        <input type="checkbox" id="terms" required>
        <label for="terms">I accept the <a href="#terms" id="termsLink">terms and conditions</a></label>
      </div>
      <button type="submit">Sign Up</button>
      <div id="formError" style="color:#e74c3c;margin-top:10px"></div>
    </form>
  `;

  // Terms navigation SPA
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
      await auth.createUserWithEmailAndPassword(email, password);
      formError.style.color = "#27ae60";
      formError.textContent = "Signup successful!";
      signupForm.reset();
    } catch (err) {
      formError.style.color = "#e74c3c";
      formError.textContent = err.message;
    }
  });
}

// Terms view
function showTerms(container) {
  container.innerHTML = `
    <h2>Terms and Conditions</h2>
    <p>This is a sample Terms and Conditions screen.</p>
    <button id="backSignup">Back to Sign Up</button>
  `;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}

// SPA router
function router() {
  try {
    const hash = window.location.hash || '#signup';
    if (hash === '#signup') {
      showSignup(appDiv);
    } else if (hash === '#terms') {
      showTerms(appDiv);
    } else {
      appDiv.innerHTML = "<h2>Page not found</h2>";
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err.message}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router(); // initial render
