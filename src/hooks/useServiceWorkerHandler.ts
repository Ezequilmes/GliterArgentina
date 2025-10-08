'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useServiceWorkerHandler() {
  const router = useRouter();

  useEffect(() => {
    // Solo ejecutar en el cliente y si service worker está disponible
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          const { url, message } = event.data;
          
          if (url) {
            router.push(url);
          }
          
          if (message) {
            console.log('Notification message:', message);
          }
        }
      } catch (error) {
        console.error('Error handling service worker message:', error);
      }
    };

    // Registrar el listener
    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [router]);
}