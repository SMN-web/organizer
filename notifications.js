import { showSpinner, hideSpinner, delay } from './spinner.js';

let notifications = [];
let notifyCount;
let dropdown;
let renderingSetupDone = false;

// Helpers
function nameToColor(name) {
  const colors = [
    "#A569BD", "#5DADE2", "#48C9B0", "#58D68D", "#F4D03F",
    "#DC7633", "#AF7AC5", "#76D7C4", "#F7CA18", "#EC7063",
    "#85929E", "#BB8FCE", "#45B39D", "#F8C471", "#C39BD3"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
function initials(name) {
  if (!name) return "";
  return name.trim().split(/\s+/).map(n => n[0]).join('').substring(0,2).toUpperCase();
}
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
function notificationTypeIcon(type) {
  // Uniform icon style for all notifications now
  return `<span class="notify-icon"><i class="fa fa-bell"></i></span>`;
}

function renderDropdown() {
  dropdown.innerHTML = `
    <div class="notify-scroll-area">
    ${
      notifications.length
      ? notifications.map((n) => {
          const isUnread = !n.read;
          let dat = {};
          try { dat = JSON.parse(n.data || '{}'); } catch { dat = {}; }
          let mainLine = "";
          // All notifications styled unified way
          if (n.type === 'payment_new') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.from)}</span>
              <span class="notify-details">sent you a payment request for <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>.
              <span class="notify-awaiting">Awaiting your confirmation.</span></span>`;
          } else if (n.type === 'payment_accept') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.by)}</span>
              <span class="notify-details">accepted your payment of <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>.</span>`;
          } else if (n.type === 'payment_reject') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.by)}</span>
              <span class="notify-details">rejected your payment of <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span>.</span>`;
          } else if (n.type === 'friend_request') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.from || dat.sender_name)}</span>
              <span class="notify-details">sent you a friend request.</span>`;
          } else if (n.type === 'friend_accept') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.from || dat.sender_name)}</span>
              <span class="notify-details">accepted your friend request.</span>`;
          } else if (n.type === 'expense_new') {
            mainLine =
              `<span class="notify-title">${escapeHtml(dat.from)}</span>
               <span class="notify-details">added an expense: "<b>${escapeHtml(dat.remarks)}</b>" for <span class="notify-amount">${escapeHtml(dat.total)} QAR</span>.<br>
               Your share: <span class="notify-amount">${escapeHtml(dat.share)}</span> QAR.<span class="notify-awaiting">Awaiting your confirmation.</span></span>`;
          } else if (n.type === 'expense_approval_accepted') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.from)}</span>
              <span class="notify-details">accepted your expense: "<b>${escapeHtml(dat.remarks)}</b>".</span>`;
          } else if (n.type === 'expense_approval_disputed') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.from)}</span>
              <span class="notify-details">disputed the expense "<b>${escapeHtml(dat.remarks)}</b>".</span>`;
          } else if (n.type === 'expense_approval_fully_accepted') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.from)}</span>
              <span class="notify-details">reported the dispute resolved on expense: "<b>${escapeHtml(dat.remarks)}</b>".<span class="notify-awaiting">Awaiting your confirmation.</span></span>`;
          } else if (n.type === 'transfer_send_pending') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.sender_name)}</span>
              <span class="notify-details">initiated a transfer of <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span> from <b>${escapeHtml(dat.from_name)}</b> to <b>${escapeHtml(dat.to_name)}</b>.<span class="notify-awaiting">Awaiting your confirmation.</span></span>`;
          } else if (n.type === 'transfer_accepted') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.sender_name)}</span>
              <span class="notify-details">accepted the transfer of <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span> from <b>${escapeHtml(dat.from_name)}</b> to <b>${escapeHtml(dat.to_name)}</b>.</span>`;
          } else if (n.type === 'transfer_rejected') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.sender_name)}</span>
              <span class="notify-details">rejected the transfer of <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span> from <b>${escapeHtml(dat.from_name)}</b> to <b>${escapeHtml(dat.to_name)}</b>.</span>`;
          } else if (n.type === 'transfer_cancelled') {
            mainLine = `<span class="notify-title">${escapeHtml(dat.sender_name)}</span>
              <span class="notify-details">cancelled the transfer of <span class="notify-amount">${escapeHtml(dat.amount)} ${escapeHtml(dat.currency)}</span> from <b>${escapeHtml(dat.from_name)}</b> to <b>${escapeHtml(dat.to_name)}</b>.</span>`;
          }
          if (!mainLine) mainLine = `<i style="color:#a7a9ae;">Unknown notification</i>`;
          const initialsBadge = `<span class="notify-avatar" style="background:${nameToColor(dat.sender_name || dat.from || "")};">${initials(dat.sender_name || dat.from || "")}</span>`;
          const timeBadge = n.created_at
            ? `<span class="notify-time">${timeAgo(n.created_at)}</span>` : "";
          return `
            <div class="notifyItem${isUnread ? ' unread' : ''}" data-id="${n.id}" data-type="${n.type}">
              ${notificationTypeIcon(n.type)}
              ${initialsBadge}
              <div class="notify-content">
                ${mainLine}
                <div>${timeBadge}</div>
              </div>
            </div>`;
        }).join("")
      : `<div class="empty">No notifications.</div>`
    }
    </div>
  `;
}

export async function fetchNotificationsBadge(user, parent) {
  if (!user?.firebaseUser) return;
  if (!renderingSetupDone) {
    notifyCount = parent.querySelector("#notifyCount");
    dropdown = document.createElement('div');
    dropdown.id = "notifyDropdown";
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

export function mountNotifications(parent, user, notificationRedirectCallback) {
  window._notificationRedirect = notificationRedirectCallback;
  fetchNotificationsBadge(user, parent);
}
