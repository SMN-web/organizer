import { showPaymentsPanel } from './payments.js';      // <-- Your production payments UI
import { showTransfersPanel } from './transfers.js';
import { showHistoryPanel } from './history.js';

// Exported as showPaymentsPanelMain to match your expected import usage
export function showPaymentsPanelMain(container, user) {
  container.innerHTML = `
    <nav class="section-switch">
      <button data-tab="payments" class="tab-btn active">Payments</button>
      <button data-tab="transfers" class="tab-btn">Transfers</button>
      <button data-tab="history" class="tab-btn">History</button>
    </nav>
    <div class="panel-content"></div>
  `;
  const panelContent = container.querySelector('.panel-content');

  function renderPanel(tab) {
    panelContent.innerHTML = "";
    if (tab === "payments") {
      showPaymentsPanel(panelContent, user);
    } else if (tab === "transfers") {
      showTransfersPanel(panelContent, user);
    } else if (tab === "history") {
      showHistoryPanel(panelContent, user);
    }
  }

  renderPanel("payments");

  const tabBtns = container.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderPanel(btn.dataset.tab);
    };
  });
}
