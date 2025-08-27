const FRIENDS = [
  { id: 'me', name: 'Me' },
  { id: 'b', name: 'B' },
  { id: 'c', name: 'C' },
  { id: 'd', name: 'D' },
  { id: 'e', name: 'E' }
];
function getFriendById(id) { return FRIENDS.find(f => f.id === id); }
export function showNewSpend(container) {
  container.innerHTML = `
    <form class="entry-form">
      <div class="selector-group">
        <span class="selector-label">Friends Sharing:</span>
        <input type="text" class="selector-search friend-search" placeholder="Search friends..." />
        <div class="selector-list friend-selector"></div>
        <div class="chosen-list chosen-friends"></div>
      </div>
      <div class="selector-group">
        <span class="selector-label">Paid By:</span>
        <input type="text" class="selector-search paidby-search" placeholder="Search payer..." />
        <div class="selector-list paidby-selector"></div>
      </div>
      <label for="amountPaid">Amount Paid (QAR):
        <input type="text" class="amount-input" id="amountPaid" readonly />
        <button type="button" class="open-calc-btn" title="Calculator">
          <svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><circle cx="12" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><rect x="8" y="15" width="8" height="2" rx="1"/></svg>
        </button>
      </label>
      <div class="spend-date-box">
        Date: <input type="date" class="spend-date" value="${(new Date()).toISOString().slice(0,10)}">
      </div>
      <div class="spend-category-box">
        Category:
        <select class="spend-category">
          <option value="food">Food</option>
          <option value="snacks">Snacks</option>
          <option value="purchase">Purchase</option>
          <option value="other">Other</option>
        </select>
        <div class="category-other-box" style="display:none;">
          <input type="text" class="category-other-input" placeholder="Enter category..." />
        </div>
      </div>
      <div class="spend-remarks-box">
        Remarks: <input type="text" class="spend-remarks" placeholder="Enter remarks (e.g., Al Khor Restaurant)">
      </div>
      <div class="split-ui"></div>
    </form>
  `;
  let selectedFriends = [],
      paidBy = null,
      distActive = false,
      splitShares = {};
  function renderFriendsSelector(){
    const search = container.querySelector('.friend-search').value.toLowerCase(),
          selector = container.querySelector('.friend-selector');
    selector.innerHTML = "";
    FRIENDS.filter(f=>f.name.toLowerCase().includes(search)).forEach(f=>{
      let sel=selectedFriends.includes(f.id) ? 'selected':'';
      selector.innerHTML+=`<div class="selector-item ${sel}" data-id="${f.id}">${f.name}</div>`;
    });
    selector.querySelectorAll('.selector-item').forEach(item=>{
      item.onclick=()=>{
        const id=item.dataset.id;
        if(selectedFriends.includes(id)){
          selectedFriends=selectedFriends.filter(fId=>fId!==id); if(paidBy===id) paidBy=null;
        }else{
          selectedFriends.push(id); selectedFriends=selectedFriends.sort((a,b)=>a==='me'?-1:b==='me'?1:0);
        }
        renderFriendsSelector(); renderChosenFriends(); renderPaidBySelector(); updateAmountInputState(); updateDistributeBtn();
      };
    });
  }
  function renderChosenFriends(){
    const chosen=container.querySelector('.chosen-friends');
    chosen.innerHTML=selectedFriends.map(id=>`<span class="chosen-chip">${getFriendById(id).name}</span>`).join(' ');
  }
  function renderPaidBySelector(){
    const search = container.querySelector('.paidby-search').value.toLowerCase(),
          selector = container.querySelector('.paidby-selector');
    selector.innerHTML="";
    selectedFriends.filter(f=>getFriendById(f).name.toLowerCase().includes(search)).forEach(id=>{
      let sel=(paidBy===id)?'selected':'';
      selector.innerHTML+=`<div class="selector-item ${sel}" data-id="${id}">${getFriendById(id).name}</div>`;
    });
    selector.querySelectorAll('.selector-item').forEach(item=>{
      item.onclick=()=>{paidBy=item.dataset.id;renderPaidBySelector();updateAmountInputState();updateDistributeBtn();}
    });
    if(!paidBy&&selectedFriends.length>0){paidBy=selectedFriends[0];renderPaidBySelector();}
  }
  function updateAmountInputState(){
    container.querySelector('.amount-input').readOnly=true;
    container.querySelector('.open-calc-btn').disabled=!selectedFriends.length||!paidBy;
  }
  // Date and category handling
  container.querySelector('.spend-category').onchange=e=>{
    let box=container.querySelector('.category-other-box');
    box.style.display=e.target.value==="other"?"block":"none";
  };
  // Initial render/search handlers
  renderFriendsSelector();renderChosenFriends();renderPaidBySelector();updateAmountInputState();
  container.querySelector('.friend-search').oninput = renderFriendsSelector;
  container.querySelector('.paidby-search').oninput = renderPaidBySelector;

  // Distribute button: only shows after amount entered and both selectors set
  function updateDistributeBtn(){
    const splitUI=container.querySelector('.split-ui');
    if(!selectedFriends.length||!paidBy||!container.querySelector('.amount-input').value||distActive) {
      splitUI.innerHTML="";
      return;
    }
    splitUI.innerHTML=`<button type="button" class="primary-btn active distribute-btn">Distribute</button>`;
    splitUI.querySelector('.distribute-btn').onclick=doDistribution;
  }

  function doDistribution(){
    distActive=true;
    const splitUI=container.querySelector('.split-ui');
    splitShares={};
    let total=parseFloat(container.querySelector('.amount-input').value);
    let autoVal=(total/(selectedFriends.length||1));
    splitUI.innerHTML=selectedFriends.map(id=>`
      <div class="split-row">
        <span class="split-name">${getFriendById(id).name}</span>
        <input type="number" min="0" step="0.01" class="split-amount" data-id="${id}" value="${autoVal.toFixed(2)}"/>
      </div>
    `).join('');
    splitUI.innerHTML+=`<button type="button" class="primary-btn active save-btn" style="margin-top:16px;">Save</button>`;
    splitUI.querySelectorAll('.split-amount').forEach(input=>{
      input.onchange=()=>{splitShares[input.dataset.id]=parseFloat(input.value);}
      splitShares[input.dataset.id]=parseFloat(input.value);
    });
    splitUI.querySelector('.save-btn').onclick = () => {
      let dateVal = container.querySelector('.spend-date').value || (new Date()).toISOString().slice(0,10);
      let category = container.querySelector('.spend-category').value;
      if(category==="other")category=container.querySelector('.category-other-input').value||"Other";
      let remarks = container.querySelector('.spend-remarks').value;
      let entry={timestamp:Date.now(),paidBy,amount:total,shares:splitShares,friends:[...selectedFriends],date:dateVal,category,remarks};
      let all=JSON.parse(localStorage.getItem('spendHistory')||"[]");
      all.push(entry);
      localStorage.setItem('spendHistory', JSON.stringify(all));
      alert("Saved!");
      // Optionally: reset form / switch to history
    };
  }

  // Calculator modal handler
  let calcModalActive=false;
  container.querySelector('.open-calc-btn').onclick=()=>{
    if(calcModalActive||container.querySelector('.open-calc-btn').disabled)return;
    calcModalActive=true;
    import('./calculatorModal.js').then(({showCalculatorModal})=>{
      showCalculatorModal(container,(val)=>{
        container.querySelector('.amount-input').value=Number(val).toFixed(2);
        calcModalActive=false;updateDistributeBtn();
      });
    });
  }
  // Watch amount entered -> show distribute button
  container.querySelector('.amount-input').oninput=updateDistributeBtn;
}
