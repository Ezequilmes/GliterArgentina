// Firebase Cloud Messaging Service Worker
console.log('[firebase-messaging-sw.js] Service Worker starting...');

// Import Firebase scripts
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
  console.log('[firebase-messaging-sw.js] Firebase scripts imported successfully');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to import Firebase scripts:', error);
}

// Firebase configuration
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

// Initialize Firebase
let messaging = null;

try {
  if (typeof firebase !== 'undefined') {
    console.log('[firebase-messaging-sw.js] Initializing Firebase...');
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    console.log('[firebase-messaging-sw.js] Firebase Messaging initialized successfully');

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      
      const notificationTitle = payload.notification?.title || 'Gliter Argentina';
      const notificationOptions = {
        body: payload.notification?.body || 'Tienes una nueva notificación',
        icon: payload.notification?.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-144x144.png',
        tag: payload.data?.type || 'general',
        data: payload.data,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        silent: false,
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

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.error('[firebase-messaging-sw.js] Firebase not available');
  }
} catch (error) {
  console.error('[firebase-messaging-sw.js] Failed to initialize Firebase messaging:', error);
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

      } catch (error) {
        console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
      }
    }
  }
}