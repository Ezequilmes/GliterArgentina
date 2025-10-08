import { useEffect, useCallback, useState } from 'react';
import { inAppMessagingService, InAppMessage, InAppAction } from '@/services/inAppMessagingService';

export interface UseInAppMessagingReturn {
  isInitialized: boolean;
  suppressMessages: (suppress: boolean) => Promise<void>;
  setDataCollection: (enabled: boolean) => Promise<void>;
  simulateMessage: (message: InAppMessage) => void;
  fetchMessages: () => Promise<InAppMessage[]>;
  onMessage: (callback: (message: InAppMessage) => void) => () => void;
  onAction: (callback: (action: InAppAction) => void) => () => void;
  getStatus: () => any;
}

export function useInAppMessaging(): UseInAppMessagingReturn {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeService = async () => {
      try {
        await inAppMessagingService.initialize();
        setIsInitialized(true);
        console.log('✅ In-App Messaging hook initialized');
      } catch (error) {
        console.error('❌ Error initializing In-App Messaging:', error);
        setIsInitialized(false);
      }
    };

    initializeService();

    return () => {
      inAppMessagingService.cleanup();
    };
  }, []);

  const suppressMessages = useCallback(async (suppress: boolean) => {
    return await inAppMessagingService.suppressMessages(suppress);
  }, []);

  const setDataCollectionEnabled = useCallback(async (enabled: boolean) => {
    return await inAppMessagingService.setDataCollectionEnabled(enabled);
  }, []);

  const simulateMessage = useCallback((message: InAppMessage) => {
    inAppMessagingService.simulateMessage(message);
  }, []);

  const onMessage = useCallback((callback: (message: InAppMessage) => void) => {
    return inAppMessagingService.onMessage(callback);
  }, []);

  const onAction = useCallback((callback: (action: InAppAction) => void) => {
    return inAppMessagingService.onAction(callback);
  }, []);

  const getStatus = useCallback(() => {
    return inAppMessagingService.getStatus();
  }, []);

  const fetchMessages = async (): Promise<InAppMessage[]> => {
    try {
      // En desarrollo, usar mensajes simulados
      if (process.env.NODE_ENV !== 'production') {
        return [];
      }

      // En producción, obtener del servidor
      const sessionTime = Date.now() - (inAppMessagingService.getStatus().sessionStartTime?.getTime() || Date.now());
      const response = await fetch(`/api/in-app-messages/messages?sessionTime=${sessionTime}&authenticated=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching in-app messages:', error);
      return [];
    }
  };

  return {
    isInitialized,
    suppressMessages,
    setDataCollection: setDataCollectionEnabled,
    simulateMessage,
    fetchMessages,
    onMessage,
    onAction,
    getStatus
  };
}

// Hook para manejar mensajes específicos
export function useInAppMessageHandler(
  onMessage?: (message: InAppMessage) => void,
  onAction?: (action: InAppAction) => void
) {
  const { isInitialized } = useInAppMessaging();

  // Configurar callbacks cuando el servicio esté inicializado
  useEffect(() => {
    if (isInitialized) {
      let unsubscribeMessage: (() => void) | undefined;
      let unsubscribeAction: (() => void) | undefined;

      if (onMessage) {
        unsubscribeMessage = inAppMessagingService.onMessage(onMessage);
      }

      if (onAction) {
        unsubscribeAction = inAppMessagingService.onAction(onAction);
      }

      return () => {
        unsubscribeMessage?.();
        unsubscribeAction?.();
      };
    }
  }, [isInitialized, onMessage, onAction]);

  return { isInitialized };
}

// Hook para casos de uso específicos
export function useInAppMessagingForFeature(feature: string) {
  const { isInitialized, suppressMessages, setDataCollection } = useInAppMessaging();

  // Suprimir mensajes para una característica específica
  const suppressForFeature = useCallback((suppress: boolean) => {
    console.log(`${suppress ? 'Suppressing' : 'Enabling'} in-app messages for feature: ${feature}`);
    suppressMessages(suppress);
  }, [feature, suppressMessages]);

  // Habilitar recolección de datos para una característica
  const enableDataCollectionForFeature = useCallback((enabled: boolean) => {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} data collection for feature: ${feature}`);
    setDataCollection(enabled);
  }, [feature, setDataCollection]);

  return {
    isInitialized,
    suppressForFeature,
    enableDataCollectionForFeature
  };
}