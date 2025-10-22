'use client';

import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { NotificationBubble } from './NotificationBubble';
import { ChatMicroAnimations } from './ChatMicroAnimations';
import { useNotificationManager } from '../../hooks/useNotificationManager';
import type { NotificationData, NotificationManagerGlobal } from '../../types/notifications';

interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  volume: number;
}

interface NotificationManagerProps {
  isChatActive?: boolean;
  settings?: NotificationSettings;
  children?: React.ReactNode;
}

interface NotificationState {
  isVisible: boolean;
  type: 'message' | 'like' | 'match' | 'general';
  message?: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [bubbleData, setBubbleData] = useState<NotificationData | null>(null);
  
  const {
    playSound,
    showToast,
    triggerMicroAnimation,
    isAnimating,
    cleanup
  } = useNotificationManager();

  // Función para mostrar notificación completa (visual + sonora)
  const showNotification = (data: NotificationData) => {
    // Reproducir sonido si está habilitado
    if (data.soundEnabled) {
      playSound();
    }

    // Mostrar notificación visual
    if (data.visualEnabled) {
      if (data.isChatOpen) {
        // Si el chat está abierto, solo micro-animaciones
        triggerMicroAnimation();
      } else {
        // Si el chat no está abierto, mostrar toast y burbuja
        showToast(`${data.senderName}: ${data.message}`);
        setBubbleData(data);
      }
    }
  };

  // Función para limpiar la burbuja
  const handleBubbleComplete = () => {
    setBubbleData(null);
  };

  // Configurar funciones globales y cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.notificationManager = {
        showNewMessageNotification: showNotification,
        
        showTestNotification: (message: string = 'Notificación de prueba') => {
          showNotification({
            message,
            senderName: 'Sistema',
            soundEnabled: true,
            visualEnabled: true,
            isChatOpen: false,
          });
        }
      };
    }

    return () => {
      cleanup();
      if (typeof window !== 'undefined') {
        delete window.notificationManager;
      }
    };
  }, [showNotification, cleanup]);

  return (
    <>
      {/* Toaster para notificaciones toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
        }}
      />

      {/* Burbuja de notificación animada */}
      {bubbleData && (
        <NotificationBubble
          type={bubbleData.type || 'message'}
          message={bubbleData.message}
          isVisible={true}
          onComplete={handleBubbleComplete}
          position="top-right"
        />
      )}

      {/* Micro-animaciones para el contenido del chat */}
      <ChatMicroAnimations isAnimating={isAnimating}>
        {children}
      </ChatMicroAnimations>
    </>
  );
};

export default NotificationManager;