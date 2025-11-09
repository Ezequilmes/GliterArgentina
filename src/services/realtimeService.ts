import { 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  onDisconnect,
  remove,
  update,
  get
} from 'firebase/database';
import { database } from '@/lib/firebase';

// Función para verificar si Firebase está disponible
function isFirebaseAvailable(): boolean {
  return typeof window !== 'undefined' && !!database;
}

// Función para obtener la instancia de la base de datos
function getDatabase() {
  if (!isFirebaseAvailable()) {
    throw new Error('Firebase Realtime Database is not available on server side');
  }
  return database;
}

export interface PresenceData {
  isOnline: boolean;
  lastSeen: number;
  status?: 'online' | 'away' | 'busy';
}

export interface TypingData {
  isTyping: boolean;
  timestamp: number;
}

export interface ChatPresence {
  [userId: string]: PresenceData;
}

export interface ChatTyping {
  [userId: string]: TypingData;
}

// Tipos para notificaciones instantáneas
export interface InstantNotificationPayload {
  type: 'message' | 'match' | 'like' | 'super_like';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface InstantNotification extends InstantNotificationPayload {
  id: string;
  timestamp: number;
  read: boolean;
}

class RealtimeService {
  private getPresenceRef() {
    return ref(getDatabase(), 'presence');
  }
  
  private getTypingRef() {
    return ref(getDatabase(), 'typing');
  }
  
  private getOnlineRef() {
    return ref(getDatabase(), '.info/connected');
  }

  // Configurar presencia del usuario
  async setUserPresence(userId: string, status: 'online' | 'away' | 'busy' = 'online'): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, skipping presence setup');
      return;
    }
    
    const userPresenceRef = ref(getDatabase(), `presence/${userId}`);
    const presenceData: PresenceData = {
      isOnline: true,
      lastSeen: Date.now(),
      status
    };

    try {
      // Establecer presencia
      await set(userPresenceRef, presenceData);

      // Configurar desconexión automática
      const disconnectRef = onDisconnect(userPresenceRef);
      await disconnectRef.set({
        isOnline: false,
        lastSeen: Date.now(),
        status: 'away'
      });

      console.log(`Presencia establecida para usuario ${userId}`);
    } catch (error) {
      console.error('Error setting user presence:', error);
      throw error;
    }
  }

  // Escuchar presencia de usuarios
  onUserPresence(userIds: string[], callback: (presence: { [userId: string]: PresenceData }) => void): () => void {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, returning empty unsubscribe function');
      return () => {};
    }
    
    const listeners: Array<() => void> = [];
    const presenceData: { [userId: string]: PresenceData } = {};

    userIds.forEach(userId => {
      const userPresenceRef = ref(getDatabase(), `presence/${userId}`);
      
      const unsubscribe = onValue(userPresenceRef, (snapshot) => {
        const data = snapshot.val() as PresenceData | null;
        if (data) {
          presenceData[userId] = data;
        } else {
          presenceData[userId] = {
            isOnline: false,
            lastSeen: Date.now(),
            status: 'away'
          };
        }
        callback({ ...presenceData });
      });

      listeners.push(() => off(userPresenceRef, 'value', unsubscribe));
    });

    return () => {
      listeners.forEach(unsubscribe => unsubscribe());
    };
  }

  // Establecer estado de escritura
  async setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, skipping typing status');
      return;
    }
    
    const typingRef = ref(getDatabase(), `typing/${chatId}/${userId}`);
    
    try {
      if (isTyping) {
        const typingData: TypingData = {
          isTyping: true,
          timestamp: Date.now()
        };
        await set(typingRef, typingData);

        // Auto-remove typing status after 3 seconds
        setTimeout(async () => {
          try {
            await remove(typingRef);
          } catch (error) {
            console.error('Error removing typing status:', error);
          }
        }, 3000);
      } else {
        await remove(typingRef);
      }
    } catch (error) {
      console.error('Error setting typing status:', error);
      throw error;
    }
  }

  // Escuchar estado de escritura en un chat
  onTypingStatus(chatId: string, callback: (typing: ChatTyping) => void): () => void {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, returning empty unsubscribe function');
      return () => {};
    }
    
    const chatTypingRef = ref(getDatabase(), `typing/${chatId}`);
    
    const unsubscribe = onValue(chatTypingRef, (snapshot) => {
      const data = snapshot.val() as ChatTyping | null;
      callback(data || {});
    });

    return () => off(chatTypingRef, 'value', unsubscribe);
  }

  /**
   * Envia una notificación instantánea al usuario en Realtime Database.
   *
   * @param userId - ID del usuario destino
   * @param notification - Datos de la notificación a enviar
   */
  async sendInstantNotification(userId: string, notification: InstantNotificationPayload): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, skipping notification');
      return;
    }
    
    const notificationRef = ref(getDatabase(), `notifications/${userId}`);
    const newNotificationRef = push(notificationRef);
    
    try {
      await set(newNotificationRef, {
        ...notification,
        timestamp: Date.now(),
        read: false
      });
    } catch (error) {
      console.error('Error sending instant notification:', error);
      throw error;
    }
  }

  /**
   * Escucha las notificaciones instantáneas de un usuario.
   * Devuelve una función para cancelar la suscripción.
   *
   * @param userId - ID del usuario
   * @param callback - Handler que recibe el listado de notificaciones
   */
  onInstantNotifications(userId: string, callback: (notifications: InstantNotification[]) => void): () => void {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, returning empty unsubscribe function');
      return () => {};
    }
    
    const userNotificationsRef = ref(getDatabase(), `notifications/${userId}`);
    
    const unsubscribe = onValue(userNotificationsRef, (snapshot) => {
      const data = snapshot.val() as Record<string, Omit<InstantNotification, 'id'>> | null;
      if (data) {
        const notifications: InstantNotification[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        callback(notifications);
      } else {
        callback([]);
      }
    });

    return () => off(userNotificationsRef, 'value', unsubscribe);
  }

  // Marcar notificación como leída
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, skipping mark as read');
      return;
    }
    
    const notificationRef = ref(getDatabase(), `notifications/${userId}/${notificationId}`);
    
    try {
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Limpiar notificaciones leídas
  async clearReadNotifications(userId: string): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, skipping clear notifications');
      return;
    }
    
    const userNotificationsRef = ref(getDatabase(), `notifications/${userId}`);
    
    try {
      const snapshot = await get(userNotificationsRef);
      const data = snapshot.val();
      
      if (data) {
        const updates: { [key: string]: null } = {};
        Object.keys(data).forEach(key => {
          if (data[key].read) {
            updates[key] = null;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(userNotificationsRef, updates);
        }
      }
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      throw error;
    }
  }

  // Obtener estado de conexión
  onConnectionStatus(callback: (isConnected: boolean) => void): () => void {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, returning empty unsubscribe function');
      return () => {};
    }
    
    const onlineRef = this.getOnlineRef();
    const unsubscribe = onValue(onlineRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      callback(isConnected);
    });

    return () => off(onlineRef, 'value', unsubscribe);
  }

  // Limpiar presencia del usuario al desconectarse
  async clearUserPresence(userId: string): Promise<void> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, skipping clear presence');
      return;
    }
    
    const userPresenceRef = ref(getDatabase(), `presence/${userId}`);
    
    try {
      await remove(userPresenceRef);
    } catch (error) {
      console.error('Error clearing user presence:', error);
      throw error;
    }
  }

  // Obtener usuarios en línea de una lista
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available on server side, returning empty array');
      return [];
    }
    
    const onlineUsers: string[] = [];
    
    try {
      for (const userId of userIds) {
        const userPresenceRef = ref(getDatabase(), `presence/${userId}`);
        const snapshot = await get(userPresenceRef);
        const data = snapshot.val() as PresenceData | null;
        
        if (data && data.isOnline) {
          onlineUsers.push(userId);
        }
      }
      
      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      throw error;
    }
  }
}
// Robust singleton export to avoid duplicate instances across HMR/SSR
declare global {
  var __RealtimeServiceInstance__: RealtimeService | undefined;
}

const realtimeSingleton = globalThis.__RealtimeServiceInstance__ || new RealtimeService();
globalThis.__RealtimeServiceInstance__ = realtimeSingleton;

export const realtimeService = realtimeSingleton;
