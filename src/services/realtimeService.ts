import { 
  ref, 
  set, 
  push, 
  onValue, 
  off, 
  serverTimestamp, 
  onDisconnect,
  remove,
  update,
  child,
  get
} from 'firebase/database';
import { database } from '@/lib/firebase';

// Validar que la base de datos esté inicializada
if (!database) {
  console.error('❌ Firebase Realtime Database is not initialized. Check your Firebase configuration.');
  throw new Error('Firebase Realtime Database is not initialized');
}

const rtdb = database;

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

class RealtimeService {
  private presenceRef = ref(rtdb, 'presence');
  private typingRef = ref(rtdb, 'typing');
  private onlineRef = ref(rtdb, '.info/connected');

  // Configurar presencia del usuario
  async setUserPresence(userId: string, status: 'online' | 'away' | 'busy' = 'online'): Promise<void> {
    const userPresenceRef = ref(rtdb, `presence/${userId}`);
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
    const listeners: Array<() => void> = [];
    const presenceData: { [userId: string]: PresenceData } = {};

    userIds.forEach(userId => {
      const userPresenceRef = ref(rtdb, `presence/${userId}`);
      
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
    const typingRef = ref(rtdb, `typing/${chatId}/${userId}`);
    
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
    const chatTypingRef = ref(rtdb, `typing/${chatId}`);
    
    const unsubscribe = onValue(chatTypingRef, (snapshot) => {
      const data = snapshot.val() as ChatTyping | null;
      callback(data || {});
    });

    return () => off(chatTypingRef, 'value', unsubscribe);
  }

  // Enviar notificación instantánea
  async sendInstantNotification(userId: string, notification: {
    type: 'message' | 'match' | 'like' | 'super_like';
    title: string;
    body: string;
    data?: any;
  }): Promise<void> {
    const notificationRef = ref(rtdb, `notifications/${userId}`);
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

  // Escuchar notificaciones instantáneas
  onInstantNotifications(userId: string, callback: (notifications: any[]) => void): () => void {
    const userNotificationsRef = ref(rtdb, `notifications/${userId}`);
    
    const unsubscribe = onValue(userNotificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notifications = Object.keys(data).map(key => ({
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
    const notificationRef = ref(rtdb, `notifications/${userId}/${notificationId}`);
    
    try {
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Limpiar notificaciones leídas
  async clearReadNotifications(userId: string): Promise<void> {
    const userNotificationsRef = ref(rtdb, `notifications/${userId}`);
    
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
    const unsubscribe = onValue(this.onlineRef, (snapshot) => {
      const isConnected = snapshot.val() === true;
      callback(isConnected);
    });

    return () => off(this.onlineRef, 'value', unsubscribe);
  }

  // Limpiar presencia del usuario al desconectarse
  async clearUserPresence(userId: string): Promise<void> {
    const userPresenceRef = ref(rtdb, `presence/${userId}`);
    
    try {
      await remove(userPresenceRef);
    } catch (error) {
      console.error('Error clearing user presence:', error);
      throw error;
    }
  }

  // Obtener usuarios en línea de una lista
  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    const onlineUsers: string[] = [];
    
    try {
      for (const userId of userIds) {
        const userPresenceRef = ref(rtdb, `presence/${userId}`);
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

export const realtimeService = new RealtimeService();