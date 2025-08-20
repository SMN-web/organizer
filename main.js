// main.js

const appDiv = document.getElementById('app');

// "Sign Up" view
function showSignup(container) {
  container.innerHTML = `
    <h2>Sign Up Page Works!</h2>
    <button id="gotoTerms">Go to Terms</button>
  `;
  document.getElementById('gotoTerms').onclick = () => {
    window.location.hash = '#terms';
  };
}

// "Terms" view
function showTerms(container) {
  container.innerHTML = `
    <h2>Terms Page Works!</h2>
    <button id="backSignup">Back to Sign Up</button>
  `;
  document.getElementById('backSignup').onclick = () => {
    window.location.hash = '#signup';
  };
}

// SPA Router function with error display
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

// Listen for routing events
window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Optional: force initial view on load (helpful for testing, can be removed)
router();
