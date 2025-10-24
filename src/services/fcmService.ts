import { getMessaging, getToken, onMessage, MessagePayload, isSupported, type Messaging } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import app, { db } from '../lib/firebase';
import { notificationService, type Notification } from './notificationService';

export interface FCMNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export class FCMService {
  private static instance: FCMService;
  private messaging: Messaging | null = null;
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
      if (!app) {
        throw new Error('Firebase app is not initialized');
      }
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
        
        // Reproducir sonido para mensajes nuevos
        this.playNotificationSound(payload);
        
        // Mostrar notificación personalizada cuando la app está en primer plano
        this.showNotification(payload);
        
        // Crear notificación en la base de datos si es necesario
        this.handleIncomingMessage(payload);
      });
    } catch (error) {
      console.error('FCM: Error setting up foreground message listener:', error);
    }
  }

  private playNotificationSound(payload: MessagePayload) {
    try {
      const messageType = payload.data?.type;
      
      // Reproducir sonido específico para mensajes
      if (messageType === 'message') {
        const audio = new Audio('/sounds/newMessage.mp3');
        audio.volume = 0.8;
        audio.play().catch(error => {
          console.warn('FCM: Could not play notification sound:', error);
        });
      }
    } catch (error) {
      console.error('FCM: Error playing notification sound:', error);
    }
  }

  private async showNotification(payload: MessagePayload) {
    if (!('Notification' in window)) return;

    const { title, body, icon } = payload.notification || {};
    
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
        } as NotificationOptions);
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
          type: notificationType as Notification['type'],
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
    } catch (error: unknown) {
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



  async isNotificationSupported(): Promise<boolean> {
    // Esperar a que la inicialización termine
    await this.initializationPromise;
    return this.isSupported;
  }

  getPermissionStatus(): NotificationPermission {
    try {
      if (typeof window === 'undefined' || !window.Notification) {
        return 'denied';
      }
      return window.Notification.permission || 'default';
    } catch {
      return 'denied';
    }
  }

  // Método para enviar el token al servidor
  async saveTokenToServer(userId: string, token: string): Promise<boolean> {
    try {
      console.log('FCM: Saving token to server:', { userId, token });
      
      // Use Cloud Function to save token
      if (!app) {
        throw new Error('Firebase app is not initialized');
      }
      const functions = getFunctions(app);
      const saveFCMToken = httpsCallable(functions, 'saveFCMToken');
      
      const result = await saveFCMToken({ userId, token });
      console.log('FCM: Token saved successfully:', result.data);
      
      return true;
    } catch (error: unknown) {
      console.error('FCM: Error saving token to server:', error);
      
      // Fallback to direct Firestore write
      try {
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        const userTokensRef = doc(db, 'fcmTokens', userId);
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
      } catch (fallbackError: unknown) {
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
      if (!app) {
        throw new Error('Firebase app is not initialized');
      }
      const functions = getFunctions(app);
      const removeFCMToken = httpsCallable(functions, 'removeFCMToken');
      
      const result = await removeFCMToken({ userId, token });
      console.log('FCM: Token removed successfully:', result.data);
      
      return true;
    } catch (error: unknown) {
      console.error('FCM: Error removing token from server:', error);
      
      // Fallback to direct Firestore write
      try {
        if (!db) {
          throw new Error('Firestore is not initialized');
        }
        await updateDoc(doc(db, 'fcmTokens', userId), {
          tokens: arrayRemove(token),
          lastUpdated: new Date()
        });
        
        console.log('FCM: Token removed via fallback method');
        return true;
      } catch (fallbackError: unknown) {
        console.error('FCM: Fallback remove also failed:', fallbackError);
        return false;
      }
    }
  }

  // Método para refrescar el token FCM
  async refreshToken(): Promise<string | null> {
    try {
      console.log('FCM: Refreshing token...');
      
      if (!this.messaging) {
        console.log('FCM: Messaging not initialized, waiting for initialization...');
        await this.initializationPromise;
      }

      if (!this.messaging) {
        throw new Error('Firebase Messaging is not available');
      }

      // Eliminar el token actual del cache
      this.currentToken = null;

      // Obtener un nuevo token
      const newToken = await this.getRegistrationToken();
      
      if (newToken) {
        console.log('FCM: Token refreshed successfully');
        return newToken;
      } else {
        console.warn('FCM: Failed to refresh token');
        return null;
      }
    } catch (error) {
      console.error('FCM: Error refreshing token:', error);
      return null;
    }
  }

  // Método para limpiar tokens inválidos de un usuario
  async cleanupInvalidTokens(userId: string): Promise<void> {
    try {
      console.log('FCM: Cleaning up invalid tokens for user:', userId);
      
      if (!this.isSupported) {
        console.log('FCM: Not supported, skipping cleanup');
        return;
      }

      if (!db) {
        throw new Error('Firestore is not initialized');
      }

      const userTokensRef = doc(db, 'fcmTokens', userId);
      const userTokensDoc = await getDoc(userTokensRef);
      
      if (!userTokensDoc.exists()) {
        console.log('FCM: No tokens found for user:', userId);
        return;
      }

      const tokens = userTokensDoc.data()?.tokens || [];
      if (tokens.length === 0) {
        console.log('FCM: No tokens to clean for user:', userId);
        return;
      }

      // Validar cada token usando Cloud Function
      const validTokens: string[] = [];
      
      if (app) {
        const functions = getFunctions(app);
        const validateToken = httpsCallable(functions, 'validateFCMToken');
        
        for (const token of tokens) {
          try {
            // Validación básica de formato primero
            if (!token || typeof token !== 'string' || token.length < 50) {
              console.warn('FCM: Invalid token format:', token);
              continue;
            }

            // Validar con Firebase usando Cloud Function
            const result = await validateToken({ token });
            const data = result.data as { valid: boolean; reason?: string; warning?: string };
            
            if (data.valid) {
              validTokens.push(token);
              if (data.warning) {
                console.warn(`FCM: Token validation warning for ${token}:`, data.warning);
              }
            } else {
              console.warn(`FCM: Invalid token removed: ${token}, reason: ${data.reason}`);
            }
          } catch (error) {
            console.warn('FCM: Error validating token:', token, error);
            // En caso de error, mantener el token para evitar pérdida de datos
            validTokens.push(token);
          }
        }
      } else {
        // Si no hay Cloud Functions disponibles, mantener todos los tokens
        validTokens.push(...tokens);
      }

      // Actualizar la lista con solo tokens válidos
      if (validTokens.length !== tokens.length) {
        await updateDoc(userTokensRef, {
          tokens: validTokens,
          lastUpdated: new Date(),
          lastCleanup: new Date()
        });
        
        console.log(`FCM: Cleaned up ${tokens.length - validTokens.length} invalid tokens for user: ${userId}`);
      } else {
        console.log('FCM: All tokens are valid for user:', userId);
      }
    } catch (error) {
      console.error('FCM: Error cleaning up invalid tokens:', error);
    }
  }

  // Limpiar recursos
  cleanup() {
    this.currentToken = null;
    this.messaging = null;
  }
}

export const fcmService = FCMService.getInstance();