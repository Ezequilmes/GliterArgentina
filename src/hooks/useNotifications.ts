'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService, Notification } from '@/services/notificationService';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Error al marcar la notificación como leída');
    }
  }, []);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Error al marcar todas las notificaciones como leídas');
    }
  }, [user?.id]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Error al eliminar la notificación');
    }
  }, []);

  // Crear notificaciones específicas
  const createMatchNotification = useCallback(async (matchedUser: { name: string; id: string }) => {
    if (!user?.id) return;
    
    try {
      await notificationService.createMatchNotification(user.id, matchedUser);
    } catch (err) {
      console.error('Error creating match notification:', err);
    }
  }, [user?.id]);

  const createMessageNotification = useCallback(async (sender: { name: string; id: string }, preview: string) => {
    if (!user?.id) return;
    
    try {
      await notificationService.createMessageNotification(user.id, sender, preview);
    } catch (err) {
      console.error('Error creating message notification:', err);
    }
  }, [user?.id]);

  const createLikeNotification = useCallback(async (liker: { name: string; id: string }) => {
    if (!user?.id) return;
    
    try {
      await notificationService.createLikeNotification(user.id, liker);
    } catch (err) {
      console.error('Error creating like notification:', err);
    }
  }, [user?.id]);

  const createSuperLikeNotification = useCallback(async (superLiker: { name: string; id: string }) => {
    if (!user?.id) return;
    
    try {
      await notificationService.createSuperLikeNotification(user.id, superLiker);
    } catch (err) {
      console.error('Error creating super like notification:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Suscribirse a notificaciones en tiempo real
    const unsubscribeNotifications = notificationService.subscribeToNotifications(
      user.id,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        setLoading(false);
      }
    );

    // Suscribirse al conteo de notificaciones no leídas
    const unsubscribeUnreadCount = notificationService.subscribeToUnreadCount(
      user.id,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [user?.id]);

  // Limpiar notificaciones expiradas periódicamente
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      notificationService.cleanupExpiredNotifications();
    }, 60 * 60 * 1000); // Cada hora

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createMatchNotification,
    createMessageNotification,
    createLikeNotification,
    createSuperLikeNotification
  };
}