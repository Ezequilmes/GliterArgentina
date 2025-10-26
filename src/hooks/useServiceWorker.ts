'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { firebaseConfig } from '@/lib/firebase-config';

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
  skipWaiting: () => void;
  cleanupServiceWorkers: () => Promise<void>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>(() => {
    // En desarrollo, deshabilitar Service Worker por defecto para evitar InvalidStateError
    if (process.env.NODE_ENV === 'development') {
      return {
        isSupported: false,
        isRegistered: false,
        isInstalling: false,
        isWaiting: false,
        isControlling: false,
        updateAvailable: false,
        registration: null,
      };
    }

    const isSupported = typeof window !== 'undefined' && 
                       'serviceWorker' in navigator && 
                       window.isSecureContext &&
                       document.readyState !== 'loading';
    
    return {
      isSupported,
      isRegistered: false,
      isInstalling: false,
      isWaiting: false,
      isControlling: false,
      updateAvailable: false,
      registration: null,
    };
  });

  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  
  // Update ref when addToast changes
  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  // Clean up problematic service workers in development
  const cleanupServiceWorkers = useCallback(async () => {
    if (process.env.NODE_ENV === 'development' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Unregistered service worker:', registration.scope);
        }
      } catch (error) {
        console.warn('Failed to cleanup service workers:', error);
      }
    }
  }, []);

  // Detección mejorada de soporte con prevención de InvalidStateError
  useEffect(() => {
    // En desarrollo, no verificar soporte para evitar InvalidStateError
    if (process.env.NODE_ENV === 'development') {
      console.log('Service Worker deshabilitado en desarrollo para evitar InvalidStateError');
      return;
    }

    const checkSupport = async () => {
      try {
        // Verificaciones básicas
        const hasServiceWorker = 'serviceWorker' in navigator;
        const isSecureContext = window.isSecureContext || location.protocol === 'http:';
        const isDocumentReady = document.readyState === 'complete';
        
        // Verificación adicional: intentar acceder al navigator.serviceWorker
        let canAccessServiceWorker = false;
        if (hasServiceWorker && isDocumentReady) {
          try {
            // Intentar acceder a getRegistrations para verificar que no hay InvalidStateError
            await navigator.serviceWorker.getRegistrations();
            canAccessServiceWorker = true;
          } catch (error) {
            console.warn('No se puede acceder a Service Worker registrations:', error);
            canAccessServiceWorker = false;
          }
        }
        
        const isSupported = hasServiceWorker && isSecureContext && isDocumentReady && canAccessServiceWorker;
        
        setState(prev => ({
          ...prev,
          isSupported
        }));
        
        if (!isSupported) {
          console.log('Service Worker no soportado:', {
            hasServiceWorker,
            isSecureContext,
            isDocumentReady,
            canAccessServiceWorker
          });
        }
      } catch (error) {
        console.error('Error verificando soporte de Service Worker:', error);
        setState(prev => ({
          ...prev,
          isSupported: false
        }));
      }
    };

    // Verificar inmediatamente si el documento ya está listo
    if (document.readyState === 'complete') {
      checkSupport();
    } else {
      // Esperar a que el documento esté completamente listo
      const handler = () => {
        if (document.readyState === 'complete') {
          document.removeEventListener('readystatechange', handler);
          window.removeEventListener('load', handler);
          // Delay adicional para asegurar estabilidad
          setTimeout(checkSupport, 100);
        }
      };
      document.addEventListener('readystatechange', handler);
      window.addEventListener('load', handler);
    }
  }, []);

  // Register service worker
  const register = useCallback(async (): Promise<void> => {
    if (!state.isSupported) {
      console.warn('Service Workers are not supported');
      return;
    }

    // Enhanced validations to prevent invalid state errors
    if (document.readyState === 'loading') {
      console.warn('Document is still loading, deferring Service Worker registration');
      // Wait for document to be ready
      return new Promise<void>((resolve) => {
        const handleReady = () => {
          document.removeEventListener('DOMContentLoaded', handleReady);
          window.removeEventListener('load', handleReady);
          setTimeout(() => {
            register().then(resolve);
          }, 100);
        };
        
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
          setTimeout(() => {
            register().then(resolve);
          }, 100);
        } else {
          document.addEventListener('DOMContentLoaded', handleReady, { once: true });
          window.addEventListener('load', handleReady, { once: true });
        }
      });
    }

    // Check if we're in a secure context
    if (!window.isSecureContext && location.protocol !== 'http:') {
      console.warn('Service Workers require a secure context');
      return;
    }

    // Check if already registered
    if (state.isRegistered || state.isInstalling) {
      console.log('Service Worker already registered or installing');
      return;
    }

    try {
      setState(prev => ({ ...prev, isInstalling: true }));

      // Additional check for existing registration
      const existingRegistration = await navigator.serviceWorker.getRegistration('/');
      if (existingRegistration) {
        console.log('Using existing Service Worker registration:', existingRegistration);
        setState(prev => ({
          ...prev,
          isRegistered: true,
          isInstalling: false,
          registration: existingRegistration,
        }));
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'imports'
      });

      console.log('Service Worker registered:', registration);

      // Register Firebase Messaging Service Worker
      try {
        const firebaseRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-cloud-messaging-push-scope',
          updateViaCache: 'imports'
        });
        console.log('Firebase Messaging Service Worker registered successfully:', firebaseRegistration);
        
        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Firebase Messaging Service Worker is ready');
        
      } catch (firebaseError) {
        console.error('Firebase Messaging Service Worker registration failed:', firebaseError);
        // Continue even if Firebase SW fails to register
      }

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
      
      setState(prev => ({ ...prev, isInstalling: false }));

      // Handle specific errors with appropriate strategies
      if (error instanceof Error) {
        switch (error.name) {
          case 'InvalidStateError':
            console.warn('InvalidStateError detected, document may not be ready. Retrying after delay...');
            
            addToastRef.current({
              type: 'warning',
              title: 'Configurando aplicación',
              message: 'Reintentando configuración automática...',
            });

            // Wait longer and ensure document is fully ready
            setTimeout(async () => {
              if (document.readyState === 'complete') {
                try {
                  await register();
                } catch (retryError) {
                  console.error('Retry failed:', retryError);
                  addToastRef.current({
                    type: 'error',
                    title: 'Error de configuración',
                    message: 'No se pudo configurar la aplicación offline',
                  });
                }
              }
            }, 3000);
            break;

          case 'SecurityError':
            console.error('SecurityError: Service Worker registration blocked by security policy');
            addToastRef.current({
              type: 'error',
              title: 'Error de seguridad',
              message: 'La configuración offline está bloqueada por políticas de seguridad',
            });
            break;

          case 'TypeError':
            console.error('TypeError: Service Worker script failed to load or parse');
            addToastRef.current({
              type: 'error',
              title: 'Error de carga',
              message: 'No se pudo cargar la configuración offline',
            });
            break;

          default:
            console.error('Unknown Service Worker registration error:', error);
            addToastRef.current({
              type: 'error',
              title: 'Error de configuración',
              message: 'No se pudo configurar la aplicación offline',
            });
        }
      } else {
        console.error('Non-Error object thrown during Service Worker registration:', error);
        addToastRef.current({
          type: 'error',
          title: 'Error inesperado',
          message: 'Ocurrió un error inesperado durante la configuración',
        });
      }
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

  // Auto-register on mount with enhanced safety and InvalidStateError prevention
  useEffect(() => {
    // En desarrollo, no auto-registrar para evitar InvalidStateError
    if (process.env.NODE_ENV === 'development') {
      console.log('Auto-registro de Service Worker deshabilitado en desarrollo');
      return;
    }

    // Enhanced document ready detection with InvalidStateError prevention
    const registerWhenReady = async () => {
      try {
        // Verificar contexto seguro y estado del documento
        if (!window.isSecureContext && location.protocol !== 'http:') {
          console.warn('Service Worker requiere contexto seguro (HTTPS)');
          return;
        }

        // Multiple checks to ensure document and environment are ready
        if (document.readyState === 'complete' && 
            window.navigator && 
            'serviceWorker' in navigator &&
            !state.isRegistered && 
            !state.isInstalling) {
          
          // Wait for any pending operations to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify document is still ready after delay
          if (document.readyState === 'complete') {
            // Additional delay to ensure all scripts are loaded and DOM is stable
            setTimeout(() => {
              register().catch((error) => {
                console.error('Error en auto-registro:', error);
              });
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error en registerWhenReady:', error);
      }
    };

    // Handle different document states with better error handling
    if (document.readyState === 'loading') {
      // Document still loading, wait for events
      const handleDOMReady = () => {
        document.removeEventListener('DOMContentLoaded', handleDOMReady);
        // Add delay before registering to ensure stability
        setTimeout(() => {
          registerWhenReady();
        }, 200);
      };
      
      const handleWindowLoad = () => {
        window.removeEventListener('load', handleWindowLoad);
        // Add delay before registering to ensure stability
        setTimeout(() => {
          registerWhenReady();
        }, 200);
      };

      document.addEventListener('DOMContentLoaded', handleDOMReady, { once: true });
      window.addEventListener('load', handleWindowLoad, { once: true });
      
      return () => {
        document.removeEventListener('DOMContentLoaded', handleDOMReady);
        window.removeEventListener('load', handleWindowLoad);
      };
    } else if (document.readyState === 'interactive') {
      // DOM ready but resources may still be loading
      const handleWindowLoad = () => {
        window.removeEventListener('load', handleWindowLoad);
        // Add delay before registering to ensure stability
        setTimeout(() => {
          registerWhenReady();
        }, 200);
      };
      
      window.addEventListener('load', handleWindowLoad, { once: true });
      
      return () => {
        window.removeEventListener('load', handleWindowLoad);
      };
    } else {
      // Document completely loaded - add extra delay for safety
      setTimeout(() => {
        registerWhenReady();
      }, 300);
    }
  }, [register, state.isRegistered, state.isInstalling]);

  return {
    ...state,
    register,
    update,
    unregister,
    skipWaiting,
    cleanupServiceWorkers,
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
    const checkSupport = () => {
      try {
        return typeof window !== 'undefined' && 
               'Notification' in window && 
               typeof window.Notification !== 'undefined' &&
               'serviceWorker' in navigator && 
               'PushManager' in window;
      } catch {
        return false;
      }
    };
    
    const getPermission = () => {
      try {
        return typeof window !== 'undefined' && window.Notification ? window.Notification.permission : 'default';
      } catch {
        return 'default';
      }
    };
    
    setIsSupported(checkSupport());
    setPermission(getPermission());
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported');
      return 'denied';
    }

    try {
      if (typeof window === 'undefined' || !window.Notification) {
        console.warn('Notification API not available');
        return 'denied';
      }
      
      const result = await window.Notification.requestPermission();
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