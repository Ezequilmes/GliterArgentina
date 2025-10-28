import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fcmNotificationService } from '@/services/fcmNotificationService';
import { chatService } from '@/services/chatService';
import { User } from '@/types';

interface NotificationIntegrationOptions {
  enableMatchNotifications?: boolean;
  enableMessageNotifications?: boolean;
  enableLikeNotifications?: boolean;
  enableSuperLikeNotifications?: boolean;
  enableVisitNotifications?: boolean;
}

export function useNotificationIntegration(options: NotificationIntegrationOptions = {}) {
  const { user } = useAuth();
  const {
    enableMatchNotifications = true,
    enableMessageNotifications = true,
    enableLikeNotifications = true,
    enableSuperLikeNotifications = true,
    enableVisitNotifications = true,
  } = options;

  const lastMessageTimestamp = useRef<number>(Date.now());
  const processedNotifications = useRef<Set<string>>(new Set());

  // Función para verificar si una notificación ya fue procesada
  const isNotificationProcessed = (id: string): boolean => {
    return processedNotifications.current.has(id);
  };

  // Función para marcar una notificación como procesada
  const markNotificationAsProcessed = (id: string): void => {
    processedNotifications.current.add(id);
    // Limpiar notificaciones antiguas (más de 1 hora)
    if (processedNotifications.current.size > 1000) {
      processedNotifications.current.clear();
    }
  };

  // Integración con nuevos matches
  useEffect(() => {
    if (!user || !enableMatchNotifications) return;

    // TODO: Implementar suscripción a nuevos matches
    // Aquí se debería suscribir a los eventos de nuevos matches
    // Por ejemplo, escuchando cambios en Firestore
    
    const unsubscribe = () => {}; // Placeholder para futuras implementaciones

    return unsubscribe;
  }, [user, enableMatchNotifications]);

  // Integración con nuevos mensajes
  useEffect(() => {
    if (!user || !enableMessageNotifications) return;

    // TODO: Implementar suscripción a nuevos mensajes
    // Las notificaciones de mensajes se manejan directamente en chatService.ts
    // cuando se envía un mensaje
    
    const unsubscribe = () => {}; // Placeholder para futuras implementaciones

    return unsubscribe;
  }, [user, enableMessageNotifications]);

  // Integración con likes
  useEffect(() => {
    if (!user || !enableLikeNotifications) return;

    // Aquí deberías suscribirte a los eventos de likes
    // Esta es una implementación de ejemplo
    const unsubscribe = () => {}; // Implementar suscripción real

    return unsubscribe;
  }, [user, enableLikeNotifications]);

  // Integración con super likes
  useEffect(() => {
    if (!user || !enableSuperLikeNotifications) return;

    // Aquí deberías suscribirte a los eventos de super likes
    // Esta es una implementación de ejemplo
    const unsubscribe = () => {}; // Implementar suscripción real

    return unsubscribe;
  }, [user, enableSuperLikeNotifications]);

  // Integración con visitas al perfil
  useEffect(() => {
    if (!user || !enableVisitNotifications) return;

    // Aquí deberías suscribirte a los eventos de visitas
    // Esta es una implementación de ejemplo
    const unsubscribe = () => {}; // Implementar suscripción real

    return unsubscribe;
  }, [user, enableVisitNotifications]);

  // Función para enviar notificación manual
  const sendManualNotification = async (
    type: 'match' | 'message' | 'like' | 'super_like' | 'visit',
    targetUserId: string,
    data: any
  ) => {
    if (!user) return false;

    try {
      switch (type) {
        case 'match':
          await fcmNotificationService.notifyNewMatch(targetUserId, data.matchedUser);
          break;
        case 'message':
          await fcmNotificationService.notifyNewMessage(
            targetUserId,
            data.sender,
            data.messagePreview,
            data.chatId
          );
          break;
        case 'like':
          await fcmNotificationService.notifyLike(targetUserId, data.likerUser);
          break;
        case 'super_like':
          await fcmNotificationService.notifySuperLike(targetUserId, data.likerUser);
          break;
        case 'visit':
          await fcmNotificationService.notifyProfileVisit(targetUserId, data.visitorUser);
          break;
      }
      return true;
    } catch (error) {
      console.error('Error enviando notificación manual:', error);
      return false;
    }
  };

  // Función para verificar permisos de notificación
  const checkNotificationPermissions = async (): Promise<boolean> => {
    return fcmNotificationService.areNotificationsEnabled();
  };

  // Función para solicitar permisos
  const requestNotificationPermissions = async (): Promise<NotificationPermission> => {
    return fcmNotificationService.requestPermission();
  };

  return {
    sendManualNotification,
    checkNotificationPermissions,
    requestNotificationPermissions,
    isNotificationProcessed,
    markNotificationAsProcessed,
  };
}