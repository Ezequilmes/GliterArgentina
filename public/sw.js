const CACHE_NAME = 'gliter-v1';
const STATIC_CACHE = 'gliter-static-v1';
const DYNAMIC_CACHE = 'gliter-dynamic-v1';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/chat',
  '/discover',
  '/profile',
  '/manifest.json',
  // Add other critical assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle API requests - network first, cache for offline
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (response.status === 200 && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for specific endpoints
    if (request.url.includes('/api/health')) {
      return new Response(
        JSON.stringify({ status: 'offline', timestamp: new Date().toISOString() }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Handle static assets - cache first
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a fallback for images
    if (request.url.includes('.jpg') || request.url.includes('.png') || request.url.includes('.webp')) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">Imagen no disponible</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Handle navigation - app shell pattern
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Return cached app shell
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/') ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/images/') ||
         pathname.includes('.') && !pathname.includes('/api/');
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'send-message') {
    event.waitUntil(syncMessages());
  }
  
  if (event.tag === 'upload-file') {
    event.waitUntil(syncFileUploads());
  }
});

// Sync offline messages
async function syncMessages() {
  try {
    // Get offline messages from IndexedDB
    const offlineMessages = await getOfflineMessages();
    
    for (const message of offlineMessages) {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        
        // Remove from offline storage
        await removeOfflineMessage(message.id);
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Sync offline file uploads
async function syncFileUploads() {
  try {
    // Implementation for syncing file uploads
    console.log('Syncing file uploads...');
  } catch (error) {
    console.error('File upload sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Gliter Argentina',
    body: 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-144x144.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/chat',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/icon-144x144.png'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  // Parse notification data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('Push data received:', pushData);
      
      // Handle different notification types
      if (pushData.notification) {
        notificationData.title = pushData.notification.title || notificationData.title;
        notificationData.body = pushData.notification.body || notificationData.body;
        notificationData.icon = pushData.notification.icon || notificationData.icon;
        notificationData.image = pushData.notification.image;
      }
      
      // Handle custom data
      if (pushData.data) {
        notificationData.data = { ...notificationData.data, ...pushData.data };
        
        // Customize based on notification type
        switch (pushData.data.type) {
          case 'message':
            notificationData.title = `💬 ${pushData.data.senderName || 'Nuevo mensaje'}`;
            notificationData.body = pushData.data.messagePreview || 'Tienes un nuevo mensaje';
            notificationData.data.url = `/chat/${pushData.data.chatId}`;
            notificationData.actions = [
              { action: 'reply', title: '💬 Responder' },
              { action: 'open', title: '👀 Ver chat' },
              { action: 'close', title: '❌ Cerrar' }
            ];
            break;
            
          case 'match':
            notificationData.title = '💖 ¡Nuevo match!';
            notificationData.body = `¡Hiciste match con ${pushData.data.matchName || 'alguien especial'}!`;
            notificationData.data.url = '/matches';
            notificationData.actions = [
              { action: 'open', title: '💖 Ver matches' },
              { action: 'close', title: '❌ Cerrar' }
            ];
            break;
            
          case 'like':
            notificationData.title = '👍 ¡Te dieron like!';
            notificationData.body = `A ${pushData.data.likerName || 'alguien'} le gustas`;
            notificationData.data.url = '/discover';
            break;
            
          case 'super_like':
            notificationData.title = '⭐ ¡Super Like!';
            notificationData.body = `¡${pushData.data.superLikerName || 'Alguien'} te dio un Super Like!`;
            notificationData.data.url = '/discover';
            break;
            
          case 'visit':
            notificationData.title = '👀 Visita a tu perfil';
            notificationData.body = `${pushData.data.visitorName || 'Alguien'} visitó tu perfil`;
            notificationData.data.url = '/profile';
            break;
            
          default:
            // Keep default values
            break;
        }
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      image: notificationData.image,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      tag: notificationData.data.type || 'general'
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'close') {
    return;
  }
  
  if (event.action === 'reply') {
    // For now, just open the chat - in the future we could implement inline reply
    event.action = 'open';
  }
  
  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/chat';
  
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // Try to find an existing window/tab
      for (const client of clientList) {
        // If we find a window with the app, focus it and navigate
        if (client.url.includes(self.location.origin)) {
          return client.focus().then(() => {
            // Send a message to the client to navigate to the specific URL
            return client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: urlToOpen,
              data: notificationData
            });
          });
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    }).catch((error) => {
      console.error('Error handling notification click:', error);
      // Fallback: try to open a new window
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Helper functions for IndexedDB operations
async function getOfflineMessages() {
  // Implementation would use IndexedDB to get offline messages
  return [];
}

async function removeOfflineMessage(messageId) {
  // Implementation would use IndexedDB to remove message
  console.log('Removing offline message:', messageId);
}