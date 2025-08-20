import { initSignup } from './signup.js';
// For now, comment out login-related imports as this is a stepwise test

const appDiv = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#signup';
  appDiv.innerHTML = `<h2>Router active: ${hash}</h2>`; // Visual router feedback

  if (hash === '#signup') {
    initSignup(appDiv, window.firebaseAuth);
  }
  // Uncomment when login is implemented
  // else if (hash === '#login') {
  //   initLogin(appDiv, window.firebaseAuth);
  // }
  else {
    appDiv.innerHTML += '<h3>Page not found</h3>';
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
