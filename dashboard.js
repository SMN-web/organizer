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
    return `<circle r="${r}" cx="38" cy="38" fill="none" stroke="#1e88e5" stroke-width="10"
      stroke-dasharray="${(pct/100)*c},${c}" stroke-linecap="round" />`;
  }

  // CSS and HTML
  container.innerHTML = `
  <style>
    .db-main {
      max-width: 640px;
      margin: 40px auto 0;
      padding: 2em 1.5em 3em;
      background: #fff;
      border-radius: 1rem;
      box-shadow: 0 10px 30px rgb(37 115 255 / 0.15);
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      color: #2c3e50;
      animation: fadein 0.7s ease-out forwards;
    }

    @media (max-width: 680px) {
      .db-main {
        max-width: 95vw;
        padding: 1em 0.5em;
      }
    }

    .db-metric-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5em;
      justify-content: space-between;
      margin: 2em 0 1.8em;
    }

    .db-card {
      flex: 1 0 140px;
      max-width: 160px;
      background: linear-gradient(120deg, #f8f9fa, #e9ecef);
      border-radius: 12px;
      padding: 1.4em 1em 1.3em;
      box-shadow: 0 4px 12px rgb(0 0 0 / 0.07);
      text-align: center;
      font-size: 1.1em;
      color: #34495e;
      transition: box-shadow 0.25s ease;
      cursor: default;
      user-select: none;
    }

    .db-card:hover {
      box-shadow: 0 12px 24px rgb(37 115 255 / 0.25);
    }

    .db-card-label {
      font-size: 0.95em;
      margin-bottom: 0.3em;
      color: #7f8c8d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .db-card-val {
      font-size: 1.5em;
      font-weight: 700;
      color: #1a237e;
      letter-spacing: 0.02em;
    }

    .db-card-animbar {
      width: 90%;
      height: 8px;
      border-radius: 5px;
      background: #dfe6e9;
      margin: 0.8em auto 0.15em;
      overflow: hidden;
    }

    .db-card-animfill {
      height: 100%;
      border-radius: 5px;
      background: linear-gradient(90deg, #1e88e5, #42a5f5);
      transition: width 0.7s ease-in-out;
    }

    .db-card-animfill.you-owe {
      background: linear-gradient(90deg, #ef5350, #e53935);
    }

    .db-card-animfill.net-pos {
      background: linear-gradient(90deg, #43a047, #388e3c);
    }

    .db-section-hdr {
      font-size: 1.2em;
      font-weight: 600;
      color: #2c3e50;
      margin: 3em 0 1em 0;
      border-bottom: 2px solid #1e88e5;
      padding-bottom: 0.3em;
      text-align: left;
    }

    .db-piewrap {
      display: flex;
      align-items: center;
      margin-bottom: 2.7em;
      gap: 1.2em;
    }

    .db-donut-svg {
      width: 80px;
      height: 80px;
    }

    .db-pietotal {
      font-weight: 600;
      color: #1e88e5;
    }

    .db-ballist {
      margin: 0 auto 2.8em;
      width: 100%;
      max-width: 600px;
      border-collapse: separate;
      border-spacing: 0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 20px rgb(30 136 229 / 0.09);
    }

    .db-ballist th,
    .db-ballist td {
      padding: 12px 15px;
      font-size: 1.05em;
    }

    .db-ballist th {
      background: #e3f2fd;
      color: #1976d2;
      font-weight: 700;
      text-align: left;
    }

    .db-ballist tr:nth-child(even) td {
      background: #fafafa;
    }

    .db-ballist tr:nth-child(odd) td {
      background: #f4faff;
    }

    .db-ballist tr:hover td {
      background-color: #bbdefb;
      color: #0d47a1;
      transition: background-color 0.3s ease;
    }

    .db-ballist td:first-child {
      font-weight: 600;
      color: #1565c0;
    }

    .db-histstat {
      color: #34495e;
      margin: 1em 0;
      font-size: 1.02em;
      font-weight: 500;
    }

    @keyframes fadein {
      0% {
        opacity: 0;
        transform: translateY(30px);
      }

      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>
  <div class="db-main">
    <h2 style="font-size:2em;margin-top:0;letter-spacing:.01em;">Hi, <b>${escapeHtml(user.name || "User")}</b> 👋</h2>
    <div style="font-size:1.15em;color:#34495e; margin-bottom:0.7em; font-weight:600;">
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
        <div class="db-card-animbar"><div class="db-card-animfill you-owe" style="width:21%;"></div></div>
      </div>
      <div class="db-card">
        <div class="db-card-label">Net Position</div>
        <div class="db-card-val" id="net">${demo.net} QAR</div>
        <div class="db-card-animbar"><div class="db-card-animfill net-pos" style="width:49%;"></div></div>
      </div>
    </div>
    <div class="db-section-hdr"><span>Balance with Friends</span></div>
    <table class="db-ballist" style="margin:0 auto 2.3em auto;border-radius:11px;">
      <tr>
        <th>Friend</th>
        <th>They Owe You</th>
        <th>You Owe</th>
        <th>Net</th>
      </tr>
    ${
      // Collect distinct friend names from both arrays
      [...new Set(demo.friendsOwe.map(f => f.name).concat(demo.youOweList.map(f => f.name)))].map(name => {
        const youOweEntry = demo.youOweList.find(x => x.name === name);
        const friendsOweEntry = demo.friendsOwe.find(x => x.name === name);
        const youOweAmt = youOweEntry ? youOweEntry.amount : 0;
        const oweYouAmt = friendsOweEntry ? friendsOweEntry.amount : 0;
        const net = oweYouAmt - youOweAmt;
        const sym = net === 0 ? "" : net > 0 ? "+" : "-";
        const netC = net === 0 ? "#788" : net > 0 ? "#29a065" : "#db2854";
        return `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td style="color:#298539;font-weight:600;">${oweYouAmt} QAR</td>
          <td style="color:#de6d32;font-weight:600;">${youOweAmt} QAR</td>
          <td style="color:${netC};font-weight:700;">${sym}${Math.abs(net)}</td>
        </tr>`;
      }).join('')
    }
    </table>

    <div class="db-section-hdr"><span>Net Share Position</span></div>
    <div class="db-piewrap" style="margin-bottom:2.5em;">
      <svg class="db-donut-svg" width="76" height="76" viewBox="0 0 76 76" aria-label="Net share position chart" role="img">
        <circle r="30" cx="38" cy="38" fill="none" stroke="#e3f2fd" stroke-width="10"/>
        ${donutPath(demo.owedTotal, demo.owedTotal + demo.youOwe)}
        <text x="38" y="44" text-anchor="middle" font-size="19" fill="#1976d2" font-weight="700">${demo.net}</text>
      </svg>
      <div>
        <div style="font-size:1.16em;color:#1e88e5;font-weight:600;">Net: ${demo.net >= 0 ? '+' : ''}${demo.net} QAR</div>
        <div style="font-size:1.05em;color:#546e7a;font-weight:400;">You Are Owed vs You Owe</div>
      </div>
    </div>
    
    <div class="db-section-hdr">Your Activity</div>
    <div class="db-histstat" role="region" aria-live="polite">
      <span>Spends participated: <b>${demo.spends}</b> &bull; 
        Top single spend: <b>${demo.topSpend} QAR</b> &bull; Shares: <b>${demo.shares}</b> &bull; Settled: <b>${demo.settled}</b>
      </span>
    </div>
    <div style="margin:3.4em auto 0 auto;text-align:center;"><em style="font-size:1.06em;color:#99acd5;">Analytics, charting, and history as shown here.<br>Connect your real API for live data!</em></div>
  </div>
  `;

  // Animate counts for metric cards
  function animateCounts() {
    ["paid-total","owed-total","youowe","net"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) {
        const v = +el.textContent.replace(/\D/g,'');
        let cur = 0;
        const increment = Math.ceil((v || 1) / 40);
        function step() {
          if(cur >= v) { el.textContent = v + " QAR"; return; }
          cur += increment;
          el.textContent = Math.min(cur, v) + " QAR";
          requestAnimationFrame(step);
        }
        step();
      }
    });
  }
  animateCounts();

  // Escaping to prevent HTML injection
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }
}
