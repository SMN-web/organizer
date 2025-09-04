import { showTransfersPanel } from './transfers.js';
import { showHistoryPanel } from './history.js';

export function showPaymentsPanelMain(contentContainer, user) {
  contentContainer.innerHTML = `
    <div class="manage-spend-wrapper">
      <header class="spend-header">
        <h2 class="centered-title">Payments Center</h2>
        <p class="spend-desc">Settle, transfer, and audit all group payments in one place.</p>
      </header>
      <nav class="section-switch">
        <button data-section="payments" class="tab-btn active">Payments</button>
        <button data-section="transfers" class="tab-btn">Transfers</button>
        <button data-section="history" class="tab-btn">History</button>
      </nav>
      <div class="section-content" style="padding:1.6em;font-size:1.22em;color:#325;text-align:center;"></div>
    </div>
  `;
  contentContainer.querySelector('.spend-header').style.marginTop = '36px';
  const sectionContent = contentContainer.querySelector('.section-content');

  function renderSection(section) {
    if (section === 'payments') {
      sectionContent.innerHTML = 'Payments tab active (basic test)';
    } else if (section === 'transfers') {
      showTransfersPanel(sectionContent, user);
    } else if (section === 'history') {
      showHistoryPanel(sectionContent, user);
    }
  }

  renderSection('payments');
  const tabs = contentContainer.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });
}
