'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { matchService, Match } from '@/lib/matchService';
import { notificationService, Notification } from '@/services/notificationService';
import { userService } from '@/lib/firestore';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

export interface MatchWithUser extends Match {
  otherUser: User;
}

export function useMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchWithUser[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar matches del usuario
  const loadMatches = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const userMatches = await matchService.getUserMatches(user.id);
      
      // Obtener información de los otros usuarios de forma optimizada
      const otherUserIds = userMatches.map(match => 
        match.user1Id === user.id ? match.user2Id : match.user1Id
      );
      
      // Obtener todos los usuarios de una vez
      const otherUsers = await Promise.all(
        otherUserIds.map(userId => userService.getUser(userId))
      );
      
      // Crear un mapa para acceso rápido
      const userMap = new Map();
      otherUsers.forEach((user, index) => {
        if (user) {
          userMap.set(otherUserIds[index], user);
        }
      });
      
      // Combinar matches con usuarios
      const matchesWithUsers = userMatches
        .map(match => {
          const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id;
          const otherUser = userMap.get(otherUserId);
          
          if (!otherUser) {
            console.warn(`User not found for match ${match.id}: ${otherUserId}`);
            return null;
          }
          
          return {
            ...match,
            otherUser
          };
        })
        .filter(Boolean) as MatchWithUser[];

      setMatches(matchesWithUsers);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Error al cargar los matches');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Cargar notificaciones - ahora se maneja con listeners en tiempo real
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    // Las notificaciones se cargan automáticamente con los listeners
  }, [user?.id]);

  // Marcar notificación como leída
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Marcar todas las notificaciones como leídas
  const markAllNotificationsAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [user?.id]);

  // Dar like a un usuario
  const likeUser = useCallback(async (targetUserId: string) => {
    if (!user?.id) return;

    try {
      await userService.likeUser(user.id, targetUserId);
      
      // Verificar si es un match
      const targetUser = await userService.getUser(targetUserId);
      if (targetUser?.likedUsers?.includes(user.id)) {
        // Es un match!
        const matchId = await matchService.createMatch(user.id, targetUserId);
        toast.success('¡Es un match! 🎉');
        
        // Recargar matches
        loadMatches();
      } else {
        toast.success('Like enviado ❤️');
      }
    } catch (err) {
      console.error('Error liking user:', err);
      toast.error('Error al enviar like');
    }
  }, [user?.id, loadMatches]);

  // Dar super like a un usuario
  const superLikeUser = useCallback(async (targetUserId: string) => {
    if (!user?.id) return;

    try {
      await userService.superLikeUser(user.id, targetUserId);
      
      // Crear notificación de super like
      await notificationService.createSuperLikeNotification(targetUserId, { name: user.name, id: user.id });
      
      toast.success('¡Super Like enviado! ⭐');
      
      // Recargar matches
      loadMatches();
    } catch (err) {
      console.error('Error super liking user:', err);
      toast.error('Error al enviar Super Like');
    }
  }, [user?.id, loadMatches]);

  // Pasar a un usuario
  const passUser = useCallback(async (targetUserId: string) => {
    if (!user?.id) return;

    try {
      await userService.passUser(user.id, targetUserId);
    } catch (err) {
      console.error('Error passing user:', err);
    }
  }, [user?.id]);

  // Desactivar un match
  const deactivateMatch = useCallback(async (matchId: string) => {
    try {
      await matchService.deactivateMatch(matchId);
      setMatches(prev => prev.filter(match => match.id !== matchId));
      toast.success('Match eliminado');
    } catch (err) {
      console.error('Error deactivating match:', err);
      toast.error('Error al eliminar match');
    }
  }, []);

  // Configurar listeners en tiempo real
  useEffect(() => {
    if (!user?.id) return;

    let isSubscribed = true;

    // Listener para matches
    const unsubscribeMatches = matchService.onMatchesChange(user.id, async (userMatches) => {
      if (!isSubscribed) return;
      
      try {
        // Obtener información de los otros usuarios de forma optimizada
        const otherUserIds = userMatches.map(match => 
          match.user1Id === user.id ? match.user2Id : match.user1Id
        );
        
        // Obtener todos los usuarios de una vez
        const otherUsers = await Promise.all(
          otherUserIds.map(userId => userService.getUser(userId))
        );
        
        // Crear un mapa para acceso rápido
        const userMap = new Map();
        otherUsers.forEach((user, index) => {
          if (user) {
            userMap.set(otherUserIds[index], user);
          }
        });
        
        // Combinar matches con usuarios
        const matchesWithUsers = userMatches
          .map(match => {
            const otherUserId = match.user1Id === user.id ? match.user2Id : match.user1Id;
            const otherUser = userMap.get(otherUserId);
            
            if (!otherUser) {
              console.warn(`User not found for match ${match.id}: ${otherUserId}`);
              return null;
            }
            
            return {
              ...match,
              otherUser
            };
          })
          .filter(Boolean) as MatchWithUser[];

        if (isSubscribed) {
          setMatches(matchesWithUsers);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error processing matches update:', err);
        if (isSubscribed) {
          setError('Error al actualizar los matches');
          setLoading(false);
        }
      }
    });

    // Listener para notificaciones
    const unsubscribeNotifications = notificationService.subscribeToNotifications(user.id, (userNotifications) => {
      setNotifications(userNotifications);
      const unreadCount = userNotifications.filter(n => !n.read).length;
      setUnreadCount(unreadCount);
    });

    // Listener para conteo de notificaciones no leídas
    const unsubscribeUnreadCount = notificationService.subscribeToUnreadCount(user.id, (count) => {
      setUnreadCount(count);
    });

    return () => {
      unsubscribeMatches();
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.id]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.id) {
      loadMatches();
      loadNotifications();
    }
  }, [user?.id, loadMatches, loadNotifications]);

  return {
    matches,
    notifications,
    unreadCount,
    loading,
    error,
    likeUser,
    superLikeUser,
    passUser,
    deactivateMatch,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    loadMatches,
    loadNotifications
  };
}