import { showSpinner, hideSpinner, delay } from './spinner.js';

// Format date helper
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = monthNames[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:#ffeb3b;padding:1px 2px;border-radius:2px;">$1</mark>');
}

let approvalsData = []; // Store all approvals for filtering
let currentView = 'list'; // 'list' or 'detail'

export async function showExpenseApproval(container, user) {
  container.innerHTML = '';
  showSpinner(container);

  let errMsg = '';

  try {
    if (!user?.firebaseUser || typeof user.firebaseUser.getIdToken !== 'function') {
      hideSpinner(container);
      container.innerHTML = `<div style="color:#d12020;margin:2em;">You must be logged in to view approvals.</div>`;
      return;
    }
    const token = await user.firebaseUser.getIdToken(true);
    const resp = await fetch('https://ex-ap.nafil-8895-s.workers.dev/api/my-approvals', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const text = await resp.text();
    await delay(650);
    try { approvalsData = JSON.parse(text); } catch (e) { errMsg = "Invalid backend response: " + text; }
    if (!Array.isArray(approvalsData)) {
      if (approvalsData && approvalsData.error) errMsg = "Backend error: " + approvalsData.error;
      else errMsg = "Unexpected backend error: " + text;
    }
  } catch (e) { errMsg = "Network error: " + e.message; }
  hideSpinner(container);

  if (errMsg) {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#d12020;font-size:1.1em;margin:2em 0;text-align:center;">${errMsg}</div>
    `;
    return;
  }

  if (!approvalsData.length) {
    container.innerHTML = `
      <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:10px;">Pending Approvals</div>
      <div style="color:#666;text-align:center;margin:2em 0">No approvals required!</div>`;
    return;
  }

  currentView = 'list';
  renderApprovalsList(container);
}

function renderApprovalsList(container) {
  container.innerHTML = `
    <div style="font-weight:600;font-size:1.13em;line-height:1.6;margin-bottom:10px;">
      Pending Approvals
    </div>
    <div class="approval-folder-list"></div>
  `;
  const listArea = container.querySelector('.approval-folder-list');

  approvalsData.forEach(item => {
    const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
    const total = item.involvedStatus.length;
    let statusHtml = '';
    if (item.status === 'disputed') {
      statusHtml = `<span class="status-pill disputed">Disputed</span>`;
    } else {
      statusHtml = `<span class="status-pill pending">Accepted ${accepted}/${total}</span>`;
    }
    
    const row = document.createElement("div");
    row.className = "approval-folder";
    row.tabIndex = 0;
    row.style = `
      display:flex;align-items:flex-start;gap:13px;
      padding:12px 10px 14px 10px;
      border-bottom:1px solid #eee;font-size:1.05em;
      cursor:pointer;transition:background-color 0.2s;
    `;
    row.innerHTML = `
      <span class="sn" style="min-width:2em;font-weight:600;color:#357;flex-shrink:0;margin-top:7px;">${item.sn}.</span>
      <div class="approval-main" style="flex:1 1 0;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-start;row-gap:2px;">
        <div class="remarks" style="font-weight:600;color:#1b2837;margin-bottom:3px;">${item.remarks}</div>
        <div class="date" style="color:#566b89;font-size:0.97em;">${formatDisplayDate(item.date)}</div>
        <div class="by" style="color:#209;font-size:0.97em;">by ${item.created_by}</div>
      </div>
      ${statusHtml}
    `;

    // Click handler for detail view
    row.onclick = () => {
      currentView = 'detail';
      renderDetailView(container, item);
    };

    row.onmouseover = () => row.style.backgroundColor = '#f8f9fa';
    row.onmouseout = () => row.style.backgroundColor = '';
    
    listArea.appendChild(row);
  });

  addStatusCSS();
}

function renderDetailView(container, selectedItem) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <button id="backBtn" style="
        background:none;border:1px solid #ddd;border-radius:8px;padding:8px 16px;
        cursor:pointer;display:flex;align-items:center;gap:8px;font-size:1em;
        transition:all 0.2s;color:#333;
      ">
        ← Back
      </button>
      <h3 style="margin:0;font-weight:600;font-size:1.2em;color:#1b2837;">Approval Details</h3>
      <div></div>
    </div>
    
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:20px;">
      <input type="text" id="searchInput" placeholder="Search in remarks, names..." style="
        flex:1;padding:10px 15px;border:1px solid #ddd;border-radius:8px;
        font-size:1em;outline:none;transition:border-color 0.2s;
      ">
      <input type="date" id="dateFilter" style="
        padding:10px 15px;border:1px solid #ddd;border-radius:8px;
        font-size:1em;outline:none;min-width:150px;
      ">
    </div>

    <div id="detailContent"></div>
  `;

  const backBtn = container.querySelector('#backBtn');
  const searchInput = container.querySelector('#searchInput');
  const dateFilter = container.querySelector('#dateFilter');
  const detailContent = container.querySelector('#detailContent');

  backBtn.onclick = () => {
    currentView = 'list';
    renderApprovalsList(container);
  };

  backBtn.onmouseover = () => {
    backBtn.style.backgroundColor = '#f5f5f5';
    backBtn.style.borderColor = '#999';
  };
  backBtn.onmouseout = () => {
    backBtn.style.backgroundColor = '';
    backBtn.style.borderColor = '#ddd';
  };

  searchInput.onfocus = () => searchInput.style.borderColor = '#4285f4';
  searchInput.onblur = () => searchInput.style.borderColor = '#ddd';
  
  dateFilter.onfocus = () => dateFilter.style.borderColor = '#4285f4';
  dateFilter.onblur = () => dateFilter.style.borderColor = '#ddd';

  function filterAndRender() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedDate = dateFilter.value;
    
    let filteredData = [...approvalsData];
    
    // Date filter
    if (selectedDate) {
      filteredData = filteredData.filter(item => item.date === selectedDate);
    }
    
    // Search filter
    if (searchTerm) {
      filteredData = filteredData.filter(item => 
        item.remarks.toLowerCase().includes(searchTerm) || 
        item.created_by.toLowerCase().includes(searchTerm)
      );
    }

    renderFilteredResults(detailContent, filteredData, searchTerm);
  }

  // Auto-search as user types
  searchInput.oninput = filterAndRender;
  dateFilter.onchange = filterAndRender;

  // Initial render with all data
  filterAndRender();
  addStatusCSS();
}

function renderFilteredResults(container, data, searchTerm) {
  if (!data.length) {
    container.innerHTML = `<div style="color:#666;text-align:center;margin:3em 0;font-size:1.1em;">No matching results found</div>`;
    return;
  }

  container.innerHTML = data.map(item => {
    const accepted = item.involvedStatus.filter(u => u.status === 'accepted').length;
    const total = item.involvedStatus.length;
    let statusText = item.status === 'disputed' ? 'Disputed' : `Accepted ${accepted}/${total}`;
    let statusClass = item.status === 'disputed' ? 'disputed' : 'pending';

    return `
      <div style="
        border:1px solid #e1e5e9;border-radius:12px;padding:16px;margin-bottom:16px;
        background:#fafbfc;transition:box-shadow 0.2s;
      " onmouseover="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow=''">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
          <div>
            <h4 style="margin:0 0 8px 0;font-size:1.1em;font-weight:600;color:#1b2837;">
              ${highlightText(item.remarks, searchTerm)}
            </h4>
            <div style="color:#566b89;font-size:0.95em;margin-bottom:4px;">
              ${formatDisplayDate(item.date)}
            </div>
            <div style="color:#209;font-size:0.95em;">
              by ${highlightText(item.created_by, searchTerm)}
            </div>
          </div>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </div>
        
        <div style="border-top:1px solid #e8eaed;padding-top:12px;">
          <div style="font-size:0.9em;color:#666;margin-bottom:8px;">Participants:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${item.involvedStatus.map(person => `
              <span style="
                display:inline-flex;align-items:center;gap:6px;padding:4px 10px;
                border-radius:16px;font-size:0.85em;
                ${person.status === 'accepted' ? 'background:#e8f5e8;color:#2d7d2d;' : 
                  person.status === 'disputed' ? 'background:#ffeaea;color:#d73027;' : 
                  'background:#fff3cd;color:#856404;'}
              ">
                <span style="
                  width:8px;height:8px;border-radius:50%;
                  ${person.status === 'accepted' ? 'background:#4caf50;' : 
                    person.status === 'disputed' ? 'background:#f44336;' : 
                    'background:#ff9800;'}
                "></span>
                ${highlightText(person.name, searchTerm)}
              </span>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function addStatusCSS() {
  const cssId = "expense-approval-css";
  if (!document.getElementById(cssId)) {
    const style = document.createElement("style");
    style.id = cssId;
    style.textContent = `
      .status-pill {
        min-width: 92px;
        margin-left: 9px;
        border-radius: 13px;
        padding: 2.5px 11px;
        font-weight: 600;
        text-align: center;
        background: #ecf4ff;
        color: #157;
        height: fit-content;
        flex-shrink: 0;
      }
      .status-pill.disputed { background: #fedee0; color: #d22; }
      mark { background: #ffeb3b !important; padding: 1px 2px !important; border-radius: 2px !important; }
    `;
    document.head.appendChild(style);
  }
}
