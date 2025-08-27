import { showNewSpend } from './newSpend.js';
import { showHistorySpend } from './historySpend.js';
import { showCalculatorModal } from './calculatorModal.js';

export function showManageSpend() {
  // Create modal overlay
  let overlay = document.createElement('div');
  overlay.className = 'manage-spend-modal-overlay';
  overlay.innerHTML = `
    <div class="manage-spend-modal-inner">
      <div class="manage-spend-wrapper">
        <header class="spend-header">
          <h2 class="centered-title">Manage Group Spend</h2>
          <p class="spend-desc">Track, split, and adjust group spending for outings with friends.</p>
        </header>
        <nav class="section-switch">
          <button data-section="new" class="tab-btn active">New Spend</button>
          <button data-section="history" class="tab-btn">History</button>
        </nav>
        <div class="section-content"></div>
        <button class="fab-calculator" title="Quick Calculator">+</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Section logic
  const sectionContent = overlay.querySelector('.section-content');
  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'new') showNewSpend(sectionContent);
    else if (section === 'history') showHistorySpend(sectionContent);
  }
  renderSection('new');
  const tabs = overlay.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });
  overlay.querySelector('.fab-calculator').onclick = () => {
    showCalculatorModal(overlay);
  };

  // Optional: click outside content closes modal
  overlay.onclick = e => {
    if (e.target === overlay) overlay.remove();
  };
}
