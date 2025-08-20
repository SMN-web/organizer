const appDiv = document.getElementById('app');
appDiv.innerHTML = '<h2>Main.js loaded!</h2>';
import { initSignup } from './signup.js';
initSignup(appDiv, window.firebaseAuth);
