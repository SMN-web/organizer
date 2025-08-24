// spinner.js
export function showSpinner(container) {
  let el = container.querySelector('.loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.className = 'loadingOverlay';
    el.style = `
      position:fixed;top:0;left:0;width:100vw;height:100vh;
      background:rgba(255,255,255,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;
      transition:opacity 0.2s;
    `;
    el.innerHTML = `<div class="spinner" style="width:44px;height:44px;border:5px solid #eee;border-top:5px solid #3498db;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    <style>@keyframes spin{ 0%{ transform:rotate(0deg);} 100%{transform:rotate(360deg);}}</style>`;
    container.appendChild(el);
  }
  el.style.display = 'flex';
}
export function hideSpinner(container) {
  let el = container.querySelector('.loadingOverlay');
  if (el) el.style.display = 'none';
}
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
export { delay };
