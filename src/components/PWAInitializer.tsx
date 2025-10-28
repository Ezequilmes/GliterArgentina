'use client';

import { useEffect } from 'react';
import { useServiceWorker, usePushNotifications } from '@/hooks/useServiceWorker';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useToast } from '@/components/ui/Toast';
import { detectBrowser } from '@/utils/browserDetection';

export function PWAInitializer() {
  const { register, isSupported: swSupported } = useServiceWorker();
  const { requestPermission, subscribe, isSupported: pushSupported } = usePushNotifications();
  const { isOnline } = useNetworkStatus();
  const { addToast } = useToast();
  // Note: Service Worker registration is now handled automatically by useServiceWorker hook
  // No manual registration needed here to avoid conflicts

  // Service Worker initialization and cleanup
  useEffect(() => {
    console.log('🚀 Initializing PWA services...');

    // Only clean up OLD/INVALID Service Workers, not our current one
    if ('serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => {
            // Only unregister old Vite or webpack service workers, not our current Gliter SW
            const scope = reg.scope || '';
            if (scope.includes('vite') || scope.includes('@vite') || scope.includes('webpack')) {
              console.log('Cleaning up old service worker:', scope);
              reg.unregister().catch((error) => {
                console.warn('Failed to unregister old service worker:', error);
              });
            }
          });
        }).catch((error) => {
          console.warn('Could not access Service Worker registrations:', error);
        });
      } catch (error) {
        console.warn('Error accessing Service Workers:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Skip push notification setup when SW not supported/registered
    if (!pushSupported) {
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