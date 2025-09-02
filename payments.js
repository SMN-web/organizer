export function showPaymentsPanel(container, user) {
  // Demo data - swap for real
  const friends = [
    {
      initials: "RA",
      name: "Rafseed",
      net: -70,
      timeline: [
        { type: "payment", dir: "to", status: "paid", amount: 8, date: "9 Jul", time: "12:01 pm" },
        { type: "payment", dir: "to", status: "pending", amount: 6, date: "7 Aug", time: "7:14 am" },
        { type: "reward", summary: "You earned a loyalty bonus!" }
      ]
    },
    {
      initials: "BA",
      name: "Bala",
      net: 120,
      timeline: [
        { type: "payment", dir: "from", status: "paid", amount: 15, date: "10 Aug", time: "8:01 am" }
      ]
    }
  ];
  let selected = null;

  function render() {
    container.innerHTML = `
      <div class="gpay-main-container">
        <div style="height:38px"></div>
        <div class="gpay-friends-list">
          ${friends.map((f,i)=>`
            <div class="gpay-friend-row" data-idx="${i}">
              <span class="gpay-friend-avatar">${f.initials}</span>
              <span class="gpay-friend-name">${f.name}</span>
              <span class="gpay-friend-net ${f.net>0?'plus':f.net<0?'minus':'settled'}">
                ${f.net>0?`+${f.net}`:f.net<0?`–${Math.abs(f.net)}`:"Settled"} QAR
              </span>
              <span class="gpay-open">&#8250;</span>
            </div>
          `).join("")}
        </div>
        <div class="gpay-activity-area">
          ${selected === null ? `
            <div class="gpay-instructions">Select a friend above to view activity</div>
          ` : friendView(friends[selected])}
        </div>
      </div>
    `;
    container.querySelectorAll('.gpay-friend-row').forEach(row=>{
      row.onclick = ()=>{selected = Number(row.dataset.idx); render();}
    });
    if(selected !== null) {
      // Back
      container.querySelector('.gpay-back').onclick = ()=>{selected=null; render();};
    }
  }

  function friendView(friend) {
    return `
      <div class="gpay-activity-wrap">
        <div class="gpay-back-row">
          <button class="gpay-back" aria-label="Back">&larr;</button>
          <span class="gpay-activity-av">${friend.initials}</span>
          <span class="gpay-activity-title">${friend.name}</span>
          <span class="gpay-activity-net ${friend.net>0?'plus':friend.net<0?'minus':'settled'}">
            ${friend.net>0?`+${friend.net}`:friend.net<0?`–${Math.abs(friend.net)}`:"Settled"} QAR
          </span>
        </div>
        <div class="gpay-activity-cards">
          ${friend.timeline.map(ev=>{
            if(ev.type==="payment") {
              return `
                <div class="gpay-card gpay-txn-card ${ev.dir==="from"?"receive":"send"}">
                  <div class="gpay-txn-head">
                    <span class="gpay-txn-type">${ev.dir==="from"?"Received":"Paid"}</span>
                    <span class="gpay-txn-amt ${ev.dir==="from"?"plus":"minus"}">
                      ${ev.dir==="from"?"+" : "–"}${ev.amount} QAR
                    </span>
                  </div>
                  <div class="gpay-txn-status ${ev.status}">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</div>
                  <div class="gpay-txn-dt">${ev.date}, ${ev.time}</div>
                </div>
              `;
            } else if(ev.type==="reward") {
              return `
                <div class="gpay-card gpay-reward-card">
                  <div class="gpay-reward-icon">🎉</div>
                  <div class="gpay-reward-summary">${ev.summary}</div>
                </div>
              `;
            }
            return "";
          }).join("")}
        </div>
        <div class="gpay-actionbar">
          <button class="gpay-abtn pay">Pay</button>
          <button class="gpay-abtn request">Request</button>
          <input type="text" class="gpay-msginpt" placeholder="Message..." />
        </div>
      </div>
    `;
  }

  render();
}
