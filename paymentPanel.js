export function showPaymentsPanelMain(container, user) {
  container.innerHTML = `
    <div style="padding:2em 1em;max-width:540px;margin:auto;">
      <h2 style="margin-bottom:1.2em;">Payments Center</h2>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:1.2em;">
        <button class="ptab" id="tabPayments">Payments</button>
        <button class="ptab" id="tabTransfers">Transfers</button>
        <button class="ptab" id="tabHistory">History</button>
      </div>
      <div id="paymentsPanelSection"></div>
    </div>
  `;
  // Diagnostic: see if this is rendered fully now!
  container.innerHTML += '<div style="color:green">Tab markup rendered</div>';
}
