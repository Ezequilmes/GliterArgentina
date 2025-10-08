import { useState, useEffect, useCallback } from 'react';
import { fcmService } from '@/services/fcmService';
import { useAuth } from './useAuth';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    token: null,
    isLoading: false,
    error: null
  });

  // Inicializar el estado
  useEffect(() => {
    const initializeState = async () => {
      try {
        const isSupported = await fcmService.isNotificationSupported();
        const permission = fcmService.getPermissionStatus();
        
        setState(prev => ({
          ...prev,
          isSupported,
          permission
        }));
      } catch (error) {
        console.error('Error initializing push notification state:', error);
        setState(prev => ({
          ...prev,
          isSupported: false,
          error: 'Error al inicializar las notificaciones'
        }));
      }
    };

    initializeState();
  }, []);

  // Solicitar permisos y obtener token
  const requestPermissionAndToken = useCallback(async () => {
    const isSupported = await fcmService.isNotificationSupported();
    
    if (!isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Las notificaciones push no están soportadas en este navegador'
      }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Solicitar permisos
      const hasPermission = await fcmService.requestPermission();
      
      if (!hasPermission) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          permission: 'denied',
          error: 'Permisos de notificación denegados'
        }));
        return false;
      }

      // Obtener token de registro
      const token = await fcmService.getRegistrationToken();
      
      if (token) {
        // Guardar token en el servidor si hay usuario autenticado
        if (user?.id) {
          await fcmService.saveTokenToServer(user.id, token);
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          permission: 'granted',
          token,
          error: null
        }));
        
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No se pudo obtener el token de registro'
        }));
        return false;
      }
    } catch (error) {
      console.error('Error requesting push notification permission:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al configurar las notificaciones push'
      }));
      return false;
    }
  }, [user?.id]);

  // Refrescar token
  const refreshToken = useCallback(async () => {
    const isSupported = await fcmService.isNotificationSupported();
    if (!isSupported) return null;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const newToken = await fcmService.refreshToken();
      
      if (newToken && user?.id) {
        await fcmService.saveTokenToServer(user.id, newToken);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        token: newToken,
        error: newToken ? null : 'No se pudo refrescar el token'
      }));

      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al refrescar el token'
      }));
      return null;
    }
  }, [user?.id]);

  // Deshabilitar notificaciones
  const disableNotifications = useCallback(async () => {
    if (state.token && user?.id) {
      try {
        await fcmService.removeTokenFromServer(user.id, state.token);
      } catch (error) {
        console.error('Error removing token from server:', error);
      }
    }

    setState(prev => ({
      ...prev,
      token: null,
      permission: 'denied'
    }));
  }, [state.token, user?.id]);

  // Verificar si las notificaciones están habilitadas
  const isEnabled = state.permission === 'granted' && !!state.token;

  // Verificar si se pueden solicitar permisos
  const canRequestPermission = state.permission === 'default' || state.permission === null;

  return {
    ...state,
    isEnabled,
    canRequestPermission,
    requestPermissionAndToken,
    refreshToken,
    disableNotifications
  };
};