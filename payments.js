export function showPaymentsPanel(container, user) {
  // DEMO DATA, SHORT
  let allFriends = [
    {
      id: 1, name: "Rafseed", net: -70, color: "#3064e6",
      events: [
        {id:1, dir:"to", amount:8, how:"You paid", status:"Pending", time:"7m ago"},
        {id:2, dir:"to", amount:5, how:"You paid", status:"Accepted", time:"6m ago"},
        {id:3, dir:"to", amount:10, how:"You paid", status:"Rejected", time:"5m ago"}
      ]
    },
    {
      id: 2, name: "Bala", net: 120, color: "#23b134",
      events: [{id:4, dir:"from", amount:15, how:"They paid you", status:"Rejected", time:"6m ago"}]
    },
    {
      id: 3, name: "Shyam", net: 0, color: "#8e61b5",
      events: [{id:5, dir:"to", amount:20, how:"You paid", status:"Pending", time:"just now"}]
    }
  ];

  let selected = allFriends[0].id;

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase();
  }

  function render() {
    const friend = allFriends.find(f=>f.id===selected);
    container.innerHTML = `
      <div class="cl-mainwrap">
        <div class="cl-friendbar">
          ${allFriends.map(f=>
            `<div class="cl-friendhead${f.id===selected?' active':''}" data-id="${f.id}" style="--c:${f.color}">
              <span class="cl-avatar" style="background:${f.color};">${initials(f.name)}</span>
              <span class="cl-friendname">${f.name}</span>
            </div>`
          ).join('')}
        </div>
        <div class="cl-bubblelist">
          ${friend.events.map(ev=>`
            <div class="cl-bubble-row${ev.dir==='to'?' right':' left'}">
              <div class="cl-bubble-main${ev.dir==='to'?' my':' their'}">
                <div>
                  <strong>${ev.how} <span class="cl-bubble-amt">${ev.amount} QAR</span></strong>
                  <span class="cl-bubble-status cl-status-${ev.status.toLowerCase()}">${ev.status}</span>
                </div>
                <div class="cl-bubble-tm">${ev.time || ''}</div>
                <div>
                  ${ev.status==="Pending"&&ev.dir==="to"?`
                    <button class="cl-act cl-cancel">Cancel</button>
                  `:""}
                  ${ev.status==="Pending"&&ev.dir==="from"?`
                    <button class="cl-act cl-accept">Accept</button>
                    <button class="cl-act cl-reject">Reject</button>
                  `:""}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="cl-botbar">
          <button class="cl-sendbtn pay">Pay</button>
          <button class="cl-sendbtn remind">Remind</button>
          <button class="cl-sendbtn split">Split</button>
        </div>
      </div>
    `;

    // Friend switch
    container.querySelectorAll(".cl-friendhead").forEach(btn => {
      btn.onclick = ()=>{selected=Number(btn.dataset.id);render();};
    });
    // Add action handlers (demo mode)
    container.querySelectorAll(".cl-act.cl-accept").forEach(b=>b.onclick=()=>alert("Accepted"));
    container.querySelectorAll(".cl-act.cl-reject").forEach(b=>b.onclick=()=>alert("Rejected"));
    container.querySelectorAll(".cl-act.cl-cancel").forEach(b=>b.onclick=()=>alert("Cancelled"));
    container.querySelectorAll(".cl-sendbtn.pay").forEach(b=>b.onclick=()=>alert("Pay Demo"));
    container.querySelectorAll(".cl-sendbtn.remind").forEach(b=>b.onclick=()=>alert("Remind Demo"));
    container.querySelectorAll(".cl-sendbtn.split").forEach(b=>b.onclick=()=>alert("Split Demo"));
  }
  render();
}
