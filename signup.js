export function initSignup(container, auth) {
  container.innerHTML += `
    <h2>Sign Up</h2>
    <form id="signupForm" novalidate>
      <input type="email" id="email" placeholder="Email" required />
      <input type="password" id="password" placeholder="Password" required />
      <button type="submit">Sign Up</button>
      <span id="formError"></span>
    </form>
  `;
}
