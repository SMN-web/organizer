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
  const section = container.querySelector("#paymentsPanelSection");
  document.getElementById("tabPayments").onclick = () => {
    try {
      section.innerHTML = 'Attempting to run payments.js…';
      // Dynamically import for extra safety:
      import('./payments.js').then(mod => {
        if (typeof mod.showPaymentsPanel === "function") {
          mod.showPaymentsPanel(section, user);
        } else {
          section.innerHTML = '<div style="color:red">showPaymentsPanel not found in payments.js</div>';
        }
      }).catch(e => {
        section.innerHTML = '<div style="color:red">Import error: ' + e + '</div>';
      });
    } catch(e) {
      section.innerHTML = 'Error: ' + e.message;
    }
  };
  // optional: default tab content
  section.innerHTML = '<div style="color:blue;">Payments tab is ready. Click to load panel.</div>';
}
