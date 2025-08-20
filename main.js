import { initSignup } from './signup.js';
import { initTerms } from './terms.js';

const appDiv = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#signup';
  if (hash === '#signup') {
    initSignup(appDiv);
  } else if (hash === '#terms') {
    initTerms
