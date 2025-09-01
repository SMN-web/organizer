export function showPaymentsPanel(container, user) {
  // Sample event list: fill dynamically in real app
  const events = [
    {
      type: "pay",
      main: "You paid Rafseed",
      amount: "-8 QAR",
      status: "Pending",
      time: "7m ago",
      actions: ["Cancel"]
    },
    {
      type: "pay",
      main: "You paid Rafseed",
      amount: "-5 QAR",
      status: "Accepted",
      time: "6m ago",
      actions: []
    },
    {
      type: "pay",
      main: "You paid Rafseed",
      amount: "-10 QAR",
      status: "Rejected",
      time: "5m ago",
      actions: []
    },
    {
      type: "pay",
      main: "You paid Bala",
      amount: "-15 QAR",
      status: "Rejected",
      time: "2h ago",
      actions: []
    },
    {
      type: "split",
      main: "Split with Bala & Shyam",
      amount: "-34 QAR",
      status: "Settled",
      time: "1d ago",
      actions: ["Remind"]
    }
  ];

  container.innerHTML = `
  <div class="tl-mainwrap">
    <div class="tl-header">
      <span class="tl-menu">&#9776;</span>
      <span class="tl-title">Your Settlements</span>
      <span class="tl-bell">&#128276;<span class="tl-bell-bdg">111</span></span>
    </div>
    <div class="tl-feed">
      ${events.map(ev=>`
        <div class="tl-ev-row tl-ev-${ev.status.toLowerCase()}">
          <span class="tl-ev-ico">${ev.type==="pay"?"💸":ev.type==="split"?"🧮":"🔔"}</span>
          <div class="tl-ev-main">
            <div class="tl-ev-summary">
              <span class="tl-ev-maintext">${ev.main}</span>
              <span class="tl-ev-amt">${ev.amount}</span>
            </div>
            <div class="tl-ev-meta">
              <span class="tl-ev-status">${ev.status}</span>
              <span class="tl-ev-time">${ev.time}</span>
              ${ev.actions.map(a=>`
                <button class="tl-ev-btn">${a}</button>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <button class="tl-fab">＋</button>
  </div>
  `;
  // FAB animation
  container.querySelector('.tl-fab').onclick = function(){
    this.classList.add('fab-pop');
    setTimeout(()=>this.classList.remove('fab-pop'),450);
    alert('Add payment (demo)');
  };
  container.querySelectorAll('.tl-ev-btn').forEach(b=>{
    b.onclick = function(e) {
      b.classList.add('tl-btn-ripple');
      setTimeout(()=>b.classList.remove('tl-btn-ripple'),350);
      alert(`${b.textContent} (demo)`);
      e.stopPropagation();
    }
  });
}
