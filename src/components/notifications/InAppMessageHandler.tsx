'use client';

import React, { useState, useEffect } from 'react';
import { useInAppMessaging } from '@/hooks/useInAppMessaging';
import { InAppMessage, InAppAction } from '@/services/inAppMessagingService';
import { X, ExternalLink, Heart, MessageCircle } from 'lucide-react';

interface InAppMessageDisplayProps {
  message: InAppMessage;
  onAction: (action: InAppAction) => void;
  onDismiss: () => void;
}

const InAppMessageDisplay: React.FC<InAppMessageDisplayProps> = ({
  message,
  onAction,
  onDismiss
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-slide-in-right">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {message.title}
        </h3>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      {message.imageUrl && (
        <img
          src={message.imageUrl}
          alt="In-app message"
          className="w-full h-32 object-cover rounded-md mb-3"
        />
      )}
      
      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
        {message.body}
      </p>
      
      <div className="flex gap-2">
        {message.actionUrl && (
          <button
            onClick={() => onAction({
              actionLabel: 'click',
              messageId: message.messageId,
              actionUrl: message.actionUrl || '',
              timestamp: new Date()
            })}
            className="flex items-center gap-1 px-3 py-1.5 bg-pink-500 text-white rounded-md text-xs font-medium hover:bg-pink-600 transition-colors"
          >
            <ExternalLink size={12} />
            Abrir
          </button>
        )}
        
        <button
          onClick={() => onAction({
            actionLabel: 'dismiss',
            messageId: message.messageId,
            actionUrl: '',
            timestamp: new Date()
          })}
          className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export const InAppMessageHandler: React.FC = () => {
  const { isInitialized, onMessage, onAction } = useInAppMessaging();
  const [currentMessage, setCurrentMessage] = useState<InAppMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<InAppMessage[]>([]);

  // Configurar listeners para mensajes
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribeMessage = onMessage((message: InAppMessage) => {
      console.log('📱 Received in-app message:', message);
      setCurrentMessage(message);
      setMessageHistory(prev => [...prev, message]);
    });

    const unsubscribeAction = onAction((action: InAppAction) => {
      console.log('🎯 In-app message action:', action);
      handleActionReceived(action);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeAction();
    };
  }, [isInitialized, onMessage, onAction]);

  const handleActionReceived = (action: InAppAction) => {
    if (action.actionLabel === 'dismiss') {
      setCurrentMessage(null);
    } else if (action.actionUrl) {
      window.open(action.actionUrl, '_blank');
      setCurrentMessage(null);
    }
  };

  const handleAction = (action: InAppAction) => {
    console.log('🎯 Handling in-app message action:', action);
    handleActionReceived(action);
  };

  const handleDismiss = () => {
    setCurrentMessage(null);
  };

  if (!isInitialized || !currentMessage) {
    return null;
  }

  return (
    <InAppMessageDisplay
      message={currentMessage}
      onAction={handleAction}
      onDismiss={handleDismiss}
    />
  );
};

export default InAppMessageHandler;