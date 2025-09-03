import { showSpinner, hideSpinner, delay } from './spinner.js';

let notifications = [];
let notifyCount;
let dropdown;
let renderingSetupDone = false;

function timeAgo(dateStr) {
  const then = parseDBDatetimeAsUTC(dateStr);
  const now = new Date();
  const seconds = Math.floor((now - then) / 1000);
  if (isNaN(seconds)) return "";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
function parseDBDatetimeAsUTC(dt) {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return new Date(dt);
  return new Date(Date.UTC(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]));
}
function escapeHtml(str) {
  return String(str).replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

export async function fetchNotificationsBadge(user, parent) {
  if (!user?.firebaseUser) return;
  if (!renderingSetupDone) {
    notifyCount = parent.querySelector("#notifyCount");
    dropdown = document.createElement('div');
    dropdown.id = "notifyDropdown";
    dropdown.style.cssText = `
      display:none;position:fixed;top:65px;right:16px;
      min-width:312px;max-width:96vw;
      background:#f6f9fb;border-radius:20px;box-shadow:0 8px 32px #0c22573a,0 2px 7px #0c225710;
      z-index:400;overflow:hidden;padding:0.5em 0.2em 0.7em 0.2em;
      border:1px solid #daefff;transform:translateY(-14px) scale(.98);opacity:0.01;
      transition:opacity .22s cubic-bezier(.5,.6,.4,1),transform .21s cubic-bezier(.5,1.4,.45,1.05);`;
    document.body.appendChild(dropdown);
    renderingSetupDone = true;
    parent.querySelector("#notifyIcon").onclick = () => {
      renderDropdown();
      if (dropdown.style.display === "block") {
        dropdown.style.opacity = "0.01";
        dropdown.style.transform = "translateY(-14px) scale(.98)";
        setTimeout(() => dropdown.style.display = "none", 135);
      } else {
        dropdown.style.display = "block";
        setTimeout(() => {
          dropdown.style.opacity = "1";
          dropdown.style.transform = "translateY(0) scale(1)";
        }, 4);
      }
      setTimeout(() => {
        Array.from(dropdown.querySelectorAll('.notifyItem')).forEach(item => {
          item.onclick = async () => {
            const id = Number(item.dataset.id);
            const type = item.dataset.type;
            if (user?.firebaseUser) {
              const token = await user.firebaseUser.getIdToken();
              await fetch('https://not-li.nafil-8895-s.workers.dev/api/notifications/read', {
                method: "POST",
                headers: {
                  "Authorization": "Bearer " + token,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({ id })
              });
            }
            notifications = notifications.map(n => n.id === id ? { ...n, read: 1 } : n);
            renderBadge();
            dropdown.style.opacity = "0.01";
            dropdown.style.transform = "translateY(-12px) scale(.99)";
            setTimeout(() => dropdown.style.display = "none", 120);
            if (typeof window._notificationRedirect === "function") window._notificationRedirect(type);
          };
        });
      }, 12);
    };
    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target) && e.target !== parent.querySelector("#notifyIcon")) {
        dropdown.style.opacity = "0.01";
        dropdown.style.transform = "translateY(-14px) scale(.98)";
        setTimeout(() => dropdown.style.display = "none", 135);
      }
    });
  }
  showSpinner(document.body);
  try {
    const start = Date.now();
    const token = await user.firebaseUser.getIdToken();
    const res = await fetch('https://not-li.nafil-8895-s.workers.dev/api/notifications/list', {
      headers: { Authorization: "Bearer " + token }
    });
    const out = await res.json();
    await delay(Math.max(0, 700 - (Date.now() - start))); // snappy UX but not jumpy
    notifications = Array.isArray(out) ? out : [];
    renderBadge();
  } catch (e) {
    notifications = [];
    renderBadge();
  } finally {
    hideSpinner(document.body);
  }
}

function renderBadge() {
  if (!notifyCount) return;
  const unread = Array.isArray(notifications)
    ? notifications.filter(n => !n.read).length : 0;
  notifyCount.textContent = unread > 0 ? unread : '';
}

function renderDropdown() {
  dropdown.innerHTML = `
    <div style="padding:3px 0 7px 0;">
    ${
      notifications.length
      ? notifications.map((n, i) => {
          const isUnread = !n.read;
          let dat = {};
          try { dat = JSON.parse(n.data || '{}'); } catch { dat = {}; }
          let mainLine = ""; // what user sees
          let badge = "";    // right-side badge
          let amtHtml = "";  // colored value/currency
          let extra = "";    // extra lines for awaiting/conflict

          // Types: payment notifications get extra style
          if (n.type === 'payment_new') {
            amtHtml = `<span class="amount-value awaiting">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>`;
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> sent you a payment request of ${amtHtml}.`;
            badge = `<span class="notif-badge notif-badge-awaiting">Awaiting your confirmation</span>`;
          } else if (n.type === 'payment_accept') {
            amtHtml = `<span class="amount-value accepted">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>`;
            mainLine = `<b class="notify-name">${escapeHtml(dat.by)}</b> <span class="notif-action accept">accepted</span> your payment of ${amtHtml}.`;
            badge = `<span class="notif-badge notif-badge-accept">Accepted</span>`;
          } else if (n.type === 'payment_reject') {
            amtHtml = `<span class="amount-value rejected">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>`;
            mainLine = `<b class="notify-name">${escapeHtml(dat.by)}</b> <span class="notif-action reject">rejected</span> your payment of ${amtHtml}.`;
            badge = `<span class="notif-badge notif-badge-reject">Rejected</span>`;
          } else if (n.type === 'friend_request') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> sent you a friend request.`;
          } else if (n.type === 'friend_accept') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> accepted your friend request.`;
          } else if (n.type === 'expense_new') {
            amtHtml = `<span class="amount-value awaiting">${escapeHtml(dat.share)} QAR</span>`;
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> added an expense: <b>"${escapeHtml(dat.remarks)}"</b>. Your share: ${amtHtml}.`;
            badge = `<span class="notif-badge notif-badge-awaiting">Awaiting your confirmation</span>`;
          } else if (n.type === 'expense_approval_accepted') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> accepted your expense: <b>"${escapeHtml(dat.remarks)}"</b>.`;
            badge = `<span class="notif-badge notif-badge-accept">Accepted</span>`;
          } else if (n.type === 'expense_approval_disputed') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> <span class="notif-action reject">disputed</span> the expense <b>"${escapeHtml(dat.remarks)}"</b>.`;
            badge = `<span class="notif-badge notif-badge-reject">Disputed</span>`;
            extra = `<span style="color:#ab2222;font-size:.97em;font-weight:500;">Requires your attention.</span>`;
          } else if (n.type === 'expense_approval_fully_accepted') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> reported the dispute resolved on expense: <b>"${escapeHtml(dat.remarks)}"</b>.`;
            badge = `<span class="notif-badge notif-badge-accept">Resolved</span>`;
            extra = `<span style="color:#277e43;font-size:.97em;font-weight:500;">Awaiting your confirmation.</span>`;
          } else {
            mainLine = `<span style="color:#647096">Unknown notification</span>`;
          }

          const timeBadge = n.created_at
            ? `<span class="notif-time">${timeAgo(n.created_at)}</span>` : "";

          return `
          <div class="notifyItem notif-card" style="${isUnread ? "background:#f5faff;" : "background:#fff;"}" data-id="${n.id}" data-type="${n.type}">
            <div class="notif-card-main">
              <div>
                ${mainLine} ${extra}
                <div style="margin-top:4px;">${badge}</div>
              </div>
              <div class="notif-card-right">
                ${timeBadge}
              </div>
            </div>
          </div>`;
        }).join("")
      : `<div style="padding:38px 7px 36px 7px;text-align:center;color:#9aa;font-size:1.07em;">No notifications.</div>`
    }
    </div>
    <style>
      .notif-card { margin: 0.7em 1em 0.2em 1em; border-radius: 12px; box-shadow: 0 2px 14px #13216911; padding: 12px 13px 9px 13px; display: flex; align-items: flex-start;}
      .notif-card-main { flex: 1; display: flex; flex-direction: row; justify-content: space-between;}
      .notif-name { font-weight: 700; color: #213259;}
      .notif-badge { font-size: .90em; display: inline-block; margin-top:2px; margin-right:10px; vertical-align:middle; border-radius:6px; padding:1px 9px; font-weight:600;}
      .notif-badge-awaiting { background: #ffe9c1; color: #bb7b07;}
      .notif-badge-accept { background: #dcfddb; color: #22923a;}
      .notif-badge-reject { background: #ffe4e2; color: #da3030;}
      .notif-time { color:#8e99a6; font-size:.96em; white-space:nowrap; margin-left: 0.7em;}
      .amount-value { font-weight:700; letter-spacing:.01em;}
      .amount-value.accepted { color:#22923a; }
      .amount-value.awaiting { color:#bb7b07; }
      .amount-value.rejected { color:#c32919; }
      .notif-action.accept { color: #22923a; font-weight:600;}
      .notif-action.reject { color: #bb0f27; font-weight:600;}
      .notif-card:hover { background:#f1f7fe !important; box-shadow: 0 3px 24px #1372be16; }
      .notifyItem { cursor:pointer; }
    </style>
  `;
}

export function mountNotifications(parent, user, notificationRedirectCallback) {
  window._notificationRedirect = notificationRedirectCallback;
  fetchNotificationsBadge(user, parent);
}
