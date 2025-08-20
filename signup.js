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
        <input type="password" id="password" required autocomplete="off" placeholder="Password">
      </label><br/>

      <label>
        Confirm Password:<br/>
        <input type="password" id="confirmPassword" required autocomplete="off" placeholder="Confirm password">
      </label><br/>

      <label>
        <input type="checkbox" id="terms" required>
        I accept the <a href="#" target="_blank">terms and conditions</a>
      </label><br/><br/>

      <button type="submit">Sign Up</button>
    </form>
  `;
}
