export function showPaymentsPanel(container, user) {
  // DATA
  const allFriends = Array.from({length:18},(_,i)=>({
    id: i+1,
    name: [
      "Rafseed","Bala","Shyam","Anju","Jose","Deepa","Girish","Narayan","Amit","Ravi",
      "Sunil","Dinesh","Zara","Lini","Sara","Vikram"][i%16],
    net: i%4===0?-70: i%4===1?120: i%4===2?0:-25,
    recent: i%3===0?"Accepted":i%3===1?"Rejected":"Pending",
    events: (i===0 ? Array.from({length:11}).map((_,j) =>
      (j%2===0)
        ? { type: "pay", dir: "to", amount: 10, status: "accepted", time: `${11-j}m ago` }
        : { type: "pay", dir: "to", amount: 10, status: "pending", time: `${11-j}m ago` }
    ) : [])
  }));

  let searchTerm = "";
  let expandedId = null;

  function initials(name) {
    return (name.match(/[A-Z]/gi) || []).slice(0,2).join('').toUpperCase();
  }

  function render() {
    const friends = allFriends.filter(f => !searchTerm || f.name.toLowerCase().includes(searchTerm));
    container.innerHTML = `
      <div class="paycard-appshell">
        <div class="paycard-bar">
          <span class="paycard-title">Your Settlements</span>
          <input type="text" class="paycard-search" id="payCardSearch" placeholder="Search..."/>
        </div>
        <div class="paycard-list">
          ${friends.map((f,idx) => `
            <div class="paycard-card${expandedId===f.id?" expanded":""}" data-id="${f.id}" style="z-index:${999-idx};">
              <div class="paycard-card-head">
                <span class="paycard-avatar">${initials(f.name)}</span>
                <span class="paycard-nblock">
                  <span class="paycard-name">${f.name}</span>
                  <span class="paycard-amt ${f.net>0?"recv":f.net<0?"give":"settled"}">
                    ${f.net>0? "+"+f.net+" QAR": f.net<0? f.net+" QAR":"Settled"}
                  </span>
                </span>
                <span class="paycard-status paycard-status-${f.recent.toLowerCase()}">${f.recent}</span>
                <button class="paycard-menu">&#8942;</button>
              </div>
              <div class="paycard-card-actions">
                <button class="paycard-action-btn remind">Remind</button>
                <button class="paycard-action-btn split">Split</button>
                <button class="paycard-action-btn pay">Pay</button>
              </div>
              <div class="paycard-card-detailwrap"${expandedId===f.id?" style='display:block'":" style='display:none'"}>
                <div class="paycard-card-detail-scroll">
                  ${
                    (f.events && f.events.length) ?
                    f.events.map(ev => `
                      <div class="paycard-bubble paycard-bubble-${ev.status}">
                        <span class="paycard-bubble-main">
                          ${ev.dir === "to" ? "You paid "+f.name : f.name+" paid you"}
                          <b>${ev.amount} QAR</b>
                        </span>
                        <span class="paycard-bubble-stat">${ev.status.charAt(0).toUpperCase()+ev.status.slice(1)}</span>
                        <span class="paycard-bubble-time">${ev.time}</span>
                      </div>
                    `).join("")
                    : "<div class='paycard-empty'>No history.</div>"
                  }
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Prevent search input from losing focus when typing
    let s = container.querySelector("#payCardSearch");
    s.value = searchTerm;
    s.oninput = e => {
      searchTerm = e.target.value.trim().toLowerCase();
      render();
      setTimeout(()=>{const s=container.querySelector("#payCardSearch"); if(s)s.focus();},0);
    };

    container.querySelectorAll(".paycard-card").forEach(card => {
      card.onclick = e => {
        // Expand/collapse on card click, ignore action/menu buttons
        if(e.target.classList.contains("paycard-action-btn")||e.target.classList.contains("paycard-menu")) return;
        const id = Number(card.dataset.id);
        expandedId = expandedId===id ? null : id;
        render();
      };
      // Swipe actions (mobile): left/right to quickly call action
      let startX = null;
      card.addEventListener("touchstart", (ev)=>{startX=ev.touches[0].clientX;});
      card.addEventListener("touchend", ev=>{
        if(!startX) return;
        let dx = ev.changedTouches[0].clientX - startX;
        if(dx > 35) alert("Remind (demo)");
        if(dx < -35) alert("Pay (demo)");
        startX = null;
      });
    });
    container.querySelectorAll(".paycard-action-btn.remind").forEach(btn => btn.onclick = e=>{e.stopPropagation();alert("Remind (demo)");});
    container.querySelectorAll(".paycard-action-btn.split").forEach(btn => btn.onclick = e=>{e.stopPropagation();alert("Split (demo)");});
    container.querySelectorAll(".paycard-action-btn.pay").forEach(btn => btn.onclick = e=>{e.stopPropagation();alert("Pay (demo)");});
    container.querySelectorAll(".paycard-menu").forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      alert("Context menu (Demo: Share, Pin, etc)");
    });
  }
  render();
}
