import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';

export interface OnlineStatusData {
  isOnline: boolean;
  lastSeen?: Date;
}

export interface UseOnlineStatusReturn {
  onlineUsers: Map<string, OnlineStatusData>;
  setOnlineStatus: (isOnline: boolean) => Promise<void>;
  isUserOnline: (userId: string) => boolean;
  getUserLastSeen: (userId: string) => Date | undefined;
}

export function useOnlineStatus(userIds: string[] = []): UseOnlineStatusReturn {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineStatusData>>(new Map());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Actualizar estado en línea del usuario actual
  const setOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user?.id) return;

    try {
      await chatService.setOnlineStatus(user.id, isOnline);
    } catch (error) {
      console.error('Error setting online status:', error);
    }
  }, [user?.id]);

  // Verificar si un usuario está en línea
  const isUserOnline = useCallback((userId: string): boolean => {
    const userData = onlineUsers.get(userId);
    return userData?.isOnline || false;
  }, [onlineUsers]);

  // Obtener la última vez que se vio a un usuario
  const getUserLastSeen = useCallback((userId: string): Date | undefined => {
    const userData = onlineUsers.get(userId);
    return userData?.lastSeen;
  }, [onlineUsers]);

  // Suscribirse al estado en línea de usuarios
  useEffect(() => {
    if (userIds.length === 0) {
      setOnlineUsers(new Map());
      return;
    }

    // Limpiar suscripción anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Suscribirse a los estados en línea
    unsubscribeRef.current = chatService.subscribeToOnlineStatus(
      userIds,
      (userId, isOnline, lastSeen) => {
        setOnlineUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, { isOnline, lastSeen });
          return newMap;
        });
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userIds]);

  // Configurar estado en línea del usuario actual
  useEffect(() => {
    if (!user?.id) return;

    // Marcar como en línea al montar
    setOnlineStatus(true);

    // Actualizar estado cada 30 segundos
    intervalRef.current = setInterval(() => {
      setOnlineStatus(true);
    }, 30000);

    // Manejar eventos de visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOnlineStatus(false);
      } else {
        setOnlineStatus(true);
      }
    };

    // Manejar cierre de ventana/pestaña
    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Marcar como fuera de línea al desmontar
      setOnlineStatus(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id, setOnlineStatus]);

  return {
    onlineUsers,
    setOnlineStatus,
    isUserOnline,
    getUserLastSeen
  };
}