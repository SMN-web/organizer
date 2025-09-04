import { showPaymentsPanel } from './payments.js';
import { showTransfersPanel } from './transfers.js';
import { showHistoryPanel } from './history.js';

export function showPaymentsPanelMain(container, user) {
  container.innerHTML = `
    <div class="manage-spend-wrapper">
      <header class="spend-header payments-header">
        <h2 class="centered-title">Payments Center</h2>
        <p class="payments-desc spend-desc">Settle, transfer, and audit all group payments in one place.</p>
      </header>
      <nav class="section-switch">
        <button id="tabPayments" class="tab-btn active">Payments</button>
        <button id="tabTransfers" class="tab-btn">Transfers</button>
        <button id="tabHistory" class="tab-btn">History</button>
      </nav>
      <div id="paymentsPanelSection" class="section-content payments-section-content"></div>
    </div>
  `;

  container.querySelector('.spend-header').style.marginTop = '36px';
  const section = container.querySelector("#paymentsPanelSection");
  if (!section) {
    container.innerHTML += '<div style="color:red">paymentsPanelSection not found</div>';
    return;
  }

  function activateTab(idx) {
    ["tabPayments", "tabTransfers", "tabHistory"].forEach((id, i) => {
      const btn = container.querySelector("#" + id);
      if (btn) {
        btn.classList.toggle('active', i === idx);
      }
    });
  }
  container.querySelector("#tabPayments").onclick = () => {
    activateTab(0);
    showPaymentsPanel(section, user);
  };
  container.querySelector("#tabTransfers").onclick = () => {
    activateTab(1);
    showTransfersPanel(section, user);
  };
  container.querySelector("#tabHistory").onclick = () => {
    activateTab(2);
    showHistoryPanel(section, user);
  };
  activateTab(0);
  showPaymentsPanel(section, user);
}
