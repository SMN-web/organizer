const appDiv = document.getElementById('app');

function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up Page</h2>
    <button id="gotoTerms">Go to Terms</button>
  `;
  // Simple navigation
  document.getElementById('gotoTerms').onclick = () => {
    window.location.hash = '#terms';
  };
}

function showTerms(container) {
  container.innerHTML = `
    <h2>Terms Page</h2>
    <button id="backSignup">Back to Sign Up</button>
  `;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}

function router() {
  const hash = window.location.hash || '#signup';
  if (hash === '#signup') {
    showSignup(appDiv);
  } else if (hash === '#terms') {
    showTerms(appDiv);
  } else {
    appDiv.innerHTML = "<h2>Page not found</h2>";
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
