import { initSignup } from './signup.js';
// You will add login import later for example:
// import { initLogin } from './login.js';

const appDiv = document.getElementById('app');
const auth = window.firebaseAuth;

function router() {
  const hash = window.location.hash || '#signup';
  console.log("Router hash:", hash);

  if (hash === '#signup') {
    initSignup(appDiv, auth);
  } 
  // Add this when login.js ready:
  // else if (hash === '#login') {
  //   initLogin(appDiv, auth);
  // } 
  else {
    appDiv.innerHTML = '<h2>Page not found</h2>';
  } 
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
