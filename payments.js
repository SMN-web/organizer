export function showPaymentsPanel(container, user) {
  // DEMO DATA for now—replace with real API logic later
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
    .paytabs { display:flex; justify-content:center; gap:2em; margin:2em 0 1em 0;}
    .paytab { font-size:1.19em; cursor:pointer; padding:0.38em 1.7em; border-radius:9px; background:#f7fbfd; border:none; color:#235;}
    .paytab.active { background:#2949e6; color:#fff; font-weight:600; }
    .paylist-table { min-width:260px; width:97%; max-width:430px; margin:0 auto 38px auto; border-radius:13px; background:#fff; box-shadow:0 3px 18px #1b48750c; }
    .paylist-table th, .paylist-table td { text-align:center; padding:11px 7px; }
    .paylist-table tr:nth-child(even) td { background:#f8fcfe; }
    .paylist-table th { background:#ecf4fc; color:#568;}
    .paylist-pending { color:#d4901f; font-weight:500; font-size:1.04em;}
    .paylist-btn { background:#2267e7;color:#fff;font-weight:600;padding:.33em 1.7em; border:none;border-radius:8px;cursor:pointer;margin:0 .2em; }
    .paylist-btn[disabled] { background:#b9c5e9 !important; color:#fff; }
    .paylist-action-row { margin-top:.7em;}
    .pay-amount-input { width:80px; font-size:1.1em; border-radius:6px; border:1.2px solid #d3daf1; margin-left:0.7em; padding:4px 7px 4px 7px;}
    .paylist-label { color:#5481a8; font-weight:400; font-size:1.17em; margin:1.8em 0 .8em 0; }
    .paylist-msg { font-size:1em; margin:.2em 0 .3em 0; }
  </style>
  <div style="max-width:650px;margin:38px auto 0 auto;padding:1.8em 1.2em 1em 1.2em;background:rgba(255,255,255,0.97);border-radius:1.6em;">
    <h2 style="margin-top:-7px;margin-bottom:.8em;font-size:2em;font-weight:700;letter-spacing:.01em;">Payments & Settlements</h2>
    <div class="paytabs">
      <button class="paytab active" id="tab-owe">You Owe</button>
      <button class="paytab" id="tab-receive">To Receive</button>
    </div>
    <div id="paylistOwe">
      <div class="paylist-label">You Owe</div>
      <table class="paylist-table">
        <tr><th>Friend</th><th>Amount</th><th>Status</th><th>Action</th></tr>
        ${
          iOwe.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.amount} QAR</td>
              <td>${
                item.status === 'pending'
                  ? `<span class="paylist-pending">You paid <b>${item.pendingAmount} QAR</b> to ${item.name}, waiting for approval</span>`
                  : `Owe`
              }</td>
              <td>
                ${
                  item.status === 'owe' ?
                  `<button class="paylist-btn pay-btn" data-id="${item.id}">Pay</button>` :
                  `<button class="paylist-btn" disabled>Pay</button>
                   <button class="paylist-btn cancel-btn" data-id="${item.id}">Cancel</button>`
                }
              </td>
            </tr>
            ${item.status === 'owe' ?
              `<tr class="paylist-action-row" id="payinputrow-${item.id}" style="display:none">
                <td colspan="4">
                  <span class="paylist-msg">Enter amount you want to pay to <b>${item.name}</b> (up to <b>${item.amount} QAR</b>):</span>
                  <input type="number" min="1" max="${item.amount}" value="${item.amount}" class="pay-amount-input" id="payinput-${item.id}" />
                  <button class="paylist-btn pay-confirm-btn" data-id="${item.id}">Confirm</button>
                  <button class="paylist-btn pay-cancel-btn" data-id="${item.id}">Close</button>
                </td>
              </tr>` : ""
            }
          `).join('')
        }
      </table>
    </div>
    <div id="paylistReceive" style="display:none;">
      <div class="paylist-label">You Will Receive</div>
      <table class="paylist-table">
        <tr><th>Friend</th><th>Amount</th><th>Status</th><th>Action</th></tr>
        ${
          oweMe.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.amount} QAR</td>
              <td>${
                item.status === 'pending'
                  ? `<span class="paylist-pending"><b>${item.name}</b> paid you <b>${item.pendingAmount} QAR</b>, waiting for your action</span>`
                  : `Owe You`
              }</td>
              <td>
                ${
                  item.status === 'pending'
                  ? `<button class="paylist-btn accept-btn" data-id="${item.id}">Accept</button>
                       <button class="paylist-btn reject-btn" data-id="${item.id}">Reject</button>`
                  : `<button class="paylist-btn" disabled>Awaiting Payment</button>`
                }
              </td>
            </tr>
          `).join('')
        }
      </table>
    </div>
    <div id="payAlert" style="margin-top:1em;color:#cc141a;font-size:1.13em;font-weight:500;"></div>
  </div>
  `;

  // Tabs logic
  container.querySelector("#tab-owe").onclick = () => {
    container.querySelector("#tab-owe").classList.add("active");
    container.querySelector("#tab-receive").classList.remove("active");
    document.getElementById("paylistOwe").style.display = "";
    document.getElementById("paylistReceive").style.display = "none";
  };
  container.querySelector("#tab-receive").onclick = () => {
    container.querySelector("#tab-owe").classList.remove("active");
    container.querySelector("#tab-receive").classList.add("active");
    document.getElementById("paylistOwe").style.display = "none";
    document.getElementById("paylistReceive").style.display = "";
  };

  // Pay button logic
  container.querySelectorAll(".pay-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.id;
      document.getElementById(`payinputrow-${id}`).style.display = "table-row";
    };
  });
  container.querySelectorAll(".pay-cancel-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.id;
      document.getElementById(`payinputrow-${id}`).style.display = "none";
    };
  });
  // Confirm Pay
  container.querySelectorAll(".pay-confirm-btn").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.id;
      const val = document.getElementById(`payinput-${id}`).value;
      container.querySelector("#payAlert").textContent = `You sent a payment request of ${val} QAR. ${iOwe.find(x=>x.id==id).name} will receive a notification to accept or reject.`;
      setTimeout(()=>container.querySelector("#payAlert").textContent="", 3600);
    };
  });
  // Cancel Pending
  container.querySelectorAll(".cancel-btn").forEach(btn=>{
    btn.onclick = ()=>{
      container.querySelector("#payAlert").textContent = `Your pending payment request has been cancelled.`;
      setTimeout(()=>container.querySelector("#payAlert").textContent="", 2600);
    };
  });
  // Accept/Reject
  container.querySelectorAll(".accept-btn").forEach(btn=>{
    btn.onclick = ()=>{
      container.querySelector("#payAlert").textContent = `You accepted the payment! Both sides will be updated, and confirmation sent.`;
      setTimeout(()=>container.querySelector("#payAlert").textContent="", 2600);
    };
  });
  container.querySelectorAll(".reject-btn").forEach(btn=>{
    btn.onclick = ()=>{
      container.querySelector("#payAlert").textContent = `Payment was rejected. The sender will be notified.`;
      setTimeout(()=>container.querySelector("#payAlert").textContent="", 2600);
    };
  });
}
