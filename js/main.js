import { renderHome } from './home.js';

const appDiv = document.getElementById('app');

// Simple router based on hash
function router() {
  const hash = window.location.hash || '#home';
  if (hash === '#home') {
    renderHome(appDiv);
  } else {
    appDiv.textContent = 'Page not found';
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', router);

// Logging to confirm loading
console.log('main.js loaded');
