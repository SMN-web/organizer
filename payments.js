export function showPaymentsPanel(container, user) {
  // Utilities for date grouping
  const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function smartDateLabel(rawDate) {
    const now = new Date();
    const todayStr = now.getDate() + " " + now.toLocaleString('en', { month: "short" });
    const yesterday = new Date(Date.now() - 86400000);
    const yesterdayStr = yesterday.getDate() + " " + yesterday.toLocaleString('en', { month: "short" });
    if (rawDate === todayStr) return "Today";
    if (rawDate === yesterdayStr) return "Yesterday";
    for (let i = 2; i <= 7; ++i) {
      let nd = new Date(Date.now() - i * 86400000);
      if (nd.getDate() + " " + nd.toLocaleString('en', { month: "short" }) === rawDate)
        return DAY_LABELS[nd.getDay()];
    }
    return rawDate;
  }

  // Demo data
  const friends = [
    {
      initials: "RA", name: "Rafseed", net: -70, timeline: [
        { dir: "to", status: "pending", amount: 8, date: "9 Jul", time: "12:01 pm" }
      ]
    },
    // ...more friends can be added here for real testing
  ];

  let view = "user"; // or "friends"
  let current = 0; // which friend is open
  let searchTerm = "";
  let filter = "all";
  let searchHadFocus = false;
  let searchSelection = 0;
  let userTimeline = friends.map(f => f.timeline.map(row => ({ ...row })));

  function netPill(net) {
    if (net === 0) return `<span class="net-pill settled">Settled</span>`;
    return `<span class="net-pill ${net > 0 ? "plus" : "minus"}">${Math.abs(net)} QAR</span>`;
  }
  function statusPill(status) {
    if (status === "pending") return `<span class="status-pill pending">Pending</span>`;
    if (status === "accepted") return `<span class="status-pill accepted">Accepted</span>`;
    if (status === "rejected") return `<span class="status-pill rejected">Rejected</span>`;
    return "";
  }

  function render() {
    if (view === "user") {
      const friend = friends[current];
      const timeline = userTimeline[current];
      let lastDate = "";
      container.innerHTML = `
        <div class="paypage-wrap">
          <div class="paypage-padding-top"></div>
          <div class="paypage-header-row paypage-header-extra-pad">
            <button class="paypage-back">&larr;</button>
            <span class="paypage-avatar user">${friend.initials}</span>
            <span class="paypage-username user">${friend.name}</span>
            ${netPill(friend.net)}
            <button class="paypage-more-btn" aria-label="Options">&#8942;</button>
          </div>
          <div class="user-header-divider"></div>
          <div class="paypage-chat">
            ${timeline.map((ev, idx) => {
              let datedisplay = "";
              if (ev.date !== lastDate) {
                datedisplay = `<div class="pay-date-header">${smartDateLabel(ev.date)}</div>`;
                lastDate = ev.date;
              }
              return `
                ${datedisplay}
                <div class="paypage-bubble-row ${ev.dir === "from" ? "bubble-left" : "bubble-right"}">
                  <div class="paypage-bubble ${ev.dir === "from" ? "bubble-recv" : "bubble-send"}">
                    <div>
                      <span class="bubble-amt ${ev.dir==="from"?"amt-recv":"amt-send"}">${ev.amount} QAR</span>
                      <span class="bubble-label">${ev.dir==="from"?"Received":"Paid"}</span>
                      ${
                        ev.status !== "pending"
                          ? statusPill(ev.status)
                          : (ev.dir === "from")
                            ? `<button class="bubble-accept" data-idx="${idx}">Accept</button>
                               <button class="bubble-reject" data-idx="${idx}">Reject</button>`
                            : statusPill("pending")
                      }
                    </div>
                    <div class="bubble-meta">
                      <span>${ev.time}</span>
                      ${ev.dir === "to" && ev.status === "pending"
                        ? `<button class="bubble-cancel" data-idx="${idx}">Cancel</button>` : ""}
                    </div>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
          <div class="paypage-actionsbar">
            <button class="paypage-btn pay">Pay</button>
            <button class="paypage-btn remind">Remind</button>
          </div>
        </div>
      `;

      container.querySelector('.paypage-back').onclick = () => { view = "friends"; render(); };
      container.querySelectorAll('.paypage-more-btn').forEach(btn => btn.onclick = () => alert("More options (demo)"));
      container.querySelectorAll('.bubble-accept').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.idx);
          userTimeline[current][idx].status = "accepted";
          render();
        }
      });
      container.querySelectorAll('.bubble-reject').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.idx);
          userTimeline[current][idx].status = "rejected";
          render();
        }
      });
      container.querySelectorAll('.bubble-cancel').forEach(btn =>
        btn.onclick = () => {
          const idx = Number(btn.dataset.idx);
          userTimeline[current][idx].status = "rejected";
          render();
        }
      );
      container.querySelector('.paypage-btn.pay').onclick = () => alert("Pay (demo)");
      container.querySelector('.paypage-btn.remind').onclick = () => alert("Remind (demo)");
    }
    // ...friend list view logic omitted for brevity, see previous examples
  }
  render();
}
