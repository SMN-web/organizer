export function showPaymentsPanel(container, user) {
  const allFriends = [
    {
      id: 1, name: "Rafseed", net: -70, color: "#3766e3",
      events: [
        {id:1, dir:"to", amount:8, how:"You paid", status:"Pending", time:"7m ago"},
        {id:2, dir:"to", amount:5, how:"You paid", status:"Accepted", time:"6m ago"},
        {id:3, dir:"to", amount:10, how:"You paid", status:"Rejected", time:"5m ago"}
      ]
    },
    {
      id: 2, name: "Bala", net: 120, color: "#23b134",
      events: [ {id:4, dir:"from", amount:15, how:"They paid you", status:"Rejected", time:"6m ago"} ]
    },
    {
      id: 3, name: "Shyam", net: 0, color: "#8e61b5",
      events: [ {id:5, dir:"to", amount:20, how:"You paid", status:"Pending", time:"just now"} ]
    }
  ];

  let selIdx = 0;
  let searchDrawerOpen = false;

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase();
  }

  function nfmt(n) {
    return n>0?`+${n} QAR` : n<0?`${n} QAR` : "Settled";
  }

  function render() {
    const f = allFriends[selIdx];
    container.innerHTML = `
      <div class="carousel-shell">
        <div class="carousel-top-pad"></div>
        <div class="carousel-toolbar">
          <button class="carousel-menubtn">&#9776;</button>
          <span class="carousel-title">Your Settlements</span>
          <button class="carousel-searchbtn" id="carouselSearchBtn">&#128269;</button>
        </div>
        ${searchDrawerOpen ? `<div class="carousel-searchdrawer">
          <input type="text" placeholder="Search..." class="carousel-searchinpt" id="carouselSearchInpt"/>
          <div class="carousel-searchflist">
            ${allFriends.map((f2,idx)=>`
               <div class="carousel-searchfriend${idx===selIdx?' active':''}" data-idx="${idx}">
                 <span class="carousel-searchavatar" style="background:${f2.color}">${initials(f2.name)}</span>
                 <span class="carousel-searchname">${f2.name}</span>
                 <span class="carousel-searchamt" style="color:${f2.net>0?'#1BB169':f2.net<0?'#D72F32':'#888'}">${nfmt(f2.net)}</span>
               </div>
            `).join("")}
          </div>
        </div>`:""}
        <div class="carousel-cardview">
          <button class="carousel-navbtn prev"${selIdx===0?' disabled':''}>&lt;</button>
          <div class="carousel-friendcard" style="background:${f.color};animation:slide-in .45s cubic-bezier(.38,1.35,.7,1.01)">
            <div class="carousel-avatar" style="background:${f.color}">${initials(f.name)}</div>
            <div class="carousel-fname">${f.name}</div>
            <div class="carousel-famt" id="carouselFamt" style="color:${f.net>0?'#baffdd':f.net<0?'#ffe7e2':'#f5f8fe'}">${nfmt(f.net)}</div>
            <div class="carousel-fstatus carousel-fstatus-${nfmt(f.net)==="Settled"?"settled":f.net>0?"receive":"give"}">
              ${nfmt(f.net) === "Settled"
                ? "All Settled"
                : f.net>0? "You Get" : "You Owe"}
            </div>
          </div>
          <button class="carousel-navbtn next"${selIdx===allFriends.length-1?' disabled':''}>&gt;</button>
        </div>
        <div class="carousel-actbar">
          <button class="carousel-btn remind">Remind</button>
          <button class="carousel-btn split">Split</button>
          <button class="carousel-btn pay">Pay</button>
        </div>
        <div class="carousel-history">
          ${(f.events||[]).map(ev=>`
            <div class="carousel-historyrow">
              <span class="carousel-hwho" style="color:${ev.dir==="to"?"#2344d4":"#13a429"}">${ev.how}</span>
              <span class="carousel-hamt">${ev.amount} QAR</span>
              <span class="carousel-hstat carousel-hstat-${ev.status.toLowerCase()}">${ev.status}</span>
              <span class="carousel-htime">${ev.time}</span>
              <span class="carousel-historybtns">${
                ev.status==="Pending"&&ev.dir==="from"?
                `<button class="carousel-mini accept">Accept</button><button class="carousel-mini reject">Reject</button>`:""
              }
                ${ev.status==="Pending"&&ev.dir==="to"?`<button class="carousel-mini cancel">Cancel</button>`:""}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    // Animation: quick count-up for net
    setTimeout(()=>{
      let el=container.querySelector("#carouselFamt");
      if(!el)||nfmt(f.net)==="Settled"||Math.abs(f.net)<=1)return;
      let v=0, target=Math.abs(f.net), sign=f.net<0?-1:1, i=0, steps=13;
      function tick(){ if(i>=steps)return; v=Math.round(target*i/steps); el.textContent=(sign>0?"+":"")+(v)+" QAR"; i++; setTimeout(tick,22);}
      tick();
    },440);

    // Navigation and search
    container.querySelector(".carousel-navbtn.prev").onclick = ()=>{if(selIdx>0){selIdx--;render();}};
    container.querySelector(".carousel-navbtn.next").onclick = ()=>{if(selIdx<allFriends.length-1){selIdx++;render();}};
    container.querySelector("#carouselSearchBtn").onclick = ()=>{
      searchDrawerOpen=!searchDrawerOpen; render();
      if(searchDrawerOpen)setTimeout(()=>{const s=container.querySelector("#carouselSearchInpt");if(s)s.focus();},2);
    };
    if(searchDrawerOpen){
      container.querySelectorAll(".carousel-searchfriend").forEach(btn=>{
        btn.onclick=()=>{selIdx=Number(btn.dataset.idx);searchDrawerOpen=false;render();};
      });
    }
    // Actions
    container.querySelectorAll(".carousel-btn.remind").forEach(b=>b.onclick=()=>alert("Remind demo"));
    container.querySelectorAll(".carousel-btn.split").forEach(b=>b.onclick=()=>alert("Split demo"));
    container.querySelectorAll(".carousel-btn.pay").forEach(b=>b.onclick=()=>alert("Pay demo"));
    container.querySelectorAll(".carousel-mini.accept").forEach(b=>b.onclick=()=>alert("Accept demo"));
    container.querySelectorAll(".carousel-mini.reject").forEach(b=>b.onclick=()=>alert("Reject demo"));
    container.querySelectorAll(".carousel-mini.cancel").forEach(b=>b.onclick=()=>alert("Cancel demo"));
  }
  render();
}
