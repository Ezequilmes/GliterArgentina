'use client';

import { useEffect } from 'react';
import { useServiceWorker, usePushNotifications } from '@/hooks/useServiceWorker';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/components/ui/Toast';

export function PWAInitializer() {
  const { register, isSupported: swSupported } = useServiceWorker();
  const { requestPermission, subscribe, isSupported: pushSupported } = usePushNotifications();
  const { isOnline } = useNetworkStatus();
  const { addToast } = useToast();

  useEffect(() => {
    // Skip service worker registration in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PWA Service Worker registration disabled in development');
      return;
    }

    // Register service worker
    if (swSupported) {
      register();
    }
  }, [swSupported, register]);

  // Ensure no stale Service Worker is controlling app during development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister();
        });
      });
    }
  }, []);

  useEffect(() => {
    // Skip push notification setup in development or when SW not supported/registered
    if (process.env.NODE_ENV === 'development' || !pushSupported) {
      return;
    }

    // Request notification permission after user interaction
    const handleUserInteraction = async () => {
      // Evitar suscripción repetida si ya está habilitada previamente
      if (localStorage.getItem('pushEnabled') === 'true') {
        return;
      }

      if (pushSupported && isOnline) {
        try {
          const permission = await requestPermission();
          if (permission === 'granted') {
            const subscription = await subscribe();
            if (subscription) {
              console.log('Push notifications successfully enabled');
              // Mostrar toast solo una vez cuando todo esté configurado exitosamente
              addToast({
                type: 'success',
                title: 'Notificaciones habilitadas',
                message: 'Recibirás notificaciones de nuevos mensajes',
              });
              // Marcar en localStorage para evitar duplicados futuros
              localStorage.setItem('pushEnabled', 'true');
            }
          }
        } catch (error) {
          console.error('Error setting up push notifications:', error);
          // Don't show error to user as the subscribe function already handles it
        }
      }
      
      // Remove listener after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Wait for user interaction before requesting permissions
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [pushSupported, isOnline, requestPermission, subscribe, addToast]);

  // This component doesn't render anything
  return null;
}

export default PWAInitializer;