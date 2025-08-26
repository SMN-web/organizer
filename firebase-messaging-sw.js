// Import Firebase Messaging libraries (compat version for broad support)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase using your app's config
firebase.initializeApp({
  apiKey: "AIzaSyAWphaG1_4n1i3F9kY_TrMdvjVQomu7OtQ",
  authDomain: "organizer-359e3.firebaseapp.com",
  projectId: "organizer-359e3",
  messagingSenderId: "223125946708",
  appId: "1:223125946708:web:17850e13399725533288c1"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage(function(payload) {
  const notification = payload?.notification || {};
  self.registration.showNotification(
    notification.title || "New Notification",
    { body: notification.body || "", icon: notification.icon || "/icon.png" }
  );
});
