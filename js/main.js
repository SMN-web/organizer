import { initSignup } from './signup.js';

const appDiv = document.getElementById('app');
const auth = window.firebaseAuth;

function router() {
  const hash = window.location.hash || '#signup';

  if (hash === '#signup') {
    initSignup(appDiv, auth);
  } else {
    appDiv.innerHTML = `<h2>Page not found</h2>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
 