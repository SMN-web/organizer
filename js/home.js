export function renderHome(container) {
  container.innerHTML = `
    <h1>Minimal SPA Module Test</h1>
    <p>Your device and browser fully support JavaScript ES modules!</p>
    <p>Try changing the URL hash to #home</p>
  `;
  console.log('Home view rendered');
}
