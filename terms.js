export function showTerms(container) {
  container.innerHTML = `
    <h2>Terms and Conditions</h2>
    <p>All activities are solely depends on the my own interest. Terms and conditions will change without prior notice.</p>
    <button id="backSignup">Back to Sign Up</button>
  `;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}
