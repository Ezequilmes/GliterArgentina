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
          const currentData = newMap.get(userId);
          
          // Solo actualizar si hay cambios reales
          if (!currentData || 
              currentData.isOnline !== isOnline || 
              currentData.lastSeen?.getTime() !== lastSeen?.getTime()) {
            newMap.set(userId, { isOnline, lastSeen });
            return newMap;
          }
          
          return prev; // No hay cambios, evitar re-render
        });
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userIds.join(',')]); // Usar join para comparación estable

  // Configurar estado en línea del usuario actual
  useEffect(() => {
    if (!user?.id) return;

    let isActive = true; // Flag para evitar actualizaciones después del cleanup

    // Función interna para actualizar estado
    const updateOnlineStatus = async (isOnline: boolean) => {
      if (!isActive || !user?.id) return;
      
      try {
        await chatService.setOnlineStatus(user.id, isOnline);
      } catch (error) {
        console.error('Error setting online status:', error);
      }
    };

    // Marcar como en línea al montar
    updateOnlineStatus(true);

    // Actualizar estado cada 30 segundos
    intervalRef.current = setInterval(() => {
      updateOnlineStatus(true);
    }, 30000);

    // Manejar eventos de visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    // Manejar cierre de ventana/pestaña
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isActive = false; // Marcar como inactivo
      
      // Marcar como fuera de línea al desmontar
      if (user?.id) {
        chatService.setOnlineStatus(user.id, false).catch(console.error);
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]); // Solo depende de user?.id

  return {
    onlineUsers,
    setOnlineStatus,
    isUserOnline,
    getUserLastSeen
  };
}