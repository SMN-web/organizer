import { showPaymentsPanel } from './payments.js';

export function showPaymentsPanelMain(container, user) {
  container.innerHTML = `
    <div>
      <div style="background:green;color:#fff;padding:0.5em;">Panel UP!</div>
      <div id="paymentsPanelSection"></div>
    </div>
  `;
  const section = container.querySelector("#paymentsPanelSection");
  if (section) {
    section.innerHTML = 'Calling payments panel...';
    showPaymentsPanel(section, user);  // This assumes payments.js exports EXACTLY this function!
  } else {
    container.innerHTML += '<div style="color:red">paymentsPanelSection missing</div>';
  }
}
