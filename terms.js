export function showTerms(container) {
  container.innerHTML = `
    <h2>Terms and Conditions</h2>
    <p>This is a sample Terms and Conditions screen.</p>
    <button id="backSignup">Back to Sign Up</button>
  `;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}
