import { useState, useEffect, useCallback, useRef } from 'react';
import { realtimeService, PresenceData, TypingData } from '@/services/realtimeService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseRealtimeOptions {
  enablePresence?: boolean;
  enableTyping?: boolean;
  enableNotifications?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [userPresence, setUserPresence] = useState<{ [userId: string]: PresenceData }>({});
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: { [userId: string]: TypingData } }>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  // Configurar presencia del usuario
  const setPresence = useCallback(async (status: 'online' | 'away' | 'busy' = 'online') => {
    if (!user?.id) return;
    
    try {
      await realtimeService.setUserPresence(user.id, status);
    } catch (error) {
      console.error('Error setting presence:', error);
    }
  }, [user?.id]);

  // Escuchar presencia de usuarios específicos
  const watchUserPresence = useCallback((userIds: string[]) => {
    if (!options.enablePresence || userIds.length === 0) return;

    const unsubscribe = realtimeService.onUserPresence(userIds, (presence) => {
      setUserPresence(prev => ({ ...prev, ...presence }));
    });

    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [options.enablePresence]);

  // Establecer estado de escritura
  const setTyping = useCallback(async (chatId: string, isTyping: boolean) => {
    if (!user?.id || !options.enableTyping) return;
    
    try {
      await realtimeService.setTypingStatus(chatId, user.id, isTyping);
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }, [user?.id, options.enableTyping]);

  // Escuchar estado de escritura en un chat
  const watchTyping = useCallback((chatId: string) => {
    if (!options.enableTyping) return;

    const unsubscribe = realtimeService.onTypingStatus(chatId, (typing) => {
      setTypingUsers(prev => ({
        ...prev,
        [chatId]: typing
      }));
    });

    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, [options.enableTyping]);

  // Enviar notificación instantánea
  const sendNotification = useCallback(async (
    userId: string, 
    notification: {
      type: 'message' | 'match' | 'like' | 'super_like';
      title: string;
      body: string;
      data?: any;
    }
  ) => {
    try {
      await realtimeService.sendInstantNotification(userId, notification);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, []);

  // Marcar notificación como leída
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      await realtimeService.markNotificationAsRead(user.id, notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id]);

  // Limpiar notificaciones leídas
  const clearReadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await realtimeService.clearReadNotifications(user.id);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, [user?.id]);

  // Obtener usuarios en línea
  const getOnlineUsers = useCallback(async (userIds: string[]) => {
    try {
      return await realtimeService.getOnlineUsers(userIds);
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }, []);

  // Configurar listeners al montar el componente
  useEffect(() => {
    if (!user?.id) return;

    // Escuchar estado de conexión
    const connectionUnsubscribe = realtimeService.onConnectionStatus(setIsConnected);
    unsubscribeRefs.current.push(connectionUnsubscribe);

    // Configurar presencia si está habilitada
    if (options.enablePresence) {
      setPresence('online');
    }

    // Escuchar notificaciones si están habilitadas
    if (options.enableNotifications) {
      const notificationsUnsubscribe = realtimeService.onInstantNotifications(user.id, setNotifications);
      unsubscribeRefs.current.push(notificationsUnsubscribe);
    }

    // Cleanup al desmontar
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
      
      if (options.enablePresence && user.id) {
        realtimeService.clearUserPresence(user.id).catch(console.error);
      }
    };
  }, [user?.id, options.enablePresence, options.enableNotifications, setPresence]);

  // Limpiar presencia al cambiar de estado
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id && options.enablePresence) {
        realtimeService.clearUserPresence(user.id).catch(console.error);
      }
    };

    const handleVisibilityChange = () => {
      if (user?.id && options.enablePresence) {
        const status = document.hidden ? 'away' : 'online';
        setPresence(status);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, options.enablePresence, setPresence]);

  return {
    // Estado
    isConnected,
    userPresence,
    typingUsers,
    notifications,
    
    // Métodos de presencia
    setPresence,
    watchUserPresence,
    getOnlineUsers,
    
    // Métodos de escritura
    setTyping,
    watchTyping,
    
    // Métodos de notificaciones
    sendNotification,
    markNotificationAsRead,
    clearReadNotifications,
    
    // Utilidades
    isUserOnline: (userId: string) => userPresence[userId]?.isOnline || false,
    isUserTyping: (chatId: string, userId: string) => typingUsers[chatId]?.[userId]?.isTyping || false,
    getTypingUsers: (chatId: string) => {
      const typing = typingUsers[chatId] || {};
      return Object.keys(typing).filter(userId => typing[userId]?.isTyping);
    }
  };
}