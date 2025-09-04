// In transfers.js
export function showTransfersPanel(container, user) {
  container.innerHTML = `
    <div class="transfers-panel-container">
      <nav class="transfers-subtabs">
        <button data-tab="ongoing" class="transfers-subtab active">Ongoing</button>
        <button data-tab="completed" class="transfers-subtab">Completed</button>
      </nav>
      <div class="transfers-subpanel"></div>
    </div>
  `;
  const subPanel = container.querySelector('.transfers-subpanel');
  function renderSubSection(tab) {
    if (tab === 'ongoing') {
      subPanel.innerHTML = `<b>Ongoing Transfers</b>
      <div>No ongoing transfers at this time.</div>`;
    } else {
      subPanel.innerHTML = `<b>Completed Transfers</b>
      <div>No transfers have been completed yet.</div>`;
    }
  }
  renderSubSection('ongoing');
  const subTabs = container.querySelectorAll('.transfers-subtab');
  subTabs.forEach(tab => {
    tab.onclick = () => {
      subTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSubSection(tab.dataset.tab);
    };
  });
}
