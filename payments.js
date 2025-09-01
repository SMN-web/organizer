export function showPaymentsPanel(container, user) {
  // Data (short sample, expand as needed)
  const allFriends = [
    {
      id: 1, name: "Rafseed", net: -70,
      avatarHue: 220,
      events: [
        {id:11, type:"pay", dir:"to", amount:8, status:"pending", time:"7m ago"},
        {id:12, type:"pay", dir:"to", amount:5, status:"accepted", time:"6m ago"},
      ]
    },
    {
      id: 2, name: "Bala", net: 120,
      avatarHue: 125,
      events: [
        {id:21, type:"pay", dir:"to", amount:15, status:"rejected", time:"6m ago"}
      ]
    }
  ];

  let selectedId = null, searchTerm = "";

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase();
  }

  function animateRows() {
    // Animate cards with staggered fade/slide in
    document.querySelectorAll('.wave-friendcard').forEach((el,i)=>{
      el.style.opacity=0; el.style.transform="translateY(32px) scale(.97)";
      setTimeout(()=>{
        el.style.transition="opacity 0.42s cubic-bezier(.56,2,.68,.89), transform .44s cubic-bezier(.36,1.8,.52,1)";
        el.style.opacity=1; el.style.transform="none";
      },120+70*i);
    });
  }

  function renderList() {
    const friends = allFriends.filter(f=>!searchTerm||f.name.toLowerCase().includes(searchTerm));
    container.innerHTML = `
      <div class="wave-shell">
        <div class="wave-topbar">
          <span class="wave-menubtn">&#9776;</span>
          <span class="wave-title">FlowPay</span>
        </div>
        <div class="wave-searchrow">
          <input type="text" id="waveSearch" class="wave-search"
            placeholder="Search..." value="${searchTerm.replace(/"/g,'&quot;')}"/>
        </div>
        <div class="wave-wavecardlist">
          ${friends.map((f,i)=>`
            <div class="wave-friendcard" data-id="${f.id}" style="--avatar:${f.avatarHue||60}">
              <div class="wave-card-bg"></div>
              <span class="wave-avatar" style="background:hsl(${f.avatarHue||190},77%,83%)">${initials(f.name)}</span>
              <span class="wave-friendmeta">
                <span class="wave-friendname">${f.name}</span>
                <span class="wave-friendamt" style="color:${f.net>0?'#1bb169':f.net<0?'#dc3451':'#7a8aad'}">
                  ${f.net>0?`+${f.net} QAR`:f.net<0?`${f.net} QAR`:"Settled"}
                </span>
              </span>
              <button class="wave-action-btn">➔</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    setTimeout(animateRows,8);

    // Keep search focused
    let s = container.querySelector("#waveSearch");
    s.oninput = e => {searchTerm = e.target.value.trim().toLowerCase(); renderList(); setTimeout(()=>{let s=container.querySelector("#waveSearch");if(s)s.focus();},0);}
    container.querySelectorAll('.wave-friendcard').forEach(card=>{
      card.onclick = () => {selectedId = Number(card.dataset.id); renderDetail();}
    });
  }

  function renderDetail() {
    const f = allFriends.find(ff=>ff.id===selectedId);
    container.innerHTML = `
      <div class="wave-detailmodal">
        <div class="wave-header-fs" style="background:hsl(${f.avatarHue||180},60%,90%)">
          <button class="wave-fs-back" id="waveBackBtn">←</button>
          <span class="wave-avatar-fs" style="background:hsl(${f.avatarHue||180},61%,85%)">${initials(f.name)}</span>
          <span class="wave-fs-metablock">
            <span class="wave-fs-name">${f.name}</span>
            <span class="wave-fs-amt" style="color:${f.net>0?'#1bb169':f.net<0?'#e2334c':'#7a8aad'}">
              ${f.net>0?`+${f.net} QAR`:f.net<0?`${f.net} QAR`:"Settled"}
            </span>
          </span>
        </div>
        <div class="wave-historyflow">
          ${
            (f.events||[]).map((ev,i)=>
              `<div class="wave-bubble-wrap wave-bubble-${ev.status}" style="animation-delay:${0.07*i+0.09}s">
                <div class="wave-bubble-inner">
                  <div class="wave-bubble-title">
                    ${ev.dir==='to' ? `You paid ${f.name}` : `${f.name} paid you`} <b>${ev.amount} QAR</b>
                  </div>
                  <div class="wave-bubble-stat">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</div>
                  <div class="wave-bubble-meta">${ev.time}</div>
                  ${ev.status==="pending" ?
                     `<div class="wave-bubble-actions">
                      <button class="wave-bubble-btn accept">Accept</button>
                      <button class="wave-bubble-btn reject">Reject</button>
                      <button class="wave-bubble-btn cancel">Cancel</button>
                    </div>`:""}
                </div>
              </div>`
            ).join("")
          }
        </div>
        <div class="wave-fs-paybar">
          <button class="wave-fs-paybtn">Pay</button>
        </div>
      </div>
    `;
    // Back
    container.querySelector("#waveBackBtn").onclick = () => {selectedId=null;renderList();};
    // Animated bubble "flip" demo for accept/reject/cancel buttons
    container.querySelectorAll(".wave-bubble-btn").forEach(btn=>{
      btn.onclick = e=>{
        const bb = btn.closest('.wave-bubble-inner');
        bb.style.transition='transform .48s cubic-bezier(.7,1.8,.4,1), filter .14s';
        bb.style.transform = 'rotateY(90deg) scale(0.3)';
        setTimeout(()=>{
          bb.querySelector('.wave-bubble-stat').innerHTML = btn.classList.contains('accept') ? "Accepted"
            : btn.classList.contains('reject') ? "Rejected" : "Cancelled";
          bb.style.transform = 'rotateY(0deg) scale(1)';
          bb.style.filter = 'drop-shadow(0 6px 12px #8fdbff33)';
        },210);
        setTimeout(()=>{bb.style.filter='';},560);
      };
    });
  }
  if(selectedId) renderDetail(); else renderList();
}
