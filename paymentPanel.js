import { showPaymentsPanel } from './payments.js'; // Existing legacy or new payments UI
import { showTransfersPanel } from './transfers.js';
import { showHistoryPanel } from './history.js';

export function showPaymentsPanelMain(contentContainer, user) {
  contentContainer.innerHTML = `
    <div class="payments-wrapper">
      <header class="payments-header">
        <h2 class="centered-title">Payments Center</h2>
        <p class="payments-desc">Settle, transfer, and audit payments with friends in one place.</p>
      </header>
      <nav class="section-switch">
        <button data-section="payments" class="tab-btn active">Payments</button>
        <button data-section="transfers" class="tab-btn">Transfers</button>
        <button data-section="history" class="tab-btn">History</button>
      </nav>
      <div class="section-content"></div>
    </div>
  `;
  contentContainer.querySelector('.payments-header').style.marginTop = '36px';
  const sectionContent = contentContainer.querySelector('.section-content');

  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'payments') showPaymentsPanel(sectionContent, user);
    else if (section === 'transfers') showTransfersPanel(sectionContent, user);
    else if (section === 'history') showHistoryPanel(sectionContent, user);
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
