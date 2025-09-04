import { showOngoingTransfersPanel } from './ongoingTransfers.js';
import { showCompletedTransfersPanel } from './completedTransfers.js';

export function showTransfersPanel(container, user) {
  container.innerHTML = `
    <div class="transfers-section">
      <div class="section-top-spacer"></div>
      <nav class="transfers-subtabs">
        <button data-tab="ongoing" class="transfers-subtab active">Ongoing</button>
        <button data-tab="completed" class="transfers-subtab">Completed</button>
      </nav>
      <div class="transfers-sub-content"></div>
    </div>
  `;
  const subContent = container.querySelector('.transfers-sub-content');

  function renderSubsection(tab) {
    subContent.innerHTML = "";
    if (tab === 'ongoing') {
      showOngoingTransfersPanel(subContent, user);
    } else if (tab === 'completed') {
      showCompletedTransfersPanel(subContent, user);
    }
  }

  renderSubsection('ongoing');

  const subTabs = container.querySelectorAll('.transfers-subtab');
  subTabs.forEach(tab => {
    tab.onclick = () => {
      subTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSubsection(tab.dataset.tab);
    };
  });
}
