import { showSignup } from './signup.js';
import { showTerms } from './terms.js';
import { showResendVerification } from './resendVerification.js'; // <-- import your new module

const appDiv = document.getElementById('app');

function router() {
  try {
    const hash = window.location.hash || '#signup';
    if (hash === '#signup') {
      showSignup(appDiv);
    } else if (hash === '#terms') {
      showTerms(appDiv);
    } else if (hash === '#resend') {
      showResendVerification(appDiv);
    } else {
      window.location.hash = '#signup';
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err.message}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router();
