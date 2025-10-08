'use client';

import React, { useState, useEffect } from 'react';
import { realtimeService } from '@/services/realtimeService';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';

export default function RealtimeTest() {
  const { user } = useAuth();
  const { isConnected } = useRealtime({ enablePresence: true, enableNotifications: true });
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Test básico de escritura y lectura
  const testBasicOperations = async () => {
    if (!user?.id) {
      setTestResult('❌ Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setTestResult('🔄 Probando operaciones básicas...');

    try {
      // Test 1: Configurar presencia
      await realtimeService.setUserPresence(user.id, 'online');
      setTestResult(prev => prev + '\n✅ Presencia configurada');

      // Test 2: Enviar notificación de prueba
      await realtimeService.sendInstantNotification(user.id, {
        type: 'message',
        title: 'Prueba de Realtime Database',
        body: 'Conexión exitosa!',
        data: { test: true }
      });
      setTestResult(prev => prev + '\n✅ Notificación enviada');

      // Test 3: Configurar estado de escritura
      await realtimeService.setTypingStatus('test-chat', user.id, true);
      setTimeout(async () => {
        await realtimeService.setTypingStatus('test-chat', user.id, false);
      }, 2000);
      setTestResult(prev => prev + '\n✅ Estado de escritura configurado');

      setTestResult(prev => prev + '\n\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    } catch (error) {
      console.error('Error en pruebas:', error);
      setTestResult(prev => prev + `\n❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test de presencia en tiempo real
  const testPresence = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setTestResult('🔄 Probando presencia en tiempo real...');

    try {
      // Escuchar cambios de presencia
      const unsubscribe = realtimeService.onUserPresence([user.id], (presence) => {
        setTestResult(prev => prev + `\n📡 Presencia actualizada: ${JSON.stringify(presence, null, 2)}`);
      });

      // Cambiar estado después de 2 segundos
      setTimeout(async () => {
        await realtimeService.setUserPresence(user.id, 'away');
        setTestResult(prev => prev + '\n🔄 Estado cambiado a "away"');
      }, 2000);

      // Cambiar de vuelta después de 4 segundos
      setTimeout(async () => {
        await realtimeService.setUserPresence(user.id, 'online');
        setTestResult(prev => prev + '\n🔄 Estado cambiado a "online"');
        unsubscribe();
        setIsLoading(false);
      }, 4000);

    } catch (error) {
      console.error('Error en prueba de presencia:', error);
      setTestResult(prev => prev + `\n❌ Error: ${error}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          🔥 Prueba de Realtime Database
        </h2>

        {/* Estado de conexión */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Estado de Conexión:</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50">
          <h3 className="font-semibold mb-2">Usuario Actual:</h3>
          <p className="text-sm text-gray-600">
            {user ? `ID: ${user.id} | Email: ${user.email}` : 'No autenticado'}
          </p>
        </div>

        {/* Botones de prueba */}
        <div className="space-y-4 mb-6">
          <button
            onClick={testBasicOperations}
            disabled={isLoading || !user || !isConnected}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '🔄 Probando...' : '🧪 Probar Operaciones Básicas'}
          </button>

          <button
            onClick={testPresence}
            disabled={isLoading || !user || !isConnected}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? '🔄 Probando...' : '👥 Probar Presencia en Tiempo Real'}
          </button>
        </div>

        {/* Resultados */}
        {testResult && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
            <h3 className="text-white font-semibold mb-2">Resultados:</h3>
            {testResult}
          </div>
        )}

        {/* Instrucciones */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Instrucciones:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Asegúrate de estar autenticado</li>
            <li>• Verifica que la conexión esté activa (punto verde)</li>
            <li>• Ejecuta las pruebas para verificar la funcionalidad</li>
            <li>• Revisa la consola del navegador para logs adicionales</li>
          </ul>
        </div>
      </div>
    </div>
  );
}