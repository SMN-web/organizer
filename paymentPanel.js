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
      <div class="section-content"></div>
    </div>
  `;
  contentContainer.querySelector('.spend-header').style.marginTop = '36px';
  const sectionContent = contentContainer.querySelector('.section-content');

  async function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'payments') {
      sectionContent.innerHTML = '<div style="color:#888;">Loading payments module…</div>';
      // Use dynamic import!
      try {
        const mod = await import('./payments.js');
        if (mod && typeof mod.showPaymentsPanel === 'function') {
          mod.showPaymentsPanel(sectionContent, user);
        } else {
          sectionContent.innerHTML = '<div style="color:red;">Payments panel failed to load</div>';
        }
      } catch (e) {
        sectionContent.innerHTML = `<div style="color:red;">Import error: ${e.message}</div>`;
      }
    }
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
