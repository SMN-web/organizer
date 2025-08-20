import { initSignup } from './signup.js';

const appDiv = document.getElementById('app');

// Always show signup form only; ignore the hash
function router() {
  initSignup(appDiv);
}

// Replace previous event handlers so SPA always loads signup view
window.addEventListener('hashchange', router);
window.addEventListener('load', router);
