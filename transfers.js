import { showOngoingTransfersPanel } from './ongoingTransfers.js';
import { showCompletedTransfersPanel } from './completedTransfers.js';
import { showCreateTransfer } from './createTransfer.js'; // Import FAB/modal logic

export function showTransfersPanel(container, user) {
  container.innerHTML = `
    <div>
      <nav class="approval-subtabs">
        <button data-tab="ongoing" class="approval-subtab subtab-btn active">Ongoing</button>
        <button data-tab="completed" class="approval-subtab subtab-btn">Completed</button>
      </nav>
      <div class="transfer-sub-content"></div>
    </div>
  `;

  const subContent = container.querySelector('.transfer-sub-content');

  function renderSubSection(tab) {
    if (tab === 'ongoing') {
      showOngoingTransfersPanel(subContent, user);
    } else if (tab === 'completed') {
      showCompletedTransfersPanel(subContent, user);
    }
  }

  renderSubSection('ongoing');
  const subTabs = container.querySelectorAll('.approval-subtab');
  subTabs.forEach(tab => {
    tab.onclick = () => {
      subTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSubSection(tab.dataset.tab);
    };
  });

  // ==== FAB for Create Transfer ====
  // Create only if not already present (prevents duplicates)
  let fab = document.getElementById('fabCreateTransfer');
  if (!fab) {
    fab = document.createElement('button');
    fab.id = 'fabCreateTransfer';
    fab.className = 'fab-create-transfer';
    fab.title = 'Create Transfer';
    fab.innerText = '+';
    document.body.appendChild(fab);
  }
  // FAB click opens the Create Transfer modal
  fab.onclick = () => { showCreateTransfer(user); };
}
