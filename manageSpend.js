import { showNewSpend } from './newSpend.js';
import { showHistorySpend } from './historySpend.js';
import { showCalculatorModal } from './calculatorModal.js';

// main signature must now take auth!
export function showManageSpend(contentContainer, auth) {
  contentContainer.innerHTML = `
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
      <button class="fab-calculator" title="Calculator">+</button>
    </div>
  `;
  contentContainer.querySelector('.spend-header').style.marginTop = '36px';

  const sectionContent = contentContainer.querySelector('.section-content');

  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'new') showNewSpend(sectionContent, auth); // Pass auth
    else if (section === 'history') showHistorySpend(sectionContent, auth); // (pass auth if needed!)
  }
  renderSection('new');

  const tabs = contentContainer.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });
  contentContainer.querySelector('.fab-calculator').onclick = () => {
    showCalculatorModal(contentContainer, auth); // (pass auth if needed)
  };
}
