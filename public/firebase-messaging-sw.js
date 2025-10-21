// Firebase Cloud Messaging Service Worker
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to import Firebase scripts:', error);
}

// Check if we're in a service worker context
if (typeof self === 'undefined' || typeof importScripts === 'undefined') {
  console.error('[firebase-messaging-sw.js] Not running in service worker context');
} else {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBDaKVYlJSfIJ7nKeIkTEWSmhlB1Soqay0",
    authDomain: "gliter-argentina.firebaseapp.com",
    projectId: "gliter-argentina",
    storageBucket: "gliter-argentina.firebasestorage.app",
    messagingSenderId: "1084162955705",
    appId: "1:1084162955705:web:362b67d495109dff24fe68"
  };

  // Initialize Firebase only if firebase is available
  if (typeof firebase !== 'undefined') {
    try {
      firebase.initializeApp(firebaseConfig);
      
      // Initialize Firebase Cloud Messaging and get a reference to the service
      const messaging = firebase.messaging();

      // Handle background messages
      messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);
        
        const notificationTitle = payload.notification?.title || 'Gliter Argentina';
        const notificationOptions = {
          body: payload.notification?.body || 'Tienes una nueva notificación',
          icon: '/logo.svg',
          badge: '/logo.svg',
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
          ]
        };

        if (self.registration && self.registration.showNotification) {
          self.registration.showNotification(notificationTitle, notificationOptions);
        }
      });
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Failed to initialize Firebase messaging:', error);
    }
  } else {
    console.error('[firebase-messaging-sw.js] Firebase not available');
  }
}

// Handle notification click - outside the Firebase initialization block
if (typeof self !== 'undefined' && self.addEventListener) {
  self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');

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
}