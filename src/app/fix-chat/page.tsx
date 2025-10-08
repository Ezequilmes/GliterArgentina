'use client';

import { useState } from 'react';
import { chatService } from '@/services/chatService';

export default function FixChatPage() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ fixed: number; total: number } | null>(null);

  const handleFixSpecificChat = async () => {
    setLoading(true);
    setStatus('Corrigiendo chat específico...');
    setResults(null);
    
    try {
      const result = await chatService.fixChatParticipants('7TwwxXFiRFRQYhoe5KMM');
      setResults(result);
      setStatus('✅ Chat específico procesado!');
    } catch (error) {
      console.error('Error:', error);
      setStatus('❌ Error al corregir el chat: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAllChats = async () => {
    setLoading(true);
    setStatus('Buscando y corrigiendo todos los chats con participants vacío...');
    setResults(null);
    
    try {
      const result = await chatService.fixChatParticipants();
      setResults(result);
      setStatus('✅ Corrección masiva completada!');
    } catch (error) {
      console.error('Error:', error);
      setStatus('❌ Error al corregir los chats: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Corrección de Chats
        </h1>
        
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="font-semibold text-yellow-800 mb-2">¿Qué hace esta corrección?</h2>
            <p className="text-yellow-700 text-sm">
              Corrige chats que tienen <code>participants</code> vacío pero <code>participantIds</code> con datos, 
              poblando el campo <code>participants</code> con los IDs correctos.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleFixSpecificChat}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Procesando...' : 'Corregir Chat Específico'}
            </button>
            
            <button
              onClick={handleFixAllChats}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Procesando...' : 'Corregir Todos los Chats'}
            </button>
          </div>
          
          {results && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Resultados:</h3>
              <p className="text-blue-700 text-sm">
                <strong>{results.fixed}</strong> chats corregidos de <strong>{results.total}</strong> encontrados
              </p>
            </div>
          )}
          
          {status && (
            <div className={`p-4 rounded-lg text-sm ${
              status.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : status.includes('❌')
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}