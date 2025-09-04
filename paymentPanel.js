// NOTE: Remove payments.js import for isolated testing
// import { showPaymentsPanel } from './payments.js';
import { showTransfersPanel } from './transfers.js';
import { showHistoryPanel } from './history.js';

export function showPaymentsPanelMain(contentContainer, user) {
  contentContainer.innerHTML = `
    <div class="payments-wrapper">
      <header style="margin-top:36px;text-align:center;">
        <h2 class="centered-title">Payments Center</h2>
        <p style="color:#555;margin-bottom:18px;font-size:1.06em;">
          All your settle-up, transfer and audit tools in one place.
        </p>
      </header>
      <nav class="payments-tabs" style="display:flex;justify-content:center;gap:9px;margin-bottom:20px;">
        <button data-section="payments" class="payments-tab tab-btn active">Payments</button>
        <button data-section="transfers" class="payments-tab tab-btn">Transfers</button>
        <button data-section="history" class="payments-tab tab-btn">History</button>
      </nav>
      <div class="payments-main-section"></div>
    </div>
  `;

  const sectionContent = contentContainer.querySelector('.payments-main-section');
  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'payments') {
      sectionContent.innerHTML = '<div style="padding:2em;text-align:center;color:#888;">Payments section works (no import yet)</div>';
      // Uncomment the next line only if you CONFIRM showPaymentsPanel is currectly imported!
      // showPaymentsPanel(sectionContent, user);
    }
    else if (section === 'transfers') {
      showTransfersPanel(sectionContent, user);
    }
    else if (section === 'history') {
      showHistoryPanel(sectionContent, user);
    }
  }
  renderSection('payments'); // Default tab

  const tabs = contentContainer.querySelectorAll('.payments-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });
}
