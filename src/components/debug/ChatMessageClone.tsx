'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';

export function ChatMessageClone() {
  const { user } = useAuth();
  const { messages } = useChat();

  if (messages.length === 0) {
    return (
      <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '2px solid #dc2626', borderRadius: '8px', margin: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc2626' }}>No messages to test</h3>
      </div>
    );
  }

  const firstMessage = messages[0];
  const isOwn = firstMessage.senderId === user?.id;

  return (
    <div style={{ padding: '16px', backgroundColor: '#dcfce7', border: '2px solid #16a34a', borderRadius: '8px', margin: '16px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', marginBottom: '16px' }}>
        ChatMessage Clone Test
      </h3>
      
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>Original Message Data:</h4>
        <div style={{ fontSize: '14px' }}>
          <div><strong>Content:</strong> "{firstMessage.content}"</div>
          <div><strong>Type:</strong> {firstMessage.type}</div>
          <div><strong>Is Own:</strong> {isOwn ? 'YES' : 'NO'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>Cloned ChatMessage Structure:</h4>
        
        {/* Exact clone of ChatMessage structure with inline styles */}
        <div 
          style={{
            position: 'relative',
            padding: '12px 16px',
            borderRadius: '16px',
            maxWidth: '288px', // max-w-xs
            wordBreak: 'break-word',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid',
            backgroundColor: isOwn ? '#3b82f6' : 'white',
            color: isOwn ? 'white' : '#111827',
            borderColor: isOwn ? 'rgba(59, 130, 246, 0.3)' : '#e5e7eb',
            marginLeft: isOwn ? 'auto' : '0'
          }}
        >
          <p style={{
            fontSize: '14px',
            lineHeight: '1.625',
            whiteSpace: 'pre-wrap',
            margin: 0
          }}>
            {firstMessage.content}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontWeight: 'bold', color: '#ea580c', marginBottom: '8px' }}>Super Simple Test:</h4>
        <div style={{
          padding: '8px',
          backgroundColor: '#f3f4f6',
          border: '2px solid #059669',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'black'
        }}>
          SIMPLE: {firstMessage.content}
        </div>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h4 style={{ fontWeight: 'bold', color: '#7c2d12', marginBottom: '8px' }}>Content Analysis:</h4>
        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          <div>Content: "{firstMessage.content}"</div>
          <div>Length: {firstMessage.content?.length || 0}</div>
          <div>Type: {typeof firstMessage.content}</div>
          <div>Truthy: {firstMessage.content ? 'YES' : 'NO'}</div>
          <div>Empty: {firstMessage.content === '' ? 'YES' : 'NO'}</div>
          <div>Null: {firstMessage.content === null ? 'YES' : 'NO'}</div>
          <div>Undefined: {firstMessage.content === undefined ? 'YES' : 'NO'}</div>
        </div>
      </div>
    </div>
  );
}