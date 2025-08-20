import { showSignup } from './signup.js';
import { showTerms } from './terms.js';

const appDiv = document.getElementById('app');

function router() {
  try {
    // Default to #signup if hash missing or unknown
    const hash = window.location.hash || '#signup';
    if (hash === '#signup') {
      showSignup(appDiv);
    } else if (hash === '#terms') {
      showTerms(appDiv);
    } else {
      window.location.hash = '#signup';
    }
  } catch (err) {
    appDiv.innerHTML = `<pre style="color:red">Router error: ${err.message}</pre>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
router(); // initial render
