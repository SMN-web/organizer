import { showLegacyPayments } from './payments.js';
import { showTransfersPanel } from './transfers.js';
import { showHistoryPanel } from './history.js';

export function showPaymentsPanel(container, user) {
  container.innerHTML = `
    <div style="padding:2em 1em;max-width:540px;margin:auto;">
      <h2 style="margin-bottom:1.2em;">Payments Center</h2>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:1.2em;">
        <button class="ptab" id="tabPayments" style="background:#3498db;color:#fff;border:none;border-radius:6px;padding:0.7em 1.6em;cursor:pointer;font-size:1em;">Payments</button>
        <button class="ptab" id="tabTransfers" style="background:#eee;color:#333;border:none;border-radius:6px;padding:0.7em 1.6em;cursor:pointer;font-size:1em;">Transfers</button>
        <button class="ptab" id="tabHistory" style="background:#eee;color:#333;border:none;border-radius:6px;padding:0.7em 1.6em;cursor:pointer;font-size:1em;">History</button>
      </div>
      <div id="paymentsPanelSection"></div>
    </div>
  `;
  const section = container.querySelector("#paymentsPanelSection");
  function activateTab(idx) {
    ["tabPayments", "tabTransfers", "tabHistory"].forEach((id, i) => {
      const btn = container.querySelector("#" + id);
      btn.style.background = i === idx ? "#3498db" : "#eee";
      btn.style.color = i === idx ? "#fff" : "#333";
    });
  }
  container.querySelector("#tabPayments").onclick = () => {
    activateTab(0);
    showLegacyPayments(section, user);
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
  showLegacyPayments(section, user);
}
