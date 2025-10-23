import { useEffect, useRef } from 'react';
import { chatService } from '@/services/chatService';

/**
 * Hook personalizado para limpiar listeners de chat cuando el componente se desmonta
 * o cuando cambia el chat activo
 */
export const useChatCleanup = (chatId?: string) => {
  const previousChatIdRef = useRef<string | undefined>(undefined);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup cuando cambia el chat
    if (previousChatIdRef.current && previousChatIdRef.current !== chatId) {
      console.log(`🧹 Limpiando listeners para chat anterior: ${previousChatIdRef.current}`);
      
      // Usar un pequeño delay para evitar problemas de race condition
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      
      cleanupTimeoutRef.current = setTimeout(() => {
        try {
          chatService.cleanupMessageListeners(previousChatIdRef.current);
        } catch (error) {
          console.warn('Error limpiando listeners de chat anterior:', error);
        }
      }, 100);
    }

    previousChatIdRef.current = chatId;

    // Cleanup cuando el componente se desmonta
    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      
      if (chatId) {
        console.log(`🧹 Limpiando listeners al desmontar componente para chat: ${chatId}`);
        try {
          chatService.cleanupMessageListeners(chatId);
        } catch (error) {
          console.warn('Error limpiando listeners al desmontar:', error);
        }
      }
    };
  }, [chatId]);

  // Función para forzar cleanup manual
  const forceCleanup = (targetChatId?: string) => {
    const idToClean = targetChatId || chatId;
    if (idToClean) {
      console.log(`🧹 Forzando cleanup para chat: ${idToClean}`);
      chatService.cleanupMessageListeners(idToClean);
    }
  };

  return { forceCleanup };
};

export default useChatCleanup;