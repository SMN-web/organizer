importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyAWphaG1_4n1i3F9kY_TrMdvjVQomu7OtQ",
  authDomain: "organizer-359e3.firebaseapp.com",
  projectId: "organizer-359e3",
  messagingSenderId: "223125946708",
  appId: "1:223125946708:web:17850e13399725533288c1"
});

const messaging = firebase.messaging();

// Show notification on background FCM push
messaging.onBackgroundMessage(function(payload) {
  const notification = payload?.notification || {};
  self.registration.showNotification(
    notification.title || "New Notification",
    {
      body: notification.body || "",
      icon: notification.icon || "/icon.png",
      badge: notification.badge || "/badge.png"
    }
  );
});

// Always redirect user to fixed panel when notification is clicked
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const redirectUrl = "https://smn-web.github.io/organizer/#user";  // <-- Always go here
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        // If already open, focus it
        if (client.url.includes(redirectUrl) && 'focus' in client)
          return client.focus();
      }
      // Otherwise, open a new tab/window
      if (clients.openWindow)
        return clients.openWindow(redirectUrl);
    })
  );
});
