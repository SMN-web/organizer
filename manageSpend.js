import { showNewSpend } from './newSpend.js';
import { showHistorySpend } from './historySpend.js';
import { showCalculatorModal } from './calculatorModal.js';
import { showExpenseApproval } from './expenseApproval.js';
import { showCreatedByMePanel } from './createdByMe.js';

export function showManageSpend(contentContainer, user) {
  contentContainer.innerHTML = `
    <div class="manage-spend-wrapper">
      <header class="spend-header">
        <h2 class="centered-title">Manage Group Spend</h2>
        <p class="spend-desc">Track, split, and adjust group spending for outings with friends.</p>
      </header>
      <nav class="section-switch">
        <button data-section="new" class="tab-btn active">New Spend</button>
        <button data-section="approval" class="tab-btn">
          Expense Approvals <span class="approval-unread-count" style="display:none;background:#e53935;color:#fff;padding:2px 7px;border-radius:11px;font-size:.95em;margin-left:6px"></span>
        </button>
        <button data-section="history" class="tab-btn">History</button>
      </nav>
      <div class="section-content"></div>
      <button class="fab-calculator" title="Calculator">+</button>
    </div>
  `;
  contentContainer.querySelector('.spend-header').style.marginTop = '36px';
  const sectionContent = contentContainer.querySelector('.section-content');

  function updateApprovalUnread(count) {
    const badge = contentContainer.querySelector('.approval-unread-count');
    if (count > 0) {
      badge.style.display = '';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
      badge.textContent = '';
    }
  }

  function renderApprovalSubSections() {
    sectionContent.innerHTML = `
      <nav class="approval-subtabs" style="display:flex;gap:12px;margin-bottom:13px;">
        <button data-tab="for-approval" class="approval-subtab subtab-btn active">Expenses To Approve</button>
        <button data-tab="created-by-me" class="approval-subtab subtab-btn">Created By Me</button>
      </nav>
      <div class="approval-sub-content"></div>
    `;
    const subContent = sectionContent.querySelector('.approval-sub-content');

    function renderSubSection(tab) {
      subContent.innerHTML = '';
      if (tab === 'for-approval') {
        showExpenseApproval(subContent, user, updateApprovalUnread);
      } else if (tab === 'created-by-me') {
        showCreatedByMePanel(subContent, user);
      }
    }
    renderSubSection('for-approval');

    const subTabs = sectionContent.querySelectorAll('.approval-subtab');
    subTabs.forEach(tab => {
      tab.onclick = () => {
        subTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderSubSection(tab.dataset.tab);
      };
    });
  }

  function renderSection(section) {
    sectionContent.innerHTML = '';
    if (section === 'new') showNewSpend(sectionContent, user);
    else if (section === 'approval') renderApprovalSubSections();
    else if (section === 'history') showHistorySpend(sectionContent, user);
  }
  renderSection('new');

  const tabs = contentContainer.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderSection(tab.dataset.section);
    };
  });
  contentContainer.querySelector('.fab-calculator').onclick = () => {
    showCalculatorModal(contentContainer, user);
  };
}
