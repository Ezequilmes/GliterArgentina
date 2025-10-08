'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';

export function SimpleMessageTest() {
  const { messages } = useChat();
  const { user } = useAuth();

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4 text-red-600">🧪 SIMPLE MESSAGE TEST</h3>
      
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-red-500 font-bold">NO MESSAGES FOUND</div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div 
                key={message.id} 
                className={`p-3 rounded-lg border-2 ${
                  isOwn 
                    ? 'bg-blue-100 border-blue-500 ml-8' 
                    : 'bg-green-100 border-green-500 mr-8'
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {isOwn ? 'TÚ' : 'OTRO'} - {message.type} - {message.id}
                </div>
                <div className="font-bold text-lg text-black">
                  CONTENT: "{message.content}"
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Length: {message.content?.length || 0} | 
                  Type: {typeof message.content} | 
                  Read: {message.read ? 'YES' : 'NO'}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="mt-4 p-2 bg-yellow-100 border border-yellow-500 rounded">
        <div className="text-sm">
          <strong>Total messages:</strong> {messages.length}<br/>
          <strong>User ID:</strong> {user?.id || 'null'}
        </div>
      </div>
    </div>
  );
}