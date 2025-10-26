// Firebase Cloud Messaging Service Worker

// Import Firebase scripts (compat)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase configuration (producción)
const firebaseConfig = {
  apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
  authDomain: "gliter-argentina.firebaseapp.com",
  databaseURL: "https://gliter-argentina-default-rtdb.firebaseio.com/",
  projectId: "gliter-argentina",
  storageBucket: "gliter-argentina.firebasestorage.app",
  messagingSenderId: "1084162955705",
  appId: "1:1084162955705:web:25bb32180d1bdaf724fe68",
  measurementId: "G-MMFQWWFCJD"
};

// Initialize Firebase and Messaging
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Gliter Argentina';
  const body = payload?.notification?.body || 'Tienes una nueva notificación';
  const icon = payload?.notification?.icon || '/icons/icon-192x192.png';

  self.registration.showNotification(title, {
    body,
    icon,
    tag: payload?.data?.type || 'general',
    data: payload?.data || {},
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  });
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const data = event.notification.data || {};
  let url = '/';

  switch (data.type) {
    case 'match':
      url = '/matches';
      break;
    case 'message':
      url = data.chatId ? `/chat/${data.chatId}` : '/chat';
      break;
    case 'like':
    case 'super_like':
      url = '/matches';
      break;
    case 'visit':
      url = '/profile';
      break;
    default:
      url = '/dashboard';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});