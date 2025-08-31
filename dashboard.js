export function showDashboard(container, user) {
  // Demo data (replace with real values in production)
  const demo = {
    paidTotal: 362,
    owedTotal: 119,
    youOwe: 41,
    net: 78,
    spends: 12,
    topSpend: 120,
    shares: 22,
    friendsOwe: [
      { name: "Bala", amount: 27 },
      { name: "Rafseed", amount: 15 }
    ],
    youOweList: [
      { name: "Sreerag", amount: 18 },
      { name: "Rafseed", amount: 23 }
    ],
    settled: 9
  };

  // Pie slice (SVG donut) generator for net balance
  function donutPath(value, total) {
    const r = 30, c = 2 * Math.PI * r;
    const pct = Math.min(100, Math.max(0, total ? value / total * 100 : 0));
    return `<circle r="${r}" cx="38" cy="38" fill="none" stroke="#5c7cff" stroke-width="10"
      stroke-dasharray="${(pct/100)*c},${c}" stroke-linecap="round" />`;
  }

  // CSS and HTML
  container.innerHTML = `
  <style>
    .db-main {
      max-width: 650px;
      margin: 40px auto 0 auto;
      padding: 1.5em 1.2em 2.5em 1.2em;
      background: rgba(255,255,255,0.93);
      border-radius: 2.1em;
      box-shadow: 0 8px 67px #2573ff18, 0 4px 24px #0427aa0d;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      animation: fadein .6s cubic-bezier(.13,1.1,.65,1.04) 1;
    }
    @media (max-width:680px) { .db-main { max-width:97vw; padding:0.6em 0.1em; } }
    .db-metric-cards { display:flex; flex-wrap:wrap; gap:1.4em; justify-content:space-around; margin:1.75em 0 1.4em 0;}
    .db-card {
      flex:1 0 120px; min-width:120px; max-width:160px;
      background:linear-gradient(110deg,#eef2fb 60%,#eaf2fa 100%);
      border-radius:18px; color:#32486b; 
      box-shadow:0 2.5px 17px #4e87fd0a, 0 0.7px 3px #0a287309;
      padding:1.2em .7em 1.15em .7em;
      transition:box-shadow .17s; text-align:center; font-size:1.10em;
      position:relative; overflow:hidden;
      animation: fadeup .55s cubic-bezier(.13,1.1,.65,1.04) 1;
    }
    .db-card-label { font-size:0.99em; margin-bottom:.32em; color:#7ab;}
    .db-card-val {
      font-size:1.49em; font-weight:700;
      color:#264587;
      animation: counterup 1.3s cubic-bezier(.13,1.1,.65,1.04) 1;
      letter-spacing:0.02em;
    }
    .db-card-animbar {
      width:89%; height:8px; border-radius:5px; background:#e8effb; margin:0.9em auto 0.1em auto; overflow:hidden;
    }
    .db-card-animfill { height:100%; border-radius:4px; background:linear-gradient(90deg,#6bbaf8 10%,#3488e1 90%); }
    .db-section-hdr { margin:2.85em 0 .9em 0; font-size:1.14em; text-align:left; color:#045; font-weight:500; letter-spacing:.01em;}
    .db-piewrap { display:flex; align-items:center; margin-bottom:.7em; gap:1.1em;}
    .db-donut-svg { width:76px; height:76px; }
    .db-pietotal { font-weight:600; color:#267;" }
    .db-ballist td, .db-ballist th { padding:8px 10px; font-size:1.07em;}
    .db-ballist th { background: #f4f8fd; color:#6c99cd; }
    .db-ballist tr:nth-child(even) td { background:#fafdff;}
    .db-ballist tr:nth-child(odd)  td { background:#f4fafd;}
    .db-histstat { color: #388; margin: 0.8em 0; font-size: 0.97em;}
    @keyframes fadein { 0%{opacity:0;transform:translateY(24px)} 100%{opacity:1;transform:translateY(0)} }
    @keyframes fadeup { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
    @keyframes counterup { 0%{color:#5ca3fc;} 60%{color:#267;} }
  </style>
  <div class="db-main">
    <h2 style="font-size:2em;margin-top:0;letter-spacing:.01em;">Hi, <b>${escapeHtml(user.name || "User")}</b> 👋</h2>
    <div style="font-size:1.15em;color:#387; margin-bottom:0.7em; font-weight:500;">
      Here’s your group payments snapshot.
    </div>
    <div class="db-metric-cards">
      <div class="db-card">
        <div class="db-card-label">Total Paid</div>
        <div class="db-card-val" id="paid-total">${demo.paidTotal} QAR</div>
        <div class="db-card-animbar"><div class="db-card-animfill" style="width:88%;"></div></div>
      </div>
      <div class="db-card">
        <div class="db-card-label">You Are Owed</div>
        <div class="db-card-val" id="owed-total">${demo.owedTotal} QAR</div>
        <div class="db-card-animbar"><div class="db-card-animfill" style="width:56%;"></div></div>
      </div>
      <div class="db-card">
        <div class="db-card-label">You Owe</div>
        <div class="db-card-val" id="youowe">${demo.youOwe} QAR</div>
        <div class="db-card-animbar"><div class="db-card-animfill" style="width:21%;background:#fc896c;"></div></div>
      </div>
      <div class="db-card">
        <div class="db-card-label">Net Position</div>
        <div class="db-card-val" id="net">${demo.net} QAR</div>
        <div class="db-card-animbar"><div class="db-card-animfill" style="width:49%;background:#23bc79;"></div></div>
      </div>
    </div>
    <div class="db-section-hdr"><span>Balance with Friends</span></div>
    <table class="db-ballist" style="margin:0 auto 2.3em auto;border-radius:11px;box-shadow:0 1px 11px #9bf0fa0f;">
      <tr>
        <th>Friend</th>
        <th>They Owe You</th>
        <th>You Owe</th>
        <th>Net</th>
      </tr>
    ${
      demo.friendsOwe.concat(demo.youOweList).map(row => {
        // Friendly merge logic for demonstration
        const youOweEntry = demo.youOweList.find(x => x.name === row.name);
        const friendsOweEntry = demo.friendsOwe.find(x => x.name === row.name);
        const youOweAmt = youOweEntry ? youOweEntry.amount : 0;
        const oweYouAmt = friendsOweEntry ? friendsOweEntry.amount : 0;
        const net = oweYouAmt - youOweAmt;
        const sym = net === 0 ? "" : net > 0 ? "+" : "-";
        const netC = net === 0 ? "#788" : net > 0 ? "#29a065" : "#db2854";
        return `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td style="color:#298539;font-weight:500;">${oweYouAmt?+oweYouAmt:0} QAR</td>
          <td style="color:#de6d32;font-weight:500;">${youOweAmt?+youOweAmt:0} QAR</td>
          <td style="color:${netC};font-weight:700;">${sym}${Math.abs(net)}</td>
        </tr>`;
      }).join('')
    }
    </table>

    <div class="db-section-hdr"><span>Net Share Position</span></div>
    <div class="db-piewrap" style="margin-bottom:2.5em;">
      <svg class="db-donut-svg" width="76" height="76" viewBox="0 0 76 76">
        <circle r="30" cx="38" cy="38" fill="none" stroke="#e2eef4" stroke-width="10"/>
        ${donutPath(demo.owedTotal, demo.owedTotal + demo.youOwe)}
        <text x="38" y="44" text-anchor="middle" font-size="19" fill="#368ac7" font-weight="700">${demo.net}</text>
      </svg>
      <div>
        <div style="font-size:1.16em;color:#194a6e;font-weight:600;">Net: ${demo.net >= 0 ? '+' : ''}${demo.net} QAR</div>
        <div style="font-size:1.05em;color:#789;font-weight:400;">You Are Owed vs You Owe</div>
      </div>
    </div>
    
    <div class="db-section-hdr">Your Activity</div>
    <div class="db-histstat">
      <span>Spends participated: <b>${demo.spends}</b> &bull; 
        Top single spend: <b>${demo.topSpend} QAR</b> &bull; Shares: <b>${demo.shares}</b> &bull; Settled: <b>${demo.settled}</b>
      </span>
    </div>
    <div style="margin:3.4em auto 0 auto;text-align:center;"><em style="font-size:1.06em;color:#99acd5;">Analytics, charting, and history as shown here.<br>Connect your real API for live data!</em></div>
  </div>
  `;

  // Optional: Animations can be further enhanced with JS if you want animated counts or pie filling.
  function animateCounts() {
    ["paid-total","owed-total","youowe","net"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) {
        const v = +el.textContent.replace(/\D/g,'');
        let cur = 0, st = Date.now();
        const increment = Math.ceil((v||1) / 35);
        function step() {
          if(cur >= v) { el.textContent = v+" QAR"; return; }
          cur += increment;
          el.textContent = Math.min(cur, v)+" QAR";
          requestAnimationFrame(step);
        }
        step();
      }
    });
  }
  animateCounts();
  
  // Escaping for demo (exists above)
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }
}
