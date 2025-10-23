import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const db = getFirestore();
const messaging = getMessaging();

/**
 * Cloud Function triggered when a new message is created
 * Sends push notifications to the recipient
 */
export const onMessageCreated = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    try {
      const messageData = event.data?.data();
      const chatId = event.params.chatId;
      const messageId = event.params.messageId;

      if (!messageData) {
        logger.warn('No message data found');
        return;
      }

      logger.info(`New message created in chat ${chatId}:`, messageData);

      // Get chat information
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (!chatDoc.exists) {
        logger.warn(`Chat ${chatId} not found`);
        return;
      }

      const chatData = chatDoc.data();
      const participants = chatData?.participants || [];
      const senderId = messageData.senderId;

      // Find the recipient (the participant who is not the sender)
      const recipientId = participants.find((id: string) => id !== senderId);
      if (!recipientId) {
        logger.warn('No recipient found for message');
        return;
      }

      // Get sender information
      const senderDoc = await db.collection('users').doc(senderId).get();
      if (!senderDoc.exists) {
        logger.warn(`Sender ${senderId} not found`);
        return;
      }

      const senderData = senderDoc.data();
      const senderName = senderData?.name || 'Usuario';
      const senderAvatar = senderData?.photos?.[0]?.url;

      // Get recipient's FCM tokens
      const recipientTokensDoc = await db.collection('fcm_tokens').doc(recipientId).get();
      if (!recipientTokensDoc.exists) {
        logger.info(`No FCM tokens found for recipient: ${recipientId}`);
        return;
      }

      const tokens = recipientTokensDoc.data()?.tokens || [];
      if (tokens.length === 0) {
        logger.info(`No active FCM tokens for recipient: ${recipientId}`);
        return;
      }

      // Prepare message preview
      let messagePreview = 'Nuevo mensaje';
      if (messageData.type === 'text') {
        messagePreview = messageData.content?.substring(0, 100) || 'Nuevo mensaje';
      } else if (messageData.type === 'image') {
        messagePreview = '📷 Imagen';
      } else if (messageData.type === 'audio') {
        messagePreview = '🎵 Audio';
      } else if (messageData.type === 'video') {
        messagePreview = '🎥 Video';
      } else if (messageData.type === 'location') {
        messagePreview = '📍 Ubicación';
      }

      // Prepare the notification payload
      const notificationPayload = {
        notification: {
          title: `💬 ${senderName}`,
          body: messagePreview,
        },
        data: {
          type: 'message',
          chatId: chatId,
          messageId: messageId,
          senderId: senderId,
          senderName: senderName,
          senderAvatar: senderAvatar || '',
          messagePreview: messagePreview,
          timestamp: Date.now().toString(),
        },
        tokens: tokens,
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            title: `💬 ${senderName}`,
            body: messagePreview,
            icon: senderAvatar || '/icons/icon-192x192.png',
            badge: '/icons/icon-144x144.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            silent: false,
            tag: 'message',
            actions: [
              {
                action: 'reply',
                title: '💬 Responder',
              },
              {
                action: 'open',
                title: '👀 Ver chat',
              },
              {
                action: 'close',
                title: '❌ Cerrar',
              },
            ],
          },
          fcm_options: {
            link: `/chat/${chatId}`,
          },
        },
      };

      // Send the notification
      const response = await messaging.sendEachForMulticast(notificationPayload);

      logger.info(`Push notification sent to ${response.successCount} devices for recipient: ${recipientId}`);

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            logger.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          const validTokens = tokens.filter((token: string) => !failedTokens.includes(token));
          await db.collection('fcm_tokens').doc(recipientId).update({ tokens: validTokens });
          logger.info(`Removed ${failedTokens.length} invalid tokens for recipient: ${recipientId}`);
        }
      }

    } catch (error) {
      logger.error('Error sending push notification for new message:', error);
    }
  }
);

/**
 * Cloud Function to send push notifications for matches
 */
export const sendMatchNotification = onCall(async (request) => {
  try {
    const { userId, matchName, matchAvatar } = request.data;

    if (!userId || !matchName) {
      throw new Error('Missing required parameters: userId, matchName');
    }

    // Get user's FCM tokens
    const userTokensDoc = await db.collection('fcm_tokens').doc(userId).get();
    if (!userTokensDoc.exists) {
      logger.info(`No FCM tokens found for user: ${userId}`);
      return { success: false, message: 'No FCM tokens found' };
    }

    const tokens = userTokensDoc.data()?.tokens || [];
    if (tokens.length === 0) {
      logger.info(`No active FCM tokens for user: ${userId}`);
      return { success: false, message: 'No active FCM tokens' };
    }

    const notificationPayload = {
      notification: {
        title: '💖 ¡Nuevo match!',
        body: `¡Hiciste match con ${matchName}!`,
      },
      data: {
        type: 'match',
        userId: userId,
        matchName: matchName,
        timestamp: Date.now().toString(),
      },
      tokens: tokens,
      webpush: {
        notification: {
          title: '💖 ¡Nuevo match!',
          body: `¡Hiciste match con ${matchName}!`,
          icon: matchAvatar || '/icons/icon-192x192.png',
          badge: '/icons/icon-144x144.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          silent: false,
          tag: 'match',
        },
        fcm_options: {
          link: '/matches',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(notificationPayload);
    logger.info(`Match notification sent to ${response.successCount} devices for user: ${userId}`);

    return { success: true, sentCount: response.successCount };
  } catch (error) {
    logger.error('Error sending match notification:', error);
    throw error;
  }
});

/**
 * Cloud Function to send push notifications for likes
 */
export const sendLikeNotification = onCall(async (request) => {
  try {
    const { userId, likerName, likerAvatar, isSuper } = request.data;

    if (!userId || !likerName) {
      throw new Error('Missing required parameters: userId, likerName');
    }

    // Get user's FCM tokens
    const userTokensDoc = await db.collection('fcm_tokens').doc(userId).get();
    if (!userTokensDoc.exists) {
      logger.info(`No FCM tokens found for user: ${userId}`);
      return { success: false, message: 'No FCM tokens found' };
    }

    const tokens = userTokensDoc.data()?.tokens || [];
    if (tokens.length === 0) {
      logger.info(`No active FCM tokens for user: ${userId}`);
      return { success: false, message: 'No active FCM tokens' };
    }

    const title = isSuper ? '⭐ ¡Super Like!' : '👍 ¡Te dieron like!';
    const body = isSuper 
      ? `¡${likerName} te dio un Super Like!`
      : `A ${likerName} le gustas`;

    const notificationPayload = {
      notification: {
        title,
        body,
      },
      data: {
        type: isSuper ? 'super_like' : 'like',
        userId: userId,
        likerName: likerName,
        timestamp: Date.now().toString(),
      },
      tokens: tokens,
      webpush: {
        notification: {
          title,
          body,
          icon: likerAvatar || '/icons/icon-192x192.png',
          badge: '/icons/icon-144x144.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          silent: false,
          tag: isSuper ? 'super_like' : 'like',
        },
        fcm_options: {
          link: '/likes',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(notificationPayload);
    logger.info(`Like notification sent to ${response.successCount} devices for user: ${userId}`);

    return { success: true, sentCount: response.successCount };
  } catch (error) {
    logger.error('Error sending like notification:', error);
    throw error;
  }
});

/**
 * Cloud Function to save FCM token
 */
export const saveFCMToken = onCall(async (request) => {
  try {
    const { userId, token } = request.data;

    if (!userId || !token) {
      throw new Error('Missing required parameters: userId, token');
    }

    const userTokensRef = db.collection('fcm_tokens').doc(userId);
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
      logger.info(`FCM token saved for user: ${userId}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error saving FCM token:', error);
    throw error;
  }
});

/**
 * Cloud Function to remove FCM token
 */
export const removeFCMToken = onCall(async (request) => {
  try {
    const { userId, token } = request.data;

    if (!userId || !token) {
      throw new Error('Missing required parameters: userId, token');
    }

    const userTokensRef = db.collection('fcm_tokens').doc(userId);
    const userTokensDoc = await userTokensRef.get();
    
    if (userTokensDoc.exists) {
      const tokens = userTokensDoc.data()?.tokens || [];
      const updatedTokens = tokens.filter((t: string) => t !== token);
      
      await userTokensRef.update({ tokens: updatedTokens });
      logger.info(`FCM token removed for user: ${userId}`);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error removing FCM token:', error);
    throw error;
  }
});