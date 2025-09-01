export function showPaymentsPanel(container, user) {
  // Sample Data - replace with actual
  const friends = [
    {
      initials: "RA",
      name: "Rafseed",
      net: -70,
      events: [
        { dir: "to", amount: 8, status: "pending", time: "7m ago" },
        { dir: "to", amount: 5, status: "accepted", time: "6m ago" },
        { dir: "to", amount: 10, status: "rejected", time: "5m ago" }
      ]
    },
    {
      initials: "BA",
      name: "Bala",
      net: 120,
      events: [
        { dir: "to", amount: 15, status: "rejected", time: "6m ago" }
      ]
    },
    {
      initials: "SH",
      name: "Shyam",
      net: 0,
      events: [
        { dir: "to", amount: 20, status: "pending", time: "just now" }
      ]
    }
  ];

  // State
  let current = 0;

  function render() {
    const f = friends[current];
    const netState = f.net > 0 ? 'get' : f.net < 0 ? 'owe' : 'settled';

    container.innerHTML = `
    <div class="fc-mainwrap">
      <div class="fc-topspacer"></div>
      <div class="fc-header-row">
        <span class="fc-menu">&#9776;</span>
        <span class="fc-title">Your Settlements</span>
        <span class="fc-bell">&#128276;<span class="fc-bell-bdg">111</span></span>
      </div>
      <div class="fc-carousel-ctr">
        <button class="fc-arrow left"${current===0?" disabled":""}>&lt;</button>
        <div class="fc-card-ctr">
          <div class="fc-card anim-focus">
            <div class="fc-avatar">${f.initials}</div>
            <div class="fc-fname">${f.name}</div>
            <div class="fc-net">
              <span class="fc-pnum fc-${netState}">
                ${f.net>0?`+${f.net}`:f.net<0?f.net:"0"} QAR
              </span>
              <span class="fc-badge fc-badge-${netState}">
                ${netState==="get"?"You Get":netState==="owe"?"You Owe":"Settled"}
              </span>
            </div>
          </div>
        </div>
        <button class="fc-arrow right"${current===friends.length-1?" disabled":""}>&gt;</button>
      </div>
      <div class="fc-actions-row">
        <button class="fc-act-btn fc-pay">Pay</button>
        <button class="fc-act-btn fc-remind">Remind</button>
        <button class="fc-act-btn fc-split">Split</button>
      </div>
      <div class="fc-history">
        ${(f.events||[]).map(ev=>`
          <div class="fc-ev-row fc-ev-${ev.status}">
            <span class="fc-ev-main">
              ${ev.dir==="to"?"You paid "+f.name:`${f.name} paid you`} <span class="fc-ev-amt">${ev.amount} QAR</span>
            </span>
            <span class="fc-ev-stat">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
            <span class="fc-ev-meta">${ev.time}</span>
            ${
              ev.status==="pending"&&ev.dir==="to"?
              `<button class="fc-mini-act fc-ev-cancel">Cancel</button>`:""
            }
          </div>
        `).join('')}
      </div>
      <div class="fc-paginator">
        ${friends.map((_,i)=>`<span class="fc-dot${i===current?' fc-dot-cur':''}"></span>`).join('')}
      </div>
    </div>
    `;

    // Animations
    setTimeout(()=>{
      document.querySelectorAll('.fc-card').forEach(c=>{
        c.classList.remove('anim-focus');
        void c.offsetWidth; // trigger reflow
        c.classList.add('anim-focus');
      });
    },1);

    container.querySelector('.fc-arrow.left').onclick = ()=>{if(current>0){current--;render();}};
    container.querySelector('.fc-arrow.right').onclick = ()=>{if(current<friends.length-1){current++;render();}};
    // Optional: swipe event for touch (not shown here, but can be added)
    container.querySelectorAll('.fc-act-btn').forEach(b=>b.onclick=()=>b.classList.add('ripple-burst'));
    container.querySelectorAll('.fc-mini-act').forEach(b=>b.onclick=()=>b.classList.add('ripple-burst'));
  }
  render();
}
