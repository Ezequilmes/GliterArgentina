import { getMessaging, getToken, onMessage, MessagePayload, isSupported } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import app, { db } from '@/lib/firebase';
import { notificationService } from './notificationService';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export class FCMService {
  private static instance: FCMService;
  private messaging: any = null;
  private currentToken: string | null = null;
  private isSupported: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  constructor() {
    this.initializationPromise = this.initializeMessaging();
  }

  private async initializeMessaging() {
    console.log('FCM: Starting messaging initialization...');
    
    if (typeof window === 'undefined') {
      console.log('FCM: Running on server side, skipping initialization');
      return;
    }

    try {
      // Verificar si Firebase Messaging está soportado
      console.log('FCM: Checking Firebase Messaging support...');
      const firebaseSupported = await isSupported();
      
      if (!firebaseSupported) {
        console.warn('FCM: Firebase Messaging is not supported in this browser');
        this.isSupported = false;
        return;
      }
      console.log('FCM: Firebase Messaging is supported');

      // Verificar si el navegador soporta todas las características necesarias
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasNotifications = 'Notification' in window;
      const hasPushManager = 'PushManager' in window;
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';

      console.log('FCM: Browser compatibility check:', {
        hasServiceWorker,
        hasNotifications,
        hasPushManager,
        isSecureContext,
        protocol: location.protocol,
        hostname: location.hostname,
        userAgent: navigator.userAgent.substring(0, 100) + '...'
      });

      if (!hasServiceWorker) {
        console.warn('FCM: Service Workers not supported');
        this.isSupported = false;
        return;
      }

      if (!hasNotifications) {
        console.warn('FCM: Notifications API not supported');
        this.isSupported = false;
        return;
      }

      if (!hasPushManager) {
        console.warn('FCM: Push Manager not supported');
        this.isSupported = false;
        return;
      }

      if (!isSecureContext) {
        console.warn('FCM: Secure context required (HTTPS or localhost)');
        this.isSupported = false;
        return;
      }

      console.log('FCM: All compatibility checks passed, initializing Firebase Messaging...');

      // Solo inicializar Firebase Messaging si todo está soportado
      this.messaging = getMessaging(app);
      this.isSupported = true;
      
      console.log('FCM: Firebase Messaging instance created successfully');
      
      // Configurar listener para mensajes en primer plano
      this.setupForegroundMessageListener();
      
      console.log('FCM: Messaging initialized successfully');
    } catch (error) {
      console.error('FCM: Error initializing messaging:', error);
      if (error instanceof Error) {
        console.error('FCM: Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      this.isSupported = false;
      this.messaging = null;
    }
  }

  private setupForegroundMessageListener() {
    if (!this.messaging) return;

    try {
      onMessage(this.messaging, (payload: MessagePayload) => {
        console.log('FCM: Message received in foreground:', payload);
        
        // Mostrar notificación personalizada cuando la app está en primer plano
        this.showNotification(payload);
        
        // Crear notificación en la base de datos si es necesario
        this.handleIncomingMessage(payload);
      });
    } catch (error) {
      console.error('FCM: Error setting up foreground message listener:', error);
    }
  }

  private async showNotification(payload: MessagePayload) {
    if (!('Notification' in window)) return;

    const { title, body, icon, image } = payload.notification || {};
    
    if (title && body) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: icon || '/logo.svg',
          badge: '/logo.svg',
          tag: payload.data?.type || 'general',
          data: payload.data,
          requireInteraction: true,
          actions: [
            {
              action: 'view',
              title: 'Ver'
            },
            {
              action: 'dismiss',
              title: 'Cerrar'
            }
          ]
        } as any);
      } catch (error) {
        console.error('FCM: Error showing notification:', error);
      }
    }
  }

  private async handleIncomingMessage(payload: MessagePayload) {
    const { data } = payload;
    
    if (data?.userId && data?.type) {
      try {
        // Validar el tipo de notificación
        const validTypes = ['match', 'message', 'like', 'super_like', 'visit', 'verification', 'premium'];
        const notificationType = validTypes.includes(data.type) ? data.type : 'message';
        
        // Crear notificación en la base de datos
        await notificationService.createNotification(data.userId, {
          title: payload.notification?.title || 'Nueva notificación',
          message: payload.notification?.body || '',
          type: notificationType as any,
          data: data
        });
      } catch (error) {
        console.error('FCM: Error creating notification in database:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    // Esperar a que la inicialización termine
    await this.initializationPromise;
    
    if (!this.isSupported) {
      console.warn('FCM: Notifications not supported');
      return false;
    }

    try {
      if (typeof window === 'undefined' || !window.Notification) {
        console.warn('FCM: Notification API not available');
        return false;
      }
      
      const permission = await window.Notification.requestPermission();
      console.log('FCM: Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('FCM: Error requesting permission:', error);
      return false;
    }
  }

  async getRegistrationToken(vapidKey?: string): Promise<string | null> {
    // Esperar a que la inicialización termine
    await this.initializationPromise;
    
    console.log('FCM: Getting registration token - Environment:', {
      isProduction: process.env.NODE_ENV === 'production',
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      messagingAvailable: !!this.messaging,
      isSupported: this.isSupported
    });
    
    if (!this.messaging || !this.isSupported) {
      console.warn('FCM: Messaging not available - messaging:', !!this.messaging, 'isSupported:', this.isSupported);
      return null;
    }

    try {
      // Verificar permisos
      console.log('FCM: Requesting notification permission...');
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('FCM: Notification permission denied');
        return null;
      }
      console.log('FCM: Notification permission granted');

      // Verificar si el push service está disponible
      if (!('PushManager' in window)) {
        console.warn('FCM: Push messaging is not supported');
        return null;
      }
      console.log('FCM: PushManager is available');

      // Verificar VAPID key
      const finalVapidKey = vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      console.log('FCM: Using VAPID key:', finalVapidKey ? finalVapidKey.substring(0, 20) + '...' : 'undefined');

      // Obtener token de registro
      console.log('FCM: Requesting registration token from Firebase...');
      const token = await getToken(this.messaging, {
        vapidKey: finalVapidKey
      });

      if (token) {
        this.currentToken = token;
        console.log('FCM: Registration token obtained successfully:', token.substring(0, 20) + '...');
        console.log('FCM: Token length:', token.length);
        return token;
      } else {
        console.warn('FCM: No registration token available - Firebase returned null/undefined');
        return null;
      }
    } catch (error) {
      // Manejar errores específicos de push service
      if (error instanceof Error) {
        console.error('FCM: Detailed error information:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          isProduction: process.env.NODE_ENV === 'production'
        });
        
        if (error.message.includes('push service not available') || 
            error.message.includes('Registration failed') ||
            error.message.includes('unsupported-browser')) {
          console.warn('FCM: Push service not available - this is normal in development or unsupported environments');
          return null;
        }
      }
      console.error('FCM: Error getting registration token:', error);
      return null;
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  async refreshToken(vapidKey?: string): Promise<string | null> {
    this.currentToken = null;
    return await this.getRegistrationToken(vapidKey);
  }

  async isNotificationSupported(): Promise<boolean> {
    // Esperar a que la inicialización termine
    await this.initializationPromise;
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission | null {
    try {
      if (typeof window === 'undefined' || !window.Notification) {
        return null;
      }
      return window.Notification.permission;
    } catch {
      return null;
    }
  }

  // Método para enviar el token al servidor
  async saveTokenToServer(userId: string, token: string): Promise<boolean> {
    try {
      console.log('FCM: Saving token to server:', { userId, token });
      
      // Use Cloud Function to save token
      const functions = getFunctions(app);
      const saveFCMToken = httpsCallable(functions, 'saveFCMToken');
      
      const result = await saveFCMToken({ userId, token });
      console.log('FCM: Token saved successfully:', result.data);
      
      return true;
    } catch (error) {
      console.error('FCM: Error saving token to server:', error);
      
      // Fallback to direct Firestore write
      try {
        
        const userTokensRef = doc(db, 'fcm_tokens', userId);
        const userTokensDoc = await getDoc(userTokensRef);
        
        if (userTokensDoc.exists()) {
          const tokens = userTokensDoc.data()?.tokens || [];
          if (!tokens.includes(token)) {
            await updateDoc(userTokensRef, {
              tokens: arrayUnion(token),
              lastUpdated: new Date()
            });
          }
        } else {
          await setDoc(userTokensRef, {
            tokens: [token],
            lastUpdated: new Date()
          });
        }
        
        console.log('FCM: Token saved via fallback method');
        return true;
      } catch (fallbackError) {
        console.error('FCM: Fallback save also failed:', fallbackError);
        return false;
      }
    }
  }

  // Método para eliminar token del servidor
  async removeTokenFromServer(userId: string, token: string): Promise<boolean> {
    try {
      console.log('FCM: Removing token from server:', { userId, token });
      
      // Use Cloud Function to remove token
      const functions = getFunctions(app);
      const removeFCMToken = httpsCallable(functions, 'removeFCMToken');
      
      const result = await removeFCMToken({ userId, token });
      console.log('FCM: Token removed successfully:', result.data);
      
      return true;
    } catch (error) {
      console.error('FCM: Error removing token from server:', error);
      
      // Fallback to direct Firestore write
      try {
        
        await updateDoc(doc(db, 'fcm_tokens', userId), {
          tokens: arrayRemove(token),
          lastUpdated: new Date()
        });
        
        console.log('FCM: Token removed via fallback method');
        return true;
      } catch (fallbackError) {
        console.error('FCM: Fallback remove also failed:', fallbackError);
        return false;
      }
    }
  }

  // Limpiar recursos
  cleanup() {
    this.currentToken = null;
    this.messaging = null;
  }
}

export const fcmService = FCMService.getInstance();