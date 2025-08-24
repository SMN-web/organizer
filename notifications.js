import { showSpinner, hideSpinner, delay } from './spinner.js';

export function mountNotifications(parent, user, navigateToTarget) {
  const notifyIcon = parent.querySelector("#notifyIcon");
  const notifyCount = parent.querySelector("#notifyCount");
  let notifications = [];
  const dropdown = document.createElement('div');
  dropdown.id = "notifyDropdown";
  dropdown.style.cssText = "display:none;position:fixed;top:53px;right:17px;min-width:225px;max-width:94vw;background:#fff;border-radius:12px;box-shadow:0 8px 24px #0002;z-index:220;";
  document.body.appendChild(dropdown);

  async function fetchNotifications() {
    if (!user?.firebaseUser) return [];
    showSpinner(document.body);
    const start = Date.now();
    const token = await user.firebaseUser.getIdToken();
    const res = await fetch('https://not-li.nafil-8895-s.workers.dev/api/notifications/list', {
      headers: { Authorization: "Bearer " + token }
    });
    const out = await res.json();
    await delay(Math.max(0, 2000 - (Date.now()-start)));
    hideSpinner(document.body);

    notifications = Array.isArray(out) ? out : [];
    renderBadge();
  }

  function renderBadge() {
    const unread = notifications.filter(n => !n.read).length;
    notifyCount.textContent = unread ? unread : '';
  }

  function renderDropdown() {
    dropdown.innerHTML = notifications.length
      ? notifications.map(n => `
        <div class="notifyItem" style="padding:14px 15px;cursor:pointer;border-bottom:1px solid #eee;background:${!n.read ? '#f4fbfe':'#fff'}"
          data-id="${n.id}" data-type="${n.type}">
          ${n.type === 'friend_request'
            ? `<b>${JSON.parse(n.data).from}</b> sent you a friend request`
            : '<i>Unknown notification</i>'}
        </div>
      `).join('')
      : `<div style="padding:16px;text-align:center;color:#888;">No notifications.</div>`;
  }

  notifyIcon.onclick = async () => {
    await fetchNotifications();
    renderDropdown();
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    setTimeout(() => {
      Array.from(dropdown.querySelectorAll('.notifyItem')).forEach(item => {
        item.onclick = async () => {
          showSpinner(document.body);
          const id = Number(item.dataset.id);
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
          await delay(1000); // quick delay for visual consistency
          notifications = notifications.map(n => n.id === id ? { ...n, read: 1 } : n);
          hideSpinner(document.body);
          renderBadge();
          dropdown.style.display = "none";
          if (typeof navigateToTarget === "function") navigateToTarget(item.dataset.type);
        };
      });
    }, 1);
  };

  document.addEventListener('click', function handler(e) {
    if (!dropdown.contains(e.target) && e.target !== notifyIcon) {
      dropdown.style.display = "none";
    }
  });

  fetchNotifications();
  setInterval(fetchNotifications, 18000); // Refresh badge every 18s
}
