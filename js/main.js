import { initSignup } from './signup.js';

const appDiv = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#signup';
  console.log("Routing to:", hash);

  if (hash === '#signup') {
    initSignup(appDiv);
  } else {
    appDiv.innerHTML = '<h2>Page not found</h2>';
  }
}
