// Firebase messaging service worker for push notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyCw3oPJKCHchzDoCmNjMc7mXGJBcG3tAPM",
  authDomain: "friends-reminder-1b494.firebaseapp.com",
  projectId: "friends-reminder-1b494",
  storageBucket: "friends-reminder-1b494.firebasestorage.app",
  messagingSenderId: "818386771400",
  appId: "1:818386771400:web:3ca4fb33b928355c10f4fd",
  measurementId: "G-ZQ6RJSWMR2"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Friends Reminder';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new reminder',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'friends-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'snooze',
        title: 'Snooze'
      }
    ],
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'snooze') {
    // Handle snooze action
    console.log('Snooze action clicked');
    // You can implement snooze logic here
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
}); 