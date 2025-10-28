// Firebase Cloud Messaging Service Worker

// Import Firebase scripts (compat)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Variables globales para Firebase
let messaging;
let isFirebaseInitialized = false;

// Función para inicializar Firebase dinámicamente
async function initializeFirebase() {
  if (isFirebaseInitialized) return messaging;

  try {
    // Obtener configuración desde el API
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config: ' + response.status);
    }
    
    const firebaseConfig = await response.json();
    
    // Validar configuración
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error('Invalid Firebase configuration received');
    }

    // Initialize Firebase and Messaging
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    isFirebaseInitialized = true;
    
    console.log('Firebase initialized successfully in Service Worker');
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase in Service Worker:', error);
    throw error;
  }
}

// Inicializar Firebase cuando el Service Worker se activa
self.addEventListener('activate', function(event) {
  event.waitUntil(initializeFirebase());
});

// Configurar el manejador de mensajes en segundo plano al inicializar
initializeFirebase().then(function(messagingInstance) {
  if (messagingInstance) {
    messagingInstance.onBackgroundMessage(function(payload) {
      console.log('Received background message:', payload);
      
      const title = payload.notification?.title || 'Gliter Argentina';
      const body = payload.notification?.body || 'Tienes una nueva notificación';
      const icon = payload.notification?.icon || '/icons/icon-192x192.png';

      self.registration.showNotification(title, {
        body: body,
        icon: icon,
        badge: payload.notification?.badge || '/icons/icon-96x96.png',
        image: payload.notification?.image,
        tag: payload.data?.type || 'general',
        data: payload.data || {},
        requireInteraction: true
      });
    });
  }
}).catch(function(error) {
  console.error('Failed to initialize Firebase messaging:', error);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/';

  // Determinar URL basada en el tipo de notificación
  switch (data.type) {
    case 'match':
      url = '/matches';
      break;
    case 'message':
      url = data.chatId ? '/chat/' + data.chatId : '/chat';
      break;
    case 'like':
    case 'super_like':
      url = '/discover';
      break;
    case 'visit':
      url = '/discover';
      break;
    default:
      url = data.url || '/';
  }

  // Abrir o enfocar ventana
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Buscar ventana existente con la URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.indexOf(url.split('?')[0]) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana existente, abrir nueva
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});