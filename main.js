import { initSignup } from './signup.js';

const appDiv = document.getElementById('app');
appDiv.innerHTML = '<h2>Main.js loaded!</h2>';

initSignup(appDiv, window.firebaseAuth);
