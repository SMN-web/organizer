export function showDashboard(container, user) {
  // --- Replace with real data from backend/API ---
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

  // --- Utility ---
  function escapeHtml(str) {
    return String(str).replace(/[<>&"]/g, t =>
      t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
  }

  // --- Donut chart SVG ---
  function renderDonut(owe, owed) {
    const r = 30, c = 2 * Math.PI * r;
    const total = owe + owed;
    const pctOwe = total ? owe / total : 0;
    const pctOwed = total ? owed / total : 0;
    const startAngle = -90;

    // Pie arc generator
    function arcPath(fraction, color, rotate) {
      const offset = rotate || 0;
      return `<circle r="${r}" cx="38" cy="38" fill="none" stroke="${color}" stroke-width="10"
        stroke-dasharray="${fraction * c},${c}" stroke-linecap="round"
        style="transform:rotate(${startAngle + offset}deg);transform-origin:38px 38px;" />`;
    }

    return `
      <circle r="30" cx="38" cy="38" fill="none" stroke="#f1f8ff" stroke-width="10"/>
      ${arcPath(pctOwed, "#1e88e5")}
      ${arcPath(pctOwe, "#e53935", pctOwed*360)}
      <text x="38" y="44" text-anchor="middle" font-size="19" fill="#1976d2" font-weight="700">${demo.net}</text>
    `;
  }

  // --- Collect friend balance data ---
  const allNames = [...new Set(
    demo.friendsOwe.map(f=>f.name).concat(demo.youOweList.map(f=>f.name))
  )];

  // --- Dashboard HTML ---
  container.innerHTML = `
  <style>
    .db-main {
      max-width: 630px; margin: 32px auto; padding: 2em 1.2em 2.7em;
      background: #fff; border-radius: 1rem; font-family: 'Inter','Segoe UI',Arial,sans-serif; color: #213348;
      box-shadow: 0 10px 30px rgb(37 115 255 / 0.11);
      animation: fadein 0.7s;
    }
    @media (max-width: 700px) { .db-main { max-width: 98vw; padding: 1em 0.3em; } }
    .db-title { font-size:2em; letter-spacing:.01em; margin-top:0; font-weight:800; }
    .db-metric-cards { display: flex; flex-wrap: wrap; gap: 1.2em; margin: 2em 0 1.6em; }
    .db-card {
      flex:1 0 120px; max-width:168px; background:linear-gradient(110deg,#f6faff,#eef2f7);
      border-radius:14px; padding:1.3em 1em 1.1em; text-align:center; box-shadow:0 4px 12px #0000000f;
      color: #34495e; font-size:1.08em; transition: box-shadow .19s; cursor:default;
    }
    .db-card:hover { box-shadow:0 8px 18px #258fff1e }
    .card-label { font-size:.94em; margin-bottom:0.34em; color:#7b90ae; font-weight:600; text-transform:uppercase; }
    .card-val { font-size:1.54em; font-weight:800; color:#18236e; margin-bottom:.1em; letter-spacing:.02em; }
    .animbar { width:89%;height:8px;border-radius:5px;background:#e0e6ee;margin:0.75em auto 0.1em;overflow:hidden; }
    .animfill { height:100%;border-radius:5px;transition:width .7s;background:linear-gradient(90deg,#1e88e5,#42a5f5);}
    .animfill.owe {background:linear-gradient(90deg,#e53935,#ef5350);}
    .animfill.net {background:linear-gradient(90deg,#43a047,#388e3c);}
    .db-section-hdr {
      font-size:1.18em;font-weight:700;color:#256be9;margin:2.7em 0 1em;border-bottom:2px solid #e3f2fd;padding-bottom:0.19em;
    }
    .friend-list-table {
      width:100%;max-width:590px;margin:0 auto 2.1em;background:#f9fafc;border-radius:13px;
      overflow:hidden;box-shadow:0 6px 20px #1e88e51c;border-spacing:0;
    }
    .friend-list-table th,
    .friend-list-table td {
      padding:12px 14px; font-size:1.08em; text-align:left;
    }
    .friend-list-table th { background:#e3f2fd; color:#1976d2; font-weight:700; }
    .friend-list-table tr:nth-child(even) td { background:#f7fbff; }
    .friend-list-table tr:nth-child(odd) td { background:#f0f7fb; }
    .friend-list-table td:first-child { font-weight:700; color:#1672ac; }
    .friend-avatar {display:inline-block;width:28px;height:28px;border-radius:50%;background:#e3f2fd;text-align:center;line-height:28px;font-weight:700;font-size:1em;color:#1976d2;margin-right:7px;}
    .net-pill {
      display:inline-block; border-radius:10px; padding:2px 13px; font-weight:700;
      font-size:1.1em; letter-spacing:.02em;
    }
    .net-pos { background:#e6ffec; color:#1a9448; }
    .net-neg { background:#ffe7ed; color:#d52f2f; }
    .net-zero { background:#ececec; color:#878ead; }
    .db-donut-svg { width:84px;height:84px;vertical-align:-22%;display:inline-block;}
    .db-piewrap {display:flex;align-items:center;margin-bottom:2.6em;gap:1.25em;}
    .db-activity-block { margin:1.3em 0;font-size:1.07em; }
    .db-badge { display:inline-block;border-radius:13px;padding:4px 14px;font-weight:700;font-size:.95em;margin-right:2px; }
    .db-badge.spends {background:#e3f2fd;color:#256be9;}
    .db-badge.top {background:#ffe1e1;color:#e53935;}
    .db-badge.shares {background:#e8ffe5;color:#218c36;}
    .db-badge.settled {background:#eee;color:#546e7a;}
    @keyframes fadein {0%{opacity:0;}100%{opacity:1;}}
  </style>
  <div class="db-main">
    <div class="db-title">Hello, <b>${escapeHtml(user.name||"User")}</b> 👋</div>
    <div style="font-size:1.17em;margin-bottom:1em;color:#234;">
      Your payment and share summary.
    </div>

    <!-- Metric cards -->
    <div class="db-metric-cards">
      <div class="db-card">
        <div class="card-label">Net Position</div>
        <div class="card-val" id="net">${demo.net} QAR</div>
        <div class="animbar"><div class="animfill net" style="width:${Math.min(100,(Math.abs(demo.net)*1.3/demo.paidTotal)*100)}%"></div></div>
      </div>
      <div class="db-card">
        <div class="card-label">Total Paid</div>
        <div class="card-val" id="paid-total">${demo.paidTotal} QAR</div>
        <div class="animbar"><div class="animfill" style="width:88%"></div></div>
      </div>
      <div class="db-card">
        <div class="card-label">You Are Owed</div>
        <div class="card-val" id="owed-total">${demo.owedTotal} QAR</div>
        <div class="animbar"><div class="animfill" style="width:49%"></div></div>
      </div>
      <div class="db-card">
        <div class="card-label">You Owe</div>
        <div class="card-val" id="youowe">${demo.youOwe} QAR</div>
        <div class="animbar"><div class="animfill owe" style="width:31%"></div></div>
      </div>
    </div>

    <!-- Friend Balance Table -->
    <div class="db-section-hdr">Balance with Friends</div>
    <table class="friend-list-table">
      <tr><th></th><th>Friend</th><th>They Owe You</th><th>You Owe</th><th>Net</th></tr>
      ${
        allNames.map(name => {
          const youOweEntry = demo.youOweList.find(x => x.name === name);
          const friendsOweEntry = demo.friendsOwe.find(x => x.name === name);
          const youOweAmt = youOweEntry ? youOweEntry.amount : 0;
          const oweYouAmt = friendsOweEntry ? friendsOweEntry.amount : 0;
          const net = oweYouAmt - youOweAmt;
          const initial = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2);
          let netClass = net > 0 ? "net-pos" : net < 0 ? "net-neg" : "net-zero";
          let netSym = net > 0 ? "+" : net < 0 ? "-" : "";
          return `
          <tr>
            <td><span class="friend-avatar">${initial}</span></td>
            <td>${escapeHtml(name)}</td>
            <td style="color:#1a9448;font-weight:600;">${oweYouAmt} QAR</td>
            <td style="color:#e53935;font-weight:600;">${youOweAmt} QAR</td>
            <td><span class="net-pill ${netClass}">${netSym}${Math.abs(net) || 0}</span></td>
          </tr>`;
        }).join('')
      }
    </table>

    <!-- Pie/Donut chart + summary -->
    <div class="db-section-hdr">Net Share Position</div>
    <div class="db-piewrap">
      <svg class="db-donut-svg" width="76" height="76" viewBox="0 0 76 76">
        ${renderDonut(demo.youOwe, demo.owedTotal)}
      </svg>
      <div>
        <div style="font-size:1.18em;color:#1e88e5;font-weight:600;">Net: ${demo.net >= 0 ? '+' : ''}${demo.net} QAR</div>
        <div style="font-size:1.02em;color:#546e7a;">
          <span style="color:#1e88e5;">Blue</span> = You Are Owed, &nbsp;
          <span style="color:#e53935;">Red</span> = You Owe
        </div>
      </div>
    </div>

    <!-- Activity stats -->
    <div class="db-section-hdr">Your Activity</div>
    <div class="db-activity-block">
      <span class="db-badge spends">Spends: <b>${demo.spends}</b></span>
      <span class="db-badge top">Top Spend: <b>${demo.topSpend} QAR</b></span>
      <span class="db-badge shares">Shares: <b>${demo.shares}</b></span>
      <span class="db-badge settled">Settled: <b>${demo.settled}</b></span>
    </div>
    <div style="margin:2em auto 0 auto;text-align:center;color:#99acd5;font-size:1.09em;">
      <em>Live analytics, history, and reports coming soon.<br>Connect to your group API for real data!</em>
    </div>
  </div>
  `;

  // Animates card values on load
  function animateCounts() {
    ["paid-total","owed-total","youowe","net"].forEach(id=>{
      const el = document.getElementById(id);
      if(el) {
        const v = +el.textContent.replace(/\D/g,'');
        let cur = 0;
        const increment = Math.ceil((v || 1) / 44);
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
}
