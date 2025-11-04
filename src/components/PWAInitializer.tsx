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
  const browserInfo = detectBrowser();

  // Note: Service Worker registration is now handled automatically by useServiceWorker hook
  // No manual registration needed here to avoid conflicts

  // Service Worker initialization and cleanup
  useEffect(() => {
    // Skip Service Worker operations in development to avoid InvalidStateError
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker operations disabled in development');
      return;
    }

    // Skip Service Worker operations in WebView/Trae app
    if (browserInfo.isWebView || browserInfo.isTraeApp) {
      console.log('🚫 Service Worker operations skipped in WebView/Trae app');
      return;
    }

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
  }, [browserInfo.isWebView, browserInfo.isTraeApp]);

  useEffect(() => {
    // Skip push notification setup in development, WebView, or when SW not supported/registered
    if (process.env.NODE_ENV === 'development' || !pushSupported || browserInfo.isWebView || browserInfo.isTraeApp) {
      if (browserInfo.isWebView || browserInfo.isTraeApp) {
        console.log('🚫 Push notifications skipped in WebView/Trae app');
      }
      return;
    }

    // Request notification permission after user interaction
    const handleUserInteraction = async (event: Event) => {
      // Verificar que el evento sea una interacción real del usuario
      if (!event.isTrusted) {
        console.warn('PWA: Ignoring untrusted user interaction event');
        return;
      }

      // Evitar suscripción repetida si ya está habilitada previamente
      if (localStorage.getItem('pushEnabled') === 'true') {
        return;
      }

      // Verificar que el permiso actual permita la solicitud
      const currentPermission = typeof window !== 'undefined' && window.Notification 
        ? window.Notification.permission 
        : 'default';
      
      if (currentPermission === 'denied') {
        console.log('PWA: Notification permission already denied, skipping request');
        return;
      }

      if (pushSupported && isOnline) {
        try {
          // Agregar un pequeño delay para asegurar que la interacción del usuario sea válida
          await new Promise(resolve => setTimeout(resolve, 100));
          
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
    // Usar passive: false para asegurar que podemos detectar eventos trusted
    document.addEventListener('click', handleUserInteraction, { once: true, passive: false });
    document.addEventListener('touchstart', handleUserInteraction, { once: true, passive: false });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [pushSupported, isOnline, requestPermission, subscribe, addToast, browserInfo.isWebView, browserInfo.isTraeApp]);

  // This component doesn't render anything
  return null;
}

export default PWAInitializer;