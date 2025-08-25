import { showSpinner, hideSpinner, delay } from './spinner.js';

let notifications = [];
let notifyCount;
let dropdown;
let renderingSetupDone = false;

export async function fetchNotificationsBadge(user, parent) {
  if (!user?.firebaseUser) return;

  if (!renderingSetupDone) {
    notifyCount = parent.querySelector("#notifyCount");
    dropdown = document.createElement('div');
    dropdown.id = "notifyDropdown";
    dropdown.style.cssText = `
      display:none;
      position:fixed;
      top:65px; right:22px;
      min-width:272px; max-width:96vw;
      background:#fff;
      border-radius:17px;
      box-shadow:0 8px 36px #0003, 0 2px 7px #0001;
      z-index:220;
      overflow:hidden;
      transform:translateY(-12px) scale(.99);
      opacity:0.01;
      transition:opacity .18s cubic-bezier(.5,.6,.4,1),transform .22s cubic-bezier(.5,1.4,.45,1.05);
    `;
    document.body.appendChild(dropdown);
    renderingSetupDone = true;

    // Accepts a callback in mountNotifications signature below!
    parent.querySelector("#notifyIcon").onclick = () => {
      renderDropdown();
      if (dropdown.style.display === "block") {
        dropdown.style.opacity = "0.01";
        dropdown.style.transform = "translateY(-12px) scale(.99)";
        setTimeout(() => dropdown.style.display = "none", 120);
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

            if (type === "friend_request") showSpinner(document.body);
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
            if (type === "friend_request") await delay(500);
            notifications = notifications.map(n => n.id === id ? { ...n, read: 1 } : n);
            if (type === "friend_request") hideSpinner(document.body);
            renderBadge();
            dropdown.style.opacity = "0.01";
            dropdown.style.transform = "translateY(-12px) scale(.99)";
            setTimeout(() => dropdown.style.display = "none", 120);

            // Only friend_request redirects to Inbox tab, using supplied callback
            if (typeof window._notificationRedirect === "function" && type === "friend_request") {
              window._notificationRedirect(type);
            }
          };
        });
      }, 12);
    };

    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target) && e.target !== parent.querySelector("#notifyIcon")) {
        dropdown.style.opacity = "0.01";
        dropdown.style.transform = "translateY(-12px) scale(.99)";
        setTimeout(() => dropdown.style.display = "none", 120);
      }
    });
  }

  showSpinner(document.body);
  const start = Date.now();
  const token = await user.firebaseUser.getIdToken();
  const res = await fetch('https://not-li.nafil-8895-s.workers.dev/api/notifications/list', {
    headers: { Authorization: "Bearer " + token }
  });
  const out = await res.json();
  await delay(Math.max(0, 2000 - (Date.now() - start)));
  hideSpinner(document.body);
  notifications = Array.isArray(out) ? out : [];
  renderBadge();
}

// Helper to update badge
function renderBadge() {
  if (!notifyCount) return;
  const unread = notifications.filter(n => !n.read).length;
  notifyCount.textContent = unread ? unread : '';
}

// Helper to render dropdown
function renderDropdown() {
  dropdown.innerHTML = notifications.length
    ? notifications.map((n, i) => {
        const isUnread = !n.read;
        const dark = "#23272c";
        const mid = "#556070";
        const bgUnread = "linear-gradient(90deg,#f0f6fa 0%,#e9f1ff 100%)";
        const bgRead = "#fafbfc";
        const fontWeight = isUnread ? 600 : 400;
        const fadeIn = `animation:ndropfade .32s cubic-bezier(.23,1,.29,1.01) both;animation-delay:${i*0.019}s;`;

        let text = "";
        if (n.type === 'friend_request') {
          text = `<b style="font-weight:700;">${escapeHtml(JSON.parse(n.data).from)}</b> sent you a friend request`;
        }
        if (n.type === 'friend_accept') {
          text = `<b style="font-weight:700;">${escapeHtml(JSON.parse(n.data).from)}</b> accepted your friend request`;
        }
        if (!text) text = `<i style="color:#a7a9ae;">Unknown notification</i>`;
        return `<div class="notifyItem" style="
          transition:background .16s,box-shadow .13s;
          ${isUnread ? `background:${bgUnread};color:${dark}` : `background:${bgRead};color:${mid}`};
          font-weight:${fontWeight};font-size:1em;
          padding:15px 19px 12px 19px;cursor:pointer;border-bottom:1px solid #e5ebf2;
          border-radius:${i===0 ? "17px 17px 0 0":"0"};
          ${fadeIn}
        " data-id="${n.id}" data-type="${n.type}">
          <span>${text}</span>
        </div>`;
      }).join('') +
      `<style>
      @keyframes ndropfade {0%{transform:translateY(-18px) scale(.93);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
      .notifyItem:hover {background: linear-gradient(90deg,#dbe5f7 0%,#e3ecfa 84%) !important;border-radius:14px;}
      </style>`
    : `<div style="padding:35px 7px 32px 7px;text-align:center;color:#9aa;">No notifications.</div>`;
}

function escapeHtml(str) {
  return String(str).replace(/[<>&"]/g, t =>
    t === "<" ? "&lt;" : t === ">" ? "&gt;" : t === "&" ? "&amp;" : "&quot;");
}

// Mount notifications: set up redirect logic globally so dropdown's click handler can access it
export function mountNotifications(parent, user, notificationRedirectCallback) {
  window._notificationRedirect = notificationRedirectCallback;
  fetchNotificationsBadge(user, parent);
}
