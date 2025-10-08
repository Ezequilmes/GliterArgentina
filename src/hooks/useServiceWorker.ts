'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

// Declaración de tipos para Background Sync API
declare global {
  interface ServiceWorkerRegistration {
    sync: {
      register(tag: string): Promise<void>;
    };
  }
}

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  isControlling: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  register: () => Promise<void>;
  update: () => Promise<void>;
  unregister: () => Promise<void>;
  skipWaiting: () => Promise<void>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    isWaiting: false,
    isControlling: false,
    updateAvailable: false,
    registration: null,
  });

  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  
  // Update ref when addToast changes
  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  // Check if service workers are supported
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isSupported: 'serviceWorker' in navigator,
    }));
  }, []);

  // Register service worker
  const register = useCallback(async (): Promise<void> => {
    if (!state.isSupported) {
      console.warn('Service Workers are not supported');
      return;
    }

    // Additional validations to prevent invalid state errors
    if (document.readyState === 'loading') {
      console.warn('Document is still loading, deferring Service Worker registration');
      return;
    }

    // Check if we're in a secure context
    if (!window.isSecureContext && location.protocol !== 'http:') {
      console.warn('Service Workers require a secure context');
      return;
    }

    try {
      setState(prev => ({ ...prev, isInstalling: true }));

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        isInstalling: false,
        registration,
      }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        setState(prev => ({ ...prev, isInstalling: true }));

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            setState(prev => ({ ...prev, isInstalling: false }));

            if (navigator.serviceWorker.controller) {
              // New update available
              setState(prev => ({ 
                ...prev, 
                updateAvailable: true,
                isWaiting: true 
              }));
              
              addToastRef.current({
                type: 'info',
                title: 'Actualización disponible',
                message: 'Una nueva versión está lista para instalar',
              });
            } else {
              // First install
              setState(prev => ({ ...prev, isControlling: true }));
              
              addToastRef.current({
                type: 'success',
                title: 'App instalada',
                message: 'La aplicación está lista para usar offline',
              });
            }
          }
        });
      });

      // Listen for controlling changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setState(prev => ({ 
          ...prev, 
          isControlling: true,
          updateAvailable: false,
          isWaiting: false 
        }));
        
        addToastRef.current({
          type: 'success',
          title: 'App actualizada',
          message: 'La aplicación se ha actualizado correctamente',
        });
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      
      // Handle specific InvalidStateError
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        console.warn('Document in invalid state, will retry later');
        setState(prev => ({ 
          ...prev, 
          isInstalling: false 
        }));
        
        // Retry after a longer delay
        setTimeout(() => {
          if (state.isSupported && !state.isRegistered) {
            register();
          }
        }, 2000);
        return;
      }
      
      setState(prev => ({ 
        ...prev, 
        isInstalling: false,
        isRegistered: false 
      }));
      
      addToastRef.current({
        type: 'error',
        title: 'Error de instalación',
        message: 'No se pudo instalar la aplicación offline',
      });
    }
  }, [state.isSupported]);

  // Update service worker
  const update = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      await state.registration.update();
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  };

  // Unregister service worker
  const unregister = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      const result = await state.registration.unregister();
      if (result) {
        setState(prev => ({
          ...prev,
          isRegistered: false,
          isControlling: false,
          updateAvailable: false,
          registration: null,
        }));
        
        addToast({
          type: 'info',
          title: 'App desinstalada',
          message: 'La funcionalidad offline ha sido deshabilitada',
        });
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  };

  // Skip waiting and activate new service worker
  const skipWaiting = async (): Promise<void> => {
    if (!state.registration?.waiting) return;

    try {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      setState(prev => ({ 
        ...prev, 
        isWaiting: false,
        updateAvailable: false 
      }));
    } catch (error) {
      console.error('Skip waiting failed:', error);
    }
  };

  // Auto-register on mount (disabled in development to avoid InvalidStateError)
  useEffect(() => {
    // Skip auto-registration in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker auto-registration disabled in development');
      return;
    }

    if (!state.isSupported || state.isRegistered) return;

    const registerWhenReady = () => {
      // Wait for the window to be fully loaded
      if (document.readyState !== 'complete') {
        window.addEventListener('load', registerWhenReady, { once: true });
        return;
      }
      
      // Additional delay to ensure everything is ready
      setTimeout(() => {
        // Double check the state before registering
        if (state.isSupported && !state.isRegistered) {
          register();
        }
      }, 500);
    };

    registerWhenReady();
  }, [state.isSupported, state.isRegistered]);

  return {
    ...state,
    register,
    update,
    unregister,
    skipWaiting,
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype);
  }, []);

  const requestSync = async (tag: string): Promise<void> => {
    if (!isSupported) {
      console.warn('Background Sync is not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  };

  return {
    isSupported,
    requestSync,
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const { addToast } = useToast();

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window);
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // No mostrar toast aquí para evitar duplicados
      // El toast se mostrará desde el componente que maneja la suscripción
      
      return result;
    } catch (error) {
      console.error('Permission request failed:', error);
      return 'denied';
    }
  };

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      
      // If there's an existing subscription, unsubscribe first
      if (existingSubscription) {
        try {
          await existingSubscription.unsubscribe();
          console.log('Unsubscribed from existing push subscription');
        } catch (unsubError) {
          console.warn('Failed to unsubscribe from existing subscription:', unsubError);
        }
      }
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      setSubscription(sub);
      
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      // Toast se mostrará desde PWAInitializer para evitar duplicados

      return sub;
    } catch (error) {
      // Handle specific InvalidStateError
      if (error instanceof Error && error.name === 'InvalidStateError') {
        console.warn('InvalidStateError detected, attempting to clear existing subscription and retry...');
        
        try {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          
          if (existingSubscription) {
            await existingSubscription.unsubscribe();
            console.log('Successfully unsubscribed from conflicting subscription');
            
            // Retry subscription after unsubscribing
            const sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });

            setSubscription(sub);
             
             // Send subscription to server
             await fetch('/api/push/subscribe', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(sub),
             });

             // Toast se mostrará desde PWAInitializer para evitar duplicados
 
             return sub;
          }
        } catch (retryError) {
          console.error('Failed to retry subscription after clearing existing one:', retryError);
        }
      }
      
      console.error('Push subscription failed:', error);
      return null;
    }
  };

  const unsubscribe = async (): Promise<void> => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      
      // Remove subscription from server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
      
      addToast({
        type: 'info',
        title: 'Notificaciones deshabilitadas',
        message: 'Ya no recibirás notificaciones push',
      });
    } catch (error) {
      console.error('Push unsubscription failed:', error);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}