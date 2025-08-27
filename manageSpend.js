import { showNewSpend } from './newSpend.js';
import { showHistorySpend } from './historySpend.js';
import { showCalculatorModal } from './calculatorModal.js'; // calculator float button overlay

export function showManageSpend(contentContainer) {
  contentContainer.innerHTML = `
    <div class="manage-spend-wrapper animate-in">
      <header class="spend-header">
        <h2 class="centered-title" style="padding-top:2.3em;">Manage Group Spend</h2>
        <p class="spend-desc">Track, split, and adjust group spending for outings with friends.</p>
        <div class="spend-message custom-message"></div>
        <span class="bell-icon">
          <span class="bell-inner">&#128276;</span>
          <span class="notif-badge">1</span>
        </span>
      </header>
      <nav class="section-switch animate-tabs">
        <button data-section="new" class="tab-btn active">New Spend</button>
        <button data-section="history" class="tab-btn">History</button>
      </nav>
      <div class="section-content"></div>
      <button class="fab-calculator" title="Quick Calculator">+</button>
    </div>
  `;

  // Reference main content area for injection
  const sectionContent = contentContainer.querySelector('.section-content');

  // Section switch logic
  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'new') {
      showNewSpend(sectionContent);
    } else if (section === 'history') {
      showHistorySpend(sectionContent);
    }
  }

  // Initial render ("New Spend")
  renderSection('new');

  // Tabs/events
  const tabs = contentContainer.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });

  // Floating calculator button
  const fab = contentContainer.querySelector('.fab-calculator');
  fab.onclick = () => {
    showCalculatorModal(contentContainer);
  };

  // Animate initial load
  setTimeout(() => {
    contentContainer.querySelector('.manage-spend-wrapper').classList.remove('animate-in');
  }, 400);
}
