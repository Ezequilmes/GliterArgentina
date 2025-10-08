import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export interface PushNotificationData {
  type: 'message' | 'match' | 'like' | 'super_like' | 'visit';
  userId: string;
  chatId?: string;
  senderName?: string;
  senderAvatar?: string;
  messagePreview?: string;
  matchName?: string;
  likerName?: string;
  superLikerName?: string;
  visitorName?: string;
  timestamp?: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: PushNotificationData;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private messaging: any;
  private db: any;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  constructor() {
    try {
      this.messaging = getMessaging();
      this.db = getFirestore();
    } catch (error) {
      console.error('Error initializing PushNotificationService:', error);
    }
  }

  /**
   * Send a push notification to a specific user
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      // Get user's FCM tokens from Firestore
      const userTokensRef = this.db.collection('fcm_tokens').doc(userId);
      const userTokensDoc = await userTokensRef.get();
      
      if (!userTokensDoc.exists) {
        console.log(`No FCM tokens found for user: ${userId}`);
        return false;
      }

      const tokens = userTokensDoc.data()?.tokens || [];
      if (tokens.length === 0) {
        console.log(`No active FCM tokens for user: ${userId}`);
        return false;
      }

      // Prepare the message
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icons/icon-192x192.png',
          image: payload.image,
        },
        data: {
          ...payload.data,
          timestamp: Date.now().toString(),
        },
        tokens: tokens,
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icons/icon-192x192.png',
            image: payload.image,
            badge: '/icons/icon-144x144.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            tag: payload.data?.type || 'general',
          },
          fcm_options: {
            link: this.getNotificationLink(payload.data),
          },
        },
      };

      // Send the notification
      const response = await this.messaging.sendEachForMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(userId, failedTokens);
        }
      }

      console.log(`Push notification sent to ${response.successCount} devices for user: ${userId}`);
      return response.successCount > 0;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send a message notification
   */
  async sendMessageNotification(
    recipientUserId: string,
    senderName: string,
    messagePreview: string,
    chatId: string,
    senderAvatar?: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: `💬 ${senderName}`,
      body: messagePreview,
      icon: senderAvatar || '/icons/icon-192x192.png',
      data: {
        type: 'message',
        userId: recipientUserId,
        chatId,
        senderName,
        senderAvatar,
        messagePreview,
        timestamp: Date.now(),
      },
    };

    return this.sendToUser(recipientUserId, payload);
  }

  /**
   * Send a match notification
   */
  async sendMatchNotification(
    userId: string,
    matchName: string,
    matchAvatar?: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: '💖 ¡Nuevo match!',
      body: `¡Hiciste match con ${matchName}!`,
      icon: matchAvatar || '/icons/icon-192x192.png',
      data: {
        type: 'match',
        userId,
        matchName,
        timestamp: Date.now(),
      },
    };

    return this.sendToUser(userId, payload);
  }

  /**
   * Send a like notification
   */
  async sendLikeNotification(
    userId: string,
    likerName: string,
    likerAvatar?: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: '👍 ¡Te dieron like!',
      body: `A ${likerName} le gustas`,
      icon: likerAvatar || '/icons/icon-192x192.png',
      data: {
        type: 'like',
        userId,
        likerName,
        timestamp: Date.now(),
      },
    };

    return this.sendToUser(userId, payload);
  }

  /**
   * Send a super like notification
   */
  async sendSuperLikeNotification(
    userId: string,
    superLikerName: string,
    superLikerAvatar?: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: '⭐ ¡Super Like!',
      body: `¡${superLikerName} te dio un Super Like!`,
      icon: superLikerAvatar || '/icons/icon-192x192.png',
      data: {
        type: 'super_like',
        userId,
        superLikerName,
        timestamp: Date.now(),
      },
    };

    return this.sendToUser(userId, payload);
  }

  /**
   * Send a profile visit notification
   */
  async sendVisitNotification(
    userId: string,
    visitorName: string,
    visitorAvatar?: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: '👀 Visita a tu perfil',
      body: `${visitorName} visitó tu perfil`,
      icon: visitorAvatar || '/icons/icon-192x192.png',
      data: {
        type: 'visit',
        userId,
        visitorName,
        timestamp: Date.now(),
      },
    };

    return this.sendToUser(userId, payload);
  }

  /**
   * Get the appropriate link for the notification
   */
  private getNotificationLink(data?: PushNotificationData): string {
    if (!data) return '/';

    switch (data.type) {
      case 'message':
        return data.chatId ? `/chat/${data.chatId}` : '/chat';
      case 'match':
        return '/matches';
      case 'like':
      case 'super_like':
        return '/discover';
      case 'visit':
        return '/profile';
      default:
        return '/';
    }
  }

  /**
   * Remove invalid FCM tokens
   */
  private async removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
    try {
      const userTokensRef = this.db.collection('fcm_tokens').doc(userId);
      const userTokensDoc = await userTokensRef.get();
      
      if (userTokensDoc.exists) {
        const currentTokens = userTokensDoc.data()?.tokens || [];
        const validTokens = currentTokens.filter((token: string) => !invalidTokens.includes(token));
        
        await userTokensRef.update({ tokens: validTokens });
        console.log(`Removed ${invalidTokens.length} invalid tokens for user: ${userId}`);
      }
    } catch (error) {
      console.error('Error removing invalid tokens:', error);
    }
  }

  /**
   * Save FCM token for a user
   */
  async saveUserToken(userId: string, token: string): Promise<boolean> {
    try {
      const userTokensRef = this.db.collection('fcm_tokens').doc(userId);
      const userTokensDoc = await userTokensRef.get();
      
      let tokens: string[] = [];
      if (userTokensDoc.exists) {
        tokens = userTokensDoc.data()?.tokens || [];
      }

      // Add token if it doesn't exist
      if (!tokens.includes(token)) {
        tokens.push(token);
        await userTokensRef.set({ 
          tokens,
          lastUpdated: new Date(),
        }, { merge: true });
        console.log(`FCM token saved for user: ${userId}`);
      }

      return true;
    } catch (error) {
      console.error('Error saving FCM token:', error);
      return false;
    }
  }

  /**
   * Remove FCM token for a user
   */
  async removeUserToken(userId: string, token: string): Promise<boolean> {
    try {
      const userTokensRef = this.db.collection('fcm_tokens').doc(userId);
      const userTokensDoc = await userTokensRef.get();
      
      if (userTokensDoc.exists) {
        const tokens = userTokensDoc.data()?.tokens || [];
        const updatedTokens = tokens.filter((t: string) => t !== token);
        
        await userTokensRef.update({ tokens: updatedTokens });
        console.log(`FCM token removed for user: ${userId}`);
      }

      return true;
    } catch (error) {
      console.error('Error removing FCM token:', error);
      return false;
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();