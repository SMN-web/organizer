export function initLogin(container, auth) {
  container.innerHTML = `
    <h2>Sign In</h2>
    <form id="loginForm" novalidate>
      <label>Email:<br />
        <input type="email" id="email" required autocomplete="off"/>
      </label><br/>
      <label>Password:<br />
        <input type="password" id="password" required/>
      </label><br/>
      <button type="submit">Login</button>
      <div id="formError" style="color:red; margin-top:10px;"></div>
    </form>
  `;

  const form = container.querySelector('#loginForm');
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const formError = container.querySelector('#formError');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    formError.textContent = '';

    try {
      const userCredential = await auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
      const idToken = await userCredential.user.getIdToken();

      const res = await fetch('https://shrill-shadow-2cd8.nafil-8895-s.workers.dev/api/user-info', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + idToken },
      });

      const data = await res.json();

      if (!res.ok) {
        formError.textContent = data.error || 'Login failed';
        await auth.signOut();
        return;
      }

      alert(`Welcome ${data.name}, Role: ${data.role}`);
      // TODO: load dashboard or app main UI

    } catch (err) {
      formError.textContent = err.message || 'Login error';
    }
  });
}
