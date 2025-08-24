export function setupNotificationsUIDemo(container, jumpToInboxHandler) {
  // In-memory notification list for demo
  let notifications = [{
    id: 1,
    type: 'friend_request',
    data: JSON.stringify({ from: 'Alice' }),
    read: 0
  }];

  // Icon and dropdown HTML
  let bellDiv = document.createElement('div');
  bellDiv.innerHTML = `
    <span id="notifyIcon" style="font-size:2em;position:fixed;top:14px;right:16px;z-index:201;cursor:pointer;">
      &#128276;
      <span id="notifyCount" style="position:absolute;top:-8px;right:-9px;background:#d12020;color:#fff;
        min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;
        border-radius:50%;font-size:0.92em;padding:0 5px;font-weight:700;">1</span>
    </span>
    <div id="notifyDropdown"
      style="display:none;position:fixed;top:51px;right:10px;min-width:230px;max-width:92vw;
      background:#fff;border-radius:12px;box-shadow:0 8px 24px #0002;z-index:220;">
    </div>
  `;
  container.appendChild(bellDiv);
  let notifyIcon = bellDiv.querySelector("#notifyIcon");
  let notifyCount = bellDiv.querySelector("#notifyCount");
  let notifyDropdown = bellDiv.querySelector("#notifyDropdown");

  function render() {
    // Calculate unread
    const unread = notifications.filter(n => !n.read).length;
    notifyCount.textContent = unread ? unread : '';
    // Show dropdown notifications
    notifyDropdown.innerHTML = notifications.length
      ? notifications.map(n => `
        <div class="notifyItem" style="padding:14px 15px;cursor:pointer;border-bottom:1px solid #eee;background:${!n.read?'#f4fbfe':'#fff'}"
          data-id="${n.id}" data-type="${n.type}">
          ${n.type === 'friend_request'
            ? `<b>${JSON.parse(n.data).from}</b> sent you a friend request`
            : '<i>Unknown notification</i>'}
        </div>
      `).join('')
      : `<div style="padding:16px;text-align:center;color:#888;">No notifications.</div>`;
  }

  notifyIcon.onclick = () => {
    if (notifyDropdown.style.display === "block") {
      notifyDropdown.style.display = "none";
      return;
    }
    render();
    notifyDropdown.style.display = "block";
    // Attach click listeners each time shown
    Array.from(notifyDropdown.querySelectorAll('.notifyItem')).forEach(item => {
      item.onclick = () => {
        // Mark as read
        const id = Number(item.dataset.id);
        notifications = notifications.map(n => n.id === id ? { ...n, read: 1 } : n);
        render();
        notifyDropdown.style.display = "none";
        notifyCount.textContent = '';
        // Demo: call handler to switch to inbox
        if (item.dataset.type === "friend_request" && typeof jumpToInboxHandler === "function") {
          jumpToInboxHandler();
        }
      };
    });
  };

  // Hide dropdown on outside click
  document.addEventListener('click', function handler(e) {
    if (!notifyDropdown.contains(e.target) && e.target !== notifyIcon) {
      notifyDropdown.style.display = "none";
    }
  });

  // Show badge on load
  render();
}
