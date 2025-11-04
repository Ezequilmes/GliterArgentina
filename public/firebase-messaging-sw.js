// Firebase Cloud Messaging Service Worker
// Import Firebase scripts
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to import Firebase scripts:', error);
}

// Firebase configuration - embedded directly to avoid async issues
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

// Initialize Firebase immediately
let messaging = null;

if (typeof firebase !== 'undefined' && firebaseConfig) {
  try {
    // Initialize Firebase app
    firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase Cloud Messaging
    messaging = firebase.messaging();
    
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully');

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      
      const notificationTitle = payload.notification?.title || 'Gliter Argentina';
      const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: '/icons/notification-icon-192x192.png',
        badge: '/icons/notification-badge-72x72.png',
        tag: payload.data?.type || 'general',
        data: payload.data,
        actions: [
          {
            action: 'open',
            title: 'Abrir'
          },
          {
            action: 'close',
            title: 'Cerrar'
          }
        ],
        requireInteraction: false,
        silent: false
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Failed to initialize Firebase messaging:', error);
  }
} else {
  console.error('[firebase-messaging-sw.js] Firebase not available or config missing');
}

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Handle different notification types
  const data = event.notification.data;
  let url = '/';

  if (data) {
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
  }

  // Open the app and navigate to the appropriate page
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
