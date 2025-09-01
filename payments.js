export function showPaymentsPanel(container, user) {
  // Demo data, swap for real
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70,
      events: [
        { dir: "to", amount: 8, status: "pending", time: "7m ago" },
        { dir: "to", amount: 5, status: "accepted", time: "6m ago" }
      ]
    },
    {
      initials: "BA", name: "Bala", net: 120,
      events: [ { dir: "to", amount: 15, status: "rejected", time: "6m ago" } ]
    },
    {
      initials: "SH", name: "Shyam", net: 0,
      events: [ { dir: "to", amount: 20, status: "pending", time: "just now" } ]
    }
  ];

  let expanded = 0;
  function render() {
    container.innerHTML = `
      <div class="bento-barrier"></div>
      <div class="bento-root">
        <div class="bento-header">
          <span class="bento-menu">&#9776;</span>
          <span class="bento-title">Your Settlements</span>
          <span class="bento-bell">&#128276;<span class="bento-bell-bdg">111</span></span>
        </div>
        <div class="bento-grid">
          ${friends.map((f,i)=>`
            <div class="bento-card${expanded===i?' expanded':''}" data-idx="${i}">
              <span class="bento-avatar">${f.initials}</span>
              <div>
                <span class="bento-fname">${f.name}</span><br>
                <span class="bento-net${f.net>0?' plus':f.net<0?' minus':' settled'}">
                  ${f.net>0?`+${f.net}`:f.net<0?f.net:"0"} QAR
                </span>
              </div>
              <span class="bento-expand">&#8250;</span>
              ${expanded===i ? `
                <div class="bento-sheet">
                  <div class="bento-sheet-title">${f.name} —${f.net>0?'You Get':f.net<0?'You Owe':'Settled'}</div>
                  <div class="bento-btn-row">
                    <button class="bento-btn pay">Pay</button>
                    <button class="bento-btn remind">Remind</button>
                    <button class="bento-btn split">Split</button>
                  </div>
                  <div class="bento-history">
                    ${(f.events||[]).map(ev=>`
                      <div class="bento-ev-row bento-ev-${ev.status}">
                        <span class="bento-ev-main">
                          ${ev.dir==='to'?`You paid ${f.name}`:`${f.name} paid you`} 
                          <span class="bento-ev-amt">${ev.amount} QAR</span>
                        </span>
                        <span class="bento-ev-stat">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
                        <span class="bento-ev-meta">${ev.time}</span>
                        ${ev.status==="pending"&&ev.dir==="to"?`<button class="bento-mini-act bento-ev-cancel">Cancel</button>`:""}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ``}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.querySelectorAll('.bento-card').forEach(card=>{
      card.onclick = e=>{
        // only expand if clicked not on a button inside
        if(!e.target.classList.contains('bento-btn') && !e.target.classList.contains('bento-mini-act')) {
          expanded = Number(card.dataset.idx);
          render();
        }
      };
    });
    container.querySelectorAll('.bento-btn, .bento-mini-act').forEach(btn=>{
      btn.onclick= e=>{
        btn.classList.add('bento-ripple');
        setTimeout(()=>btn.classList.remove('bento-ripple'),400);
        e.stopPropagation();
      };
    });
  }
  render();
}
