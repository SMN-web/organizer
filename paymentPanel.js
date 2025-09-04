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
  renderSection('payments'); // default

  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'payments') {
      sectionContent.innerHTML = '<div style="color:#888; text-align:center;">Loading payments module…</div>';
      // Dynamic import for direct mobile feedback
      import('./payments.js')
        .then(mod => {
          sectionContent.innerHTML += '<div style="color:green; margin-top:8px;">payments.js loaded.</div>';
          if (!mod || typeof mod.showPaymentsPanel !== 'function') {
            sectionContent.innerHTML += '<div style="color:red;">showPaymentsPanel not found in payments.js</div>';
          } else {
            try {
              mod.showPaymentsPanel(sectionContent, user);
            } catch(e) {
              sectionContent.innerHTML = '<div style="color:red;">Error running showPaymentsPanel: ' + e + '</div>';
            }
          }
        })
        .catch(e => {
          sectionContent.innerHTML = '<div style="color:red;">Failed to load payments.js: ' + e + '</div>';
        });
    }
    else if (section === 'transfers') {
      sectionContent.innerHTML = '<div style="color:#888; text-align:center;">Loading transfers…</div>';
      try { showTransfersPanel(sectionContent, user); } catch(e) {
        sectionContent.innerHTML += '<div style="color:red;">Transfers error: ' + e + '</div>';
      }
    }
    else if (section === 'history') {
      sectionContent.innerHTML = '<div style="color:#888; text-align:center;">Loading history…</div>';
      try { showHistoryPanel(sectionContent, user); } catch(e) {
        sectionContent.innerHTML += '<div style="color:red;">History error: ' + e + '</div>';
      }
    }
  }

  const tabs = contentContainer.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });
}
