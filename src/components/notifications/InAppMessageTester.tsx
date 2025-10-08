'use client';

import React from 'react';
import { useInAppMessaging } from '@/hooks/useInAppMessaging';
import { InAppMessage } from '@/services/inAppMessagingService';
import { MessageCircle, Heart, Gift, Star, TestTube } from 'lucide-react';

export const InAppMessageTester: React.FC = () => {
  const { isInitialized, simulateMessage, getStatus } = useInAppMessaging();

  const testMessages: InAppMessage[] = [
    {
      messageId: 'test_match',
      title: '¡Nuevo Match! 💕',
      body: 'Tienes un nuevo match esperándote. ¡Ve a conocer a tu nueva conexión!',
      actionUrl: '/matches',
      campaignName: 'new_match',
      data: { type: 'match', userId: 'test123' }
    },
    {
      messageId: 'test_message',
      title: 'Mensaje nuevo 💬',
      body: 'Alguien te ha enviado un mensaje. ¡No dejes que espere!',
      actionUrl: '/messages',
      campaignName: 'new_message',
      data: { type: 'message', chatId: 'chat456' }
    },
    {
      messageId: 'test_premium',
      title: '¡Upgrade a Premium! ⭐',
      body: 'Desbloquea funciones exclusivas y encuentra el amor más rápido.',
      imageUrl: 'https://via.placeholder.com/300x150/ff69b4/ffffff?text=Premium',
      actionUrl: '/premium',
      campaignName: 'premium_upgrade',
      data: { type: 'promotion', offer: 'premium' }
    },
    {
      messageId: 'test_gift',
      title: 'Regalo especial 🎁',
      body: 'Tienes un regalo esperándote. ¡Ábrelo ahora y sorpréndete!',
      actionUrl: '/gifts',
      campaignName: 'special_gift',
      data: { type: 'gift', giftId: 'gift789' }
    }
  ];

  const handleTestMessage = (message: InAppMessage) => {
    if (!isInitialized) {
      console.warn('In-App Messaging not initialized');
      return;
    }
    
    console.log('🧪 Testing message:', message);
    simulateMessage(message);
  };

  const status = getStatus();

  if (!isInitialized) {
    return (
      <div className="fixed bottom-4 left-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <TestTube size={16} />
          <span>In-App Messaging inicializando...</span>
        </div>
      </div>
    );
  }

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-40">
      <div className="flex items-center gap-2 mb-3">
        <TestTube size={16} className="text-blue-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          In-App Message Tester
        </h3>
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
        Estado: {status.isInitialized ? '✅ Activo' : '❌ Inactivo'} | 
        Listeners: {status.messageListeners}
      </div>
      
      <div className="space-y-2">
        {testMessages.map((message) => (
          <button
            key={message.messageId}
            onClick={() => handleTestMessage(message)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            {message.campaignName?.includes('match') && <Heart size={14} className="text-pink-500" />}
            {message.campaignName?.includes('message') && <MessageCircle size={14} className="text-blue-500" />}
            {message.campaignName?.includes('premium') && <Star size={14} className="text-yellow-500" />}
            {message.campaignName?.includes('gift') && <Gift size={14} className="text-green-500" />}
            <span className="text-gray-700 dark:text-gray-300">{message.title}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          💡 Haz clic en cualquier mensaje para probarlo
        </div>
      </div>
    </div>
  );
};