export function initTerms(container) {
  container.innerHTML = `
    <h2>Terms and Conditions</h2>
    <p>This is a sample Terms and Conditions page for your app.</p>
    <p>Please review all terms carefully before accepting registration.</p>
    <a href="#" id="backToSignup">← Back to Sign Up</a>
  `;

  // Back to sign up link
  const backToSignup = container.querySelector('#backToSignup');
  backToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.hash = '#signup';
  });
}
