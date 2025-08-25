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
    dropdown.style.cssText = "display:none;position:fixed;top:53px;right:17px;min-width:225px;max-width:94vw;background:#fff;border-radius:12px;box-shadow:0 8px 24px #0002;z-index:220;";
    document.body.appendChild(dropdown);
    renderingSetupDone = true;

    parent.querySelector("#notifyIcon").onclick = () => {
      renderDropdown();
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      setTimeout(() => {
        Array.from(dropdown.querySelectorAll('.notifyItem')).forEach(item => {
          item.onclick = async () => {
            const id = Number(item.dataset.id);
            const type = item.dataset.type;
            // Show spinner only for friend_request redirect
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
            dropdown.style.display = "none";
            // Only redirect for friend request
            if (typeof navigateToTarget === "function" && type === "friend_request") {
              navigateToTarget(type);
            }
          };
        });
      }, 1);
    };
    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target) && e.target !== parent.querySelector("#notifyIcon")) {
        dropdown.style.display = "none";
      }
    });
  }
  // Actual fetch for badge, once or when you call this
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

function renderBadge() {
  if (!notifyCount) return;
  const unread = notifications.filter(n => !n.read).length;
  notifyCount.textContent = unread ? unread : '';
}

function renderDropdown() {
  dropdown.innerHTML = notifications.length
    ? notifications.map(n => {
        if (n.type === 'friend_request') {
          return `<div class="notifyItem" style="padding:14px 15px;cursor:pointer;border-bottom:1px solid #eee;background:${!n.read ? '#f4fbfe':'#fff'}" data-id="${n.id}" data-type="${n.type}">
            <b>${JSON.parse(n.data).from}</b> sent you a friend request
          </div>`;
        }
        if (n.type === 'friend_accept') {
          return `<div class="notifyItem" style="padding:14px 15px;cursor:pointer;border-bottom:1px solid #eee;background:${!n.read ? '#f4fbfe':'#fff'}" data-id="${n.id}" data-type="${n.type}">
            <b>${JSON.parse(n.data).from}</b> accepted your friend request
          </div>`;
        }
        return `<div class="notifyItem" style="padding:14px 15px;"><i>Unknown notification</i></div>`;
      }).join('')
    : `<div style="padding:16px;text-align:center;color:#888;">No notifications.</div>`;
}
