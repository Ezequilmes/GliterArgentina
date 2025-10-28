import { fcmService } from './fcmService';
import { notificationService } from './notificationService';
import { User } from '@/types';

export interface FCMNotificationData {
  type: 'match' | 'message' | 'super_like' | 'like' | 'visit' | 'general';
  userId?: string;
  chatId?: string;
  matchId?: string;
  messageId?: string;
  senderName?: string;
  url?: string;
  [key: string]: unknown;
}

interface NotificationConfig {
  icon: string;
  sound: string;
  category: string;
  badge?: string;
  vibrate?: number[];
}

export interface FCMNotificationPayload {
  title: string;
  body: string;
  data: FCMNotificationData;
  icon?: string;
  sound?: string;
  category?: string;
  actions?: FCMNotificationAction[];
}

export interface FCMNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class FCMNotificationService {
  private readonly API_ENDPOINT = '/api/send-fcm-notification';

  private getNotificationConfig(type: FCMNotificationData['type']): NotificationConfig {
    const configs: Record<FCMNotificationData['type'], NotificationConfig> = {
      match: {
        icon: '/icons/notification-match.svg',
        sound: '/sounds/messenger-tono-mensaje-.mp3',
        category: 'social',
        badge: '/icons/notification-match.svg',
        vibrate: [200, 100, 200]
      },
      message: {
        icon: '/icons/notification-message.svg',
        sound: '/sounds/receive_chat.mp3',
        category: 'message',
        badge: '/icons/notification-message.svg',
        vibrate: [100, 50, 100]
      },
      like: {
        icon: '/icons/notification-like.svg',
        sound: '/sounds/refresh.mp3',
        category: 'social',
        badge: '/icons/notification-like.svg',
        vibrate: [150]
      },
      super_like: {
        icon: '/icons/notification-superlike.svg',
        sound: '/sounds/voip_call.mp3',
        category: 'social',
        badge: '/icons/notification-superlike.svg',
        vibrate: [200, 100, 200, 100, 200]
      },
      visit: {
        icon: '/icons/notification-visit.svg',
        sound: '/sounds/refresh.mp3',
        category: 'social',
        badge: '/icons/notification-visit.svg',
        vibrate: [100]
      },
      general: {
        icon: '/icons/icon-192x192.png',
        sound: '/sounds/refresh.mp3',
        category: 'general',
        badge: '/icons/icon-192x192.png',
        vibrate: [100]
      }
    };

    return configs[type];
  }

  private getDefaultActions(type: FCMNotificationData['type']): FCMNotificationAction[] {
    const actionMap: Record<FCMNotificationData['type'], FCMNotificationAction[]> = {
      match: [
        { action: 'open_chat', title: 'Enviar mensaje', icon: '/icons/icon-96x96.png' },
        { action: 'view_profile', title: 'Ver perfil' }
      ],
      message: [
        { action: 'reply', title: 'Responder', icon: '/icons/icon-96x96.png' },
        { action: 'mark_read', title: 'Marcar como leído' }
      ],
      super_like: [
        { action: 'view_profile', title: 'Ver perfil', icon: '/icons/icon-96x96.png' },
        { action: 'like_back', title: 'Dar like' }
      ],
      like: [
        { action: 'view_profile', title: 'Ver perfil' },
        { action: 'like_back', title: 'Dar like' }
      ],
      visit: [
        { action: 'view_profile', title: 'Ver perfil' }
      ],
      general: []
    };
    return actionMap[type] || [];
  }

  private async sendNotification(
    token: string,
    title: string,
    body: string,
    data: FCMNotificationData,
    options?: {
      icon?: string;
      image?: string;
      badge?: string;
      sound?: string;
      category?: string;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    }
  ): Promise<boolean> {
    const config = this.getNotificationConfig(data.type);

    try {
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          title,
          body,
          data,
          icon: options?.icon || config.icon,
          badge: options?.badge || config.badge || config.icon,
          sound: options?.sound || config.sound,
          category: options?.category || config.category,
          actions: options?.actions || this.getDefaultActions(data.type)
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Notificación FCM enviada:', result.messageId);
        return true;
      } else {
        console.error('❌ Error enviando notificación FCM:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error en servicio de notificaciones FCM:', error);
      return false;
    }
  }

  /**
   * Obtiene el token FCM del usuario desde Firestore
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUserFCMToken(_userId: string): Promise<string | null> {
    try {
      // Aquí deberías obtener el token desde Firestore donde lo guardas
      // Por ahora retornamos null para implementar después
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo token FCM del usuario:', error);
      return null;
    }
  }

  /**
   * Notifica un nuevo match (FCM + Firestore)
   */
  async notifyNewMatch(userId: string, matchedUser: User): Promise<void> {
    try {
      // 1. Crear notificación en Firestore
      await notificationService.createMatchNotification(userId, {
        name: matchedUser.name,
        id: matchedUser.id
      });

      // 2. Obtener token FCM del usuario
      const userToken = await this.getUserFCMToken(userId);
      if (!userToken) {
        console.log('⚠️ Usuario no tiene token FCM, solo se guardó en Firestore');
        return;
      }

      // 3. Enviar notificación FCM
      const payload: FCMNotificationPayload = {
        title: '💕 ¡Nuevo match!',
        body: `¡Tienes un nuevo match con ${matchedUser.name}! Envía el primer mensaje.`,
        data: {
          type: 'match',
          userId: matchedUser.id,
          url: '/matches'
        },
        icon: '/icons/icon-192x192.png',
        sound: '/sounds/messenger-tono-mensaje-.mp3',
        category: 'social',
        actions: [
          {
            action: 'open_chat',
            title: 'Enviar mensaje',
            icon: '/icons/icon-96x96.png'
          },
          {
            action: 'view_profile',
            title: 'Ver perfil'
          }
        ]
      };

      await this.sendFCMNotification(userToken, payload);
    } catch (error) {
      console.error('❌ Error notificando nuevo match:', error);
    }
  }

  /**
   * Notifica un nuevo mensaje (FCM + Firestore)
   */
  async notifyNewMessage(userId: string, sender: User, messagePreview: string, chatId: string): Promise<void> {
    try {
      // 1. Crear notificación en Firestore
      await notificationService.createMessageNotification(userId, {
        name: sender.name,
        id: sender.id
      }, messagePreview);

      // 2. Obtener token FCM del usuario
      const userToken = await this.getUserFCMToken(userId);
      if (!userToken) {
        console.log('⚠️ Usuario no tiene token FCM, solo se guardó en Firestore');
        return;
      }

      // 3. Enviar notificación FCM
      const payload: FCMNotificationPayload = {
        title: `💬 Mensaje de ${sender.name}`,
        body: messagePreview.length > 50 ? `${messagePreview.substring(0, 50)}...` : messagePreview,
        data: {
          type: 'message',
          chatId,
          userId: sender.id,
          url: `/chat/${chatId}`
        },
        icon: '/icons/icon-192x192.png',
        sound: '/sounds/messenger-tono-mensaje-.mp3',
        category: 'message',
        actions: [
          {
            action: 'reply',
            title: 'Responder',
            icon: '/icons/icon-96x96.png'
          },
          {
            action: 'mark_read',
            title: 'Marcar como leído'
          }
        ]
      };

      await this.sendFCMNotification(userToken, payload);
    } catch (error) {
      console.error('❌ Error notificando nuevo mensaje:', error);
    }
  }

  /**
   * Notifica un super like recibido (FCM + Firestore)
   */
  async notifySuperLike(userId: string, likerUser: User): Promise<void> {
    try {
      // 1. Crear notificación en Firestore
      await notificationService.createSuperLikeNotification(userId, {
        name: likerUser.name,
        id: likerUser.id
      });

      // 2. Obtener token FCM del usuario
      const userToken = await this.getUserFCMToken(userId);
      if (!userToken) {
        console.log('⚠️ Usuario no tiene token FCM, solo se guardó en Firestore');
        return;
      }

      // 3. Enviar notificación FCM
      const payload: FCMNotificationPayload = {
        title: '⭐ ¡Super Like!',
        body: `¡${likerUser.name} te ha dado un Super Like! Le gustas mucho.`,
        data: {
          type: 'super_like',
          userId: likerUser.id,
          url: '/discover'
        },
        icon: '/icons/icon-192x192.png',
        sound: '/sounds/refresh.mp3',
        category: 'social',
        actions: [
          {
            action: 'view_profile',
            title: 'Ver perfil',
            icon: '/icons/icon-96x96.png'
          },
          {
            action: 'like_back',
            title: 'Dar like'
          }
        ]
      };

      await this.sendFCMNotification(userToken, payload);
    } catch (error) {
      console.error('❌ Error notificando super like:', error);
    }
  }

  /**
   * Notifica un like normal recibido (FCM + Firestore)
   */
  async notifyLike(userId: string, likerUser: User): Promise<void> {
    try {
      // 1. Crear notificación en Firestore
      await notificationService.createLikeNotification(userId, {
        name: likerUser.name,
        id: likerUser.id
      });

      // 2. Obtener token FCM del usuario
      const userToken = await this.getUserFCMToken(userId);
      if (!userToken) {
        console.log('⚠️ Usuario no tiene token FCM, solo se guardó en Firestore');
        return;
      }

      // 3. Enviar notificación FCM
      const payload: FCMNotificationPayload = {
        title: '❤️ ¡Nuevo like!',
        body: `¡${likerUser.name} te ha dado like! ¿Le darás like también?`,
        data: {
          type: 'like',
          userId: likerUser.id,
          url: '/discover'
        },
        icon: '/icons/icon-192x192.png',
        sound: '/sounds/refresh.mp3',
        category: 'social',
        actions: [
          {
            action: 'view_profile',
            title: 'Ver perfil'
          },
          {
            action: 'like_back',
            title: 'Dar like'
          }
        ]
      };

      await this.sendFCMNotification(userToken, payload);
    } catch (error) {
      console.error('❌ Error notificando like:', error);
    }
  }

  /**
   * Notifica una visita al perfil (FCM + Firestore)
   */
  async notifyProfileVisit(userId: string, visitorUser: User): Promise<void> {
    try {
      // 1. Crear notificación en Firestore
      await notificationService.createVisitNotification(userId, {
        name: visitorUser.name,
        id: visitorUser.id
      });

      // 2. Obtener token FCM del usuario
      const userToken = await this.getUserFCMToken(userId);
      if (!userToken) {
        console.log('⚠️ Usuario no tiene token FCM, solo se guardó en Firestore');
        return;
      }

      // 3. Enviar notificación FCM
      const payload: FCMNotificationPayload = {
        title: '👀 Visita a tu perfil',
        body: `${visitorUser.name} ha visitado tu perfil. ¡Échale un vistazo!`,
        data: {
          type: 'visit',
          userId: visitorUser.id,
          url: '/discover'
        },
        icon: '/icons/icon-192x192.png',
        sound: '/sounds/refresh.mp3',
        category: 'social',
        actions: [
          {
            action: 'view_profile',
            title: 'Ver perfil'
          }
        ]
      };

      await this.sendFCMNotification(userToken, payload);
    } catch (error) {
      console.error('❌ Error notificando visita al perfil:', error);
    }
  }

  /**
   * Obtiene el token FCM del usuario actual
   */
  async getCurrentUserToken(): Promise<string | null> {
    try {
      return await fcmService.getRegistrationToken();
    } catch (error) {
      console.error('❌ Error obteniendo token FCM:', error);
      return null;
    }
  }

  /**
   * Solicita permisos de notificación
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window) || typeof window.Notification === 'undefined') {
        throw new Error('Este navegador no soporta notificaciones');
      }

      const permission = await window.Notification.requestPermission();
      console.log('🔐 Permiso de notificaciones:', permission);
      return permission;
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return 'denied';
    }
  }

  /**
   * Verifica si las notificaciones están habilitadas
   */
  areNotificationsEnabled(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted';
  }

  /**
   * Envía una notificación de prueba
   */
  async sendTestNotification(): Promise<boolean> {
    const token = await this.getCurrentUserToken();
    if (!token) {
      console.error('❌ No hay token FCM disponible');
      return false;
    }

    return this.sendNotification(
      token,
      '🧪 Notificación de prueba',
      'Esta es una notificación de prueba de Gliter Argentina. ¡Todo funciona correctamente!',
      {
        type: 'general',
        url: '/'
      }
    );
  }

  /**
   * Método para enviar notificación FCM con payload completo
   */
  async sendFCMNotification(token: string, payload: FCMNotificationPayload): Promise<boolean> {
    return this.sendNotification(
      token,
      payload.title,
      payload.body,
      payload.data,
      {
        icon: payload.icon,
        sound: payload.sound,
        category: payload.category,
        actions: payload.actions
      }
    );
  }

  /**
   * Envía notificación de nuevo match
   */
  async sendNewMatchNotification(
    userId: string,
    matchedUser: { name: string; photoURL?: string }
  ): Promise<boolean> {
    try {
      const token = await this.getUserFCMToken(userId);
      if (!token) {
        console.log('No FCM token found for user:', userId);
        return false;
      }

      return await this.sendNotification(
        token,
        '¡Nuevo Match! 💕',
        `¡Tienes un nuevo match con ${matchedUser.name}!`,
        {
          type: 'match',
          userId: userId,
          matchedUserId: userId,
          matchedUserName: matchedUser.name,
          timestamp: Date.now().toString()
        },
        {
          image: matchedUser.photoURL
        }
      );
    } catch (error) {
      console.error('Error sending match notification:', error);
      return false;
    }
  }

  /**
   * Envía notificación de nuevo mensaje
   */
  async sendNewMessageNotification(
    receiverId: string,
    sender: { name: string; photoURL?: string },
    messagePreview: string
  ): Promise<boolean> {
    try {
      const token = await this.getUserFCMToken(receiverId);
      if (!token) {
        console.log('No FCM token found for user:', receiverId);
        return false;
      }

      return await this.sendNotification(
        token,
        `Nuevo mensaje de ${sender.name}`,
        messagePreview,
        {
          type: 'message',
          senderId: receiverId,
          senderName: sender.name,
          messagePreview,
          timestamp: Date.now().toString()
        },
        {
          image: sender.photoURL
        }
      );
    } catch (error) {
      console.error('Error sending message notification:', error);
      return false;
    }
  }

  /**
   * Envía notificación de super like
   */
  async sendSuperLikeNotification(
    userId: string,
    superLiker: { name: string; photoURL?: string }
  ): Promise<boolean> {
    try {
      const token = await this.getUserFCMToken(userId);
      if (!token) {
        console.log('No FCM token found for user:', userId);
        return false;
      }

      return await this.sendNotification(
        token,
        '⭐ ¡Super Like!',
        `¡${superLiker.name} te ha dado un Super Like!`,
        {
          type: 'super_like',
          superLikerId: userId,
          superLikerName: superLiker.name,
          timestamp: Date.now().toString()
        },
        {
          image: superLiker.photoURL
        }
      );
    } catch (error) {
      console.error('Error sending super like notification:', error);
      return false;
    }
   }

   /**
    * Envía notificación de like
    */
   async sendLikeNotification(
     userId: string,
     liker: { name: string; photoURL?: string }
   ): Promise<boolean> {
     try {
       const token = await this.getUserFCMToken(userId);
       if (!token) {
         console.log('No FCM token found for user:', userId);
         return false;
       }

       return await this.sendNotification(
         token,
         '💖 ¡Nuevo Like!',
         `¡${liker.name} te ha dado like!`,
         {
           type: 'like',
           likerId: userId,
           likerName: liker.name,
           timestamp: Date.now().toString()
         },
         {
           image: liker.photoURL
         }
       );
     } catch (error) {
       console.error('Error sending like notification:', error);
       return false;
     }
   }

   /**
    * Envía notificación de visita al perfil
    */
   async sendVisitNotification(
     userId: string,
     visitor: { name: string; photoURL?: string }
   ): Promise<boolean> {
     try {
       const token = await this.getUserFCMToken(userId);
       if (!token) {
         console.log('No FCM token found for user:', userId);
         return false;
       }

       return await this.sendNotification(
         token,
         '👀 Visita a tu perfil',
         `${visitor.name} ha visitado tu perfil`,
         {
           type: 'visit',
           visitorId: userId,
           visitorName: visitor.name,
           timestamp: Date.now().toString()
         },
         {
           image: visitor.photoURL
         }
       );
     } catch (error) {
       console.error('Error sending visit notification:', error);
       return false;
     }
   }
 }

 export const fcmNotificationService = new FCMNotificationService();