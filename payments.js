export function showPaymentsPanel(container, user) {
  // Demo data (replace with live data/API later)
  const iOwe = [
    { id: 1, name: "Rafseed", amount: 70, status: "owe" },
    { id: 2, name: "Bala", amount: 30, status: "pending", pendingAmount: 30 }
  ];
  const oweMe = [
    { id: 3, name: "Shyam", amount: 55, status: "pending", pendingAmount: 25 },
    { id: 4, name: "Sreerag", amount: 36, status: "owe" }
  ];

  container.innerHTML = `
  <style>
    .pm-main {max-width:510px; margin:42px auto 0 auto; background:#f8fafc; border-radius:16px; box-shadow:0 3px 19px #8abbb220; padding:1.75em 0.7em 2.1em 0.7em; font-family: 'Inter',Arial,sans-serif;}
    .pm-hdr {font-size:1.36em; font-weight:700; color:#244; letter-spacing:.01em; margin-bottom:.6em;}
    .pm-tabs { display:flex; margin:1.4em 0 1.3em 0; }
    .pm-tab { flex:1; border-radius:8px 8px 0 0; padding:.52em 0; background:#eff2f8; color:#326; font-weight:500; text-align:center; cursor:pointer; box-shadow:0 1.5px 0 #eaeef3;}
    .pm-tab.active { background:#3466ea; color:#fff; font-weight:600; box-shadow: 0 2.7px 0 #3466ea;}
    .pm-table-wrap { background:white; border-radius:0 0 13px 13px; box-shadow:0 3px 17px #b4e1e208; padding:.2em 0.4em 0.9em 0.4em;}
    table.pm-table {width:100%;font-size:1.00em;border-collapse:separate;border-spacing:0;}
    .pm-table th,.pm-table td { text-align:center; padding:8px 2.5px; min-width:58px;}
    .pm-table th { background:#f3f5fa; color:#567; border-radius:0;}
    .pm-table td { color:#2d3752; }
    .pm-table tr:not(:last-child) td { border-bottom:1px solid #f2f4fa; }
    .pm-pending { color:#b57915; font-weight:500; font-size:.98em; line-height:1.2;}
    .pm-paybtn, .pm-btn { background:#2d66ea; color:#fff; border:none; border-radius:6px; padding:0.42em 1.15em; font-weight:600; margin:0 2px; cursor:pointer; font-size:.99em; transition:box-shadow .13s;}
    .pm-paybtn[disabled], .pm-btn[disabled] {background:#b7c5e3;color:#fff;}
    .pm-paybtn:hover:not([disabled]), .pm-btn:hover:not([disabled]) { box-shadow:0 1.5px 4px #8af2ee29;}
    .pm-payinpt { width:57px; font-size:.99em; border-radius:6px; border:1.2px solid #c6d1e9; margin-left:.36em; padding:4px 6px;}
    .pm-actbox { display:flex;justify-content:center;gap:0.7em; }
    .pm-msg { margin:0.9em 0 0 0; color:#a52438; font-size:1.08em; min-height:1.6em;}
    .pm-label { color:#5481a8; font-weight:400; font-size:1.04em; text-align:left; margin:1.13em 0 0.23em 0; }
    @media (max-width:560px) {
      .pm-main { max-width:98vw; padding:1em 0.1em 1.2em 0.1em;}
      .pm-hdr {font-size:1.14em;}
      .pm-paybtn, .pm-btn {font-size:.95em; padding:0.32em 0.7em;}
      .pm-label {font-size:.96em;}
      table.pm-table { font-size:.97em;}
    }
  </style>
  <div class="pm-main">
    <div class="pm-hdr">Payments & Settlements</div>
    <div class="pm-tabs">
      <div class="pm-tab active" id="pm-tab-owe">You Owe</div>
      <div class="pm-tab" id="pm-tab-receive">To Receive</div>
    </div>
    <div id="pm-section-owe">
      <div class="pm-label">You Owe</div>
      <div class="pm-table-wrap">
        <table class="pm-table">
          <tr><th>Friend</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          ${
            iOwe.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.amount} QAR</td>
                <td>
                  ${
                    item.status === 'pending'
                      ? `<span class="pm-pending">You paid <b>${item.pendingAmount} QAR</b> to ${item.name}, waiting for approval</span>`
                      : `Owe`
                  }
                </td>
                <td class="pm-actbox">
                  ${
                    item.status === 'owe'
                    ? `<button class="pm-paybtn pm-pay-btn" data-id="${item.id}">Pay</button>`
                    : `<button class="pm-btn" disabled>Pay</button>
                       <button class="pm-btn pm-cancel-btn" data-id="${item.id}">Cancel</button>`
                  }
                </td>
              </tr>
              ${item.status === 'owe' ?
                `<tr id="pm-payinptrow-${item.id}" style="display:none;">
                  <td colspan="4" style="text-align:left;">
                    <span style="font-size:.96em;">Pay to <b>${item.name}</b> (max <b>${item.amount} QAR</b>):</span>
                    <input type="number" min="1" max="${item.amount}" value="${item.amount}" class="pm-payinpt" id="pm-payinpt-${item.id}" />
                    <button class="pm-btn pm-pay-confirm-btn" data-id="${item.id}">Confirm</button>
                    <button class="pm-btn pm-pay-cancel-btn" data-id="${item.id}">Close</button>
                  </td>
                </tr>` : ""
              }
            `).join('')
          }
        </table>
      </div>
    </div>
    <div id="pm-section-receive" style="display:none;">
      <div class="pm-label">You Will Receive</div>
      <div class="pm-table-wrap">
        <table class="pm-table">
          <tr><th>Friend</th><th>Amount</th><th>Status</th><th>Action</th></tr>
          ${
            oweMe.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.amount} QAR</td>
                <td>
                  ${
                    item.status === 'pending'
                      ? `<span class="pm-pending">${item.name} paid you <b>${item.pendingAmount} QAR</b>, waiting for your action</span>`
                      : `Owe You`
                  }
                </td>
                <td class="pm-actbox">
                  ${
                    item.status === 'pending'
                    ? `<button class="pm-btn pm-accept-btn" data-id="${item.id}">Accept</button>
                         <button class="pm-btn pm-reject-btn" data-id="${item.id}">Reject</button>`
                    : `<button class="pm-btn" disabled>Awaiting Payment</button>`
                  }
                </td>
              </tr>
            `).join('')
          }
        </table>
      </div>
    </div>
    <div class="pm-msg" id="pm-msg"></div>
  </div>
  `;

  // Tabs
  container.querySelector("#pm-tab-owe").onclick = () => {
    container.querySelector("#pm-tab-owe").classList.add("active");
    container.querySelector("#pm-tab-receive").classList.remove("active");
    document.getElementById("pm-section-owe").style.display = "";
    document.getElementById("pm-section-receive").style.display = "none";
  };
  container.querySelector("#pm-tab-receive").onclick = () => {
    container.querySelector("#pm-tab-owe").classList.remove("active");
    container.querySelector("#pm-tab-receive").classList.add("active");
    document.getElementById("pm-section-owe").style.display = "none";
    document.getElementById("pm-section-receive").style.display = "";
  };

  // Pay, Accept, Etc Buttons
  // Show amount input row
  container.querySelectorAll(".pm-pay-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.getElementById(`pm-payinptrow-${btn.dataset.id}`).style.display = "";
    };
  });
  container.querySelectorAll(".pm-pay-cancel-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.getElementById(`pm-payinptrow-${btn.dataset.id}`).style.display = "none";
    };
  });
  container.querySelectorAll(".pm-pay-confirm-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.id;
      const val = document.getElementById(`pm-payinpt-${id}`).value;
      document.getElementById("pm-msg").textContent = `You requested ${val} QAR payment approval. ${iOwe.find(x=>x.id==id).name} will be notified.`;
      setTimeout(()=>document.getElementById("pm-msg").textContent="", 3300);
    };
  });
  container.querySelectorAll(".pm-cancel-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.getElementById("pm-msg").textContent = `Your pending payment was cancelled.`;
      setTimeout(()=>document.getElementById("pm-msg").textContent="", 2500);
    };
  });
  container.querySelectorAll(".pm-accept-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.getElementById("pm-msg").textContent = `Payment accepted! Updates and notifications sent.`;
      setTimeout(()=>document.getElementById("pm-msg").textContent="", 2500);
    };
  });
  container.querySelectorAll(".pm-reject-btn").forEach(btn=>{
    btn.onclick = ()=>{
      document.getElementById("pm-msg").textContent = `Payment rejected. The sender will be notified.`;
      setTimeout(()=>document.getElementById("pm-msg").textContent="", 2500);
    };
  });
}
