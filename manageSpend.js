export function showManageSpend(contentContainer) {
  contentContainer.innerHTML = `
    <div class="manage-spend-wrapper animate-in">
      <header class="spend-header">
        <h2>Manage Group Spend</h2>
        <p class="spend-desc">Track, split, and adjust group spending for outings with friends.</p>
        <div class="spend-message custom-message"></div>
      </header>

      <nav class="section-switch animate-tabs">
        <button data-target="#spendEntry" class="tab-btn active">New Spend</button>
        <button data-target="#spendHistory" class="tab-btn">History</button>
        <button data-target="#calculatorPane" class="tab-btn">Calculator</button>
      </nav>

      <section id="spendEntry" class="spend-section visible">
        <form class="entry-form">
          <label>
            Amount Paid (QAR):<br>
            <input type="number" step="0.01" class="amount-input" required>
          </label><br>
          <label>
            Paid By:<br>
            <select class="paid-by-select"></select>
          </label><br>
          <label>
            Friends Sharing:
            <div class="friend-chips"></div>
          </label>
          <div class="split-ui"></div>
          <div class="split-animated-prompt"></div>
          <button type="submit" class="primary-btn">Distribute & Save</button>
        </form>
      </section>

      <section id="spendHistory" class="spend-section hidden">
        <div class="history-list"></div>
      </section>

      <section id="calculatorPane" class="spend-section hidden">
        <div class="calculator-ui"></div>
      </section>

      <button class="fab-calculator" title="Quick Calculator">+</button>
    </div>
  `;

  // --- Section switching with animation ---
  const tabs = contentContainer.querySelectorAll('.tab-btn');
  const sections = contentContainer.querySelectorAll('.spend-section');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      sections.forEach(sec => sec.classList.add('hidden'));
      const target = contentContainer.querySelector(tab.dataset.target);
      if (target) {
        target.classList.remove('hidden');
        target.classList.add('visible', 'fade-in');
        setTimeout(() => target.classList.remove('fade-in'), 400);
      }
    };
  });

  // --- Show custom messages, animated prompts ---
  const customMsg = contentContainer.querySelector('.custom-message');
  function showCustomMessage(msg, type = "info") {
    customMsg.innerHTML = `<span class="msg-${type}">${msg}</span>`;
    customMsg.classList.add('msg-animate');
    setTimeout(() => customMsg.classList.remove('msg-animate'), 1200);
  }
  // Example: showCustomMessage('Welcome to spend manager!', 'success');
  // You can call showCustomMessage() anywhere for notifications.

  // --- Floating calculator FAB animation ---
  const fab = contentContainer.querySelector('.fab-calculator');
  const calcPane = contentContainer.querySelector('#calculatorPane');
  fab.onclick = () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabs[2].classList.add('active');
    sections.forEach(sec => sec.classList.add('hidden'));
    calcPane.classList.remove('hidden');
    calcPane.classList.add('visible', 'fade-in');
    setTimeout(() => calcPane.classList.remove('fade-in'), 400);
  };

  // --- Animate initial load ---
  setTimeout(() => {
    contentContainer.querySelector('.manage-spend-wrapper').classList.remove('animate-in');
  }, 400);

  // --- Extend with filling paid-by/friend-chips/split-ui as needed...
  // Add your select, chips creation, editing, calculator logic here.
}
