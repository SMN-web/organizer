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
    await delay(Math.max(0, 700 - (Date.now() - start)));
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
          let mainLine = ""; let extra = ""; // what user sees, optional
          // Payment Notifications: three cases only
          if (n.type === 'payment_new') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.from)}</b> sent you a payment request for <span style="color:#227b2d;font-weight:700;">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>. <span style="color:#cf9901;font-weight:600;">Awaiting your confirmation.</span>`;
          } else if (n.type === 'payment_accept') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.by)}</b> accepted your payment of <span style="color:#1b2d7b;font-weight:700;">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>.`;
          } else if (n.type === 'payment_reject') {
            mainLine = `<b class="notify-name">${escapeHtml(dat.by)}</b> rejected your payment of <span style="color:#a82020;font-weight:700;">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>.`;
          }

          // Existing notification types: unchanged
          else if (n.type === 'friend_request') {
            mainLine = `<b style="font-weight:700;">${escapeHtml(dat.from)}</b> sent you a friend request`;
          } else if (n.type === 'friend_accept') {
            mainLine = `<b style="font-weight:700;">${escapeHtml(dat.from)}</b> accepted your friend request`;
          } else if (n.type === 'expense_new') {
            mainLine =
              `<b style="font-weight:700;">${escapeHtml(dat.from)}</b> added an expense: `
              + `"${escapeHtml(dat.remarks)}" for <b>${escapeHtml(dat.total)} QAR</b>.<br>`
              + `Your share: <b>${escapeHtml(dat.share)}</b> QAR. `
              + `<span style="color:#3a6;font-weight:600;">Awaiting your confirmation.</span>`;
          } else if (n.type === 'expense_approval_accepted') {
            mainLine =
              `<b style="font-weight:700;">${escapeHtml(dat.from)}</b> accepted your expense: `
              + `"${escapeHtml(dat.remarks)}".`;
          } else if (n.type === 'expense_approval_disputed') {
            mainLine =
              `<b style="font-weight:700;">${escapeHtml(dat.from)}</b> disputed the expense `
              + `"${escapeHtml(dat.remarks)}". <span style="color:#db4646;font-weight:600;">Requires your attention.</span>`;
          } else if (n.type === 'expense_approval_fully_accepted') {
            mainLine =
              `<b style="font-weight:700;">${escapeHtml(dat.from)}</b> reported the dispute resolved on expense: `
                + `"${escapeHtml(dat.remarks)}". <span style="color:#2a974e;font-weight:600;">Awaiting your confirmation.</span>`;
          }
          if (!mainLine) mainLine = `<i style="color:#a7a9ae;">Unknown notification</i>`;
          const timeBadge = n.created_at
            ? `<span class="notif-time">${timeAgo(n.created_at)}</span>` : "";
          return `
            <div class="notifyItem notif-card" style="${isUnread ? "background:#f4faff;" : "background:#fff;"}" data-id="${n.id}" data-type="${n.type}">
              <div class="notif-card-main">
                <div>
                  ${mainLine}
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
      .notif-time { color:#8e99a6; font-size:.96em; white-space:nowrap; margin-left: 0.7em;}
      .notify-name { font-weight:700; color:#233372; }
      .notif-card:hover { background:#f1f7fe !important; box-shadow: 0 3px 24px #1372be16; }
      .notifyItem { cursor:pointer; }
    </style>
  `;
}

export function mountNotifications(parent, user, notificationRedirectCallback) {
  window._notificationRedirect = notificationRedirectCallback;
  fetchNotificationsBadge(user, parent);
}
