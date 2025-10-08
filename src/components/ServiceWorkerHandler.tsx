'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceWorkerHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle messages from service worker
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('Received message from service worker:', event.data);
      
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { url, data } = event.data;
        
        // Navigate to the specified URL
        if (url) {
          console.log('Navigating to:', url);
          router.push(url);
          
          // Optional: Show a toast or highlight based on notification type
          if (data && data.type) {
            switch (data.type) {
              case 'message':
                // Could show a toast: "Navegando al chat..."
                break;
              case 'match':
                // Could show a toast: "¡Nuevo match! Navegando..."
                break;
              case 'like':
                // Could show a toast: "¡Te dieron like! Navegando..."
                break;
              default:
                break;
            }
          }
        }
      }
    };

    // Handle messages from service worker controller
    const handleControllerMessage = (event: Event) => {
      if (event instanceof MessageEvent) {
        handleServiceWorkerMessage(event);
      }
    };

    // Register the message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Also listen for messages from the service worker controller
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.addEventListener('message', handleControllerMessage);
      }
    }

    // Cleanup
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.removeEventListener('message', handleControllerMessage);
        }
      }
    };
  }, [router]);

  // This component doesn't render anything
  return null;
}