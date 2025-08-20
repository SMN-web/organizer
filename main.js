import { initSignup } from './signup.js';
import { initTerms } from './terms.js';

const appDiv = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#signup';
  if (hash === '#signup') {
    initSignup(appDiv);
  } else if (hash === '#terms') {
    initTerms(appDiv); // <<-- This calls the function!
  } else {
    appDiv.innerHTML = "<h2>Page not found</h2>";
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
