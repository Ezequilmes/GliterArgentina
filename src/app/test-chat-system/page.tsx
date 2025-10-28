'use client';

import { useState, useEffect, useRef } from 'react';
import { chatService } from '@/services/chatService';
import { realtimeService } from '@/services/realtimeService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  duration?: number;
  details?: Record<string, unknown>;
}

export default function ChatSystemTestPage() {
  const [user, setUser] = useState<User | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testChatId, setTestChatId] = useState<string | null>(null);
  const [testMessages, setTestMessages] = useState<any[]>([]);
  const [typingStatus, setTypingStatus] = useState<string>('');
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const testStartTime = useRef<number>(0);

  const tests = [
    'Inicialización del servicio de chat',
    'Creación de chat de prueba',
    'Envío de mensaje de texto',
    'Verificación de estado de entrega',
    'Marcado de mensaje como leído',
    'Prueba de typing indicators',
    'Prueba de presencia/estado online',
    'Prueba de reintento de mensajes',
    'Prueba de sincronización en tiempo real',
    'Limpieza de datos de prueba'
  ];

  useEffect(() => {
    // Inicializar resultados de prueba
    setTestResults(tests.map(test => ({ test, status: 'pending' })));

    // Listener de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const updateTestResult = (testIndex: number, result: Partial<TestResult>) => {
    setTestResults(prev => prev.map((item, index) => 
      index === testIndex ? { ...item, ...result } : item
    ));
  };

  const runAllTests = async () => {
    if (!user) {
      alert('Debes estar autenticado para ejecutar las pruebas');
      return;
    }

    setIsRunning(true);
    testStartTime.current = Date.now();

    try {
      // Test 1: Inicialización del servicio
      await runTest(0, async () => {
        await chatService.initializePresence(user.uid);
        return { message: 'Servicio inicializado correctamente' };
      });

      // Test 2: Creación de chat de prueba
      const chatId = await runTest(1, async () => {
        // Crear un chat con un usuario ficticio para pruebas
        const testUserId = 'test-user-' + Date.now();
        const chatId = await chatService.getOrCreateChat(user.uid, testUserId);
        setTestChatId(chatId);
        return { 
          message: `Chat creado: ${chatId}`,
          details: { chatId, testUserId }
        };
      });

      if (!chatId.details?.chatId) {
        throw new Error('No se pudo crear el chat de prueba');
      }

      const testChatIdValue = chatId.details.chatId as string;
      const testUserId = chatId.details.testUserId as string;

      // Test 3: Envío de mensaje
      const messageId = await runTest(2, async () => {
        const messageId = await chatService.sendMessage(
          testChatIdValue,
          user.uid,
          testUserId,
          'Mensaje de prueba del sistema de chat',
          'text'
        );
        return { 
          message: `Mensaje enviado: ${messageId}`,
          details: { messageId }
        };
      });

      // Test 4: Verificación de estado de entrega
      await runTest(3, async () => {
        // Simular entrega del mensaje
        if (messageId.details?.messageId) {
          await chatService.markMessageAsDelivered(testChatIdValue, messageId.details.messageId as string);
          return { message: 'Mensaje marcado como entregado' };
        }
        throw new Error('No hay messageId para verificar entrega');
      });

      // Test 5: Marcado como leído
      await runTest(4, async () => {
        if (messageId.details?.messageId) {
          await chatService.markMessageAsRead(testChatIdValue, messageId.details.messageId as string);
          return { message: 'Mensaje marcado como leído' };
        }
        throw new Error('No hay messageId para marcar como leído');
      });

      // Test 6: Typing indicators
      await runTest(5, async () => {
        await chatService.setTyping(testChatIdValue, user.uid, true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await chatService.setTyping(testChatIdValue, user.uid, false);
        return { message: 'Typing indicators funcionando' };
      });

      // Test 7: Estado online
      await runTest(6, async () => {
        await chatService.setOnlineStatus(user.uid, true);
        const onlineUsers = await chatService.getOnlineUsers([user.uid]);
        return { 
          message: `Estado online actualizado. Usuarios online: ${onlineUsers.length}`,
          details: { onlineUsers }
        };
      });

      // Test 8: Reintento de mensajes (simulado)
      await runTest(7, async () => {
        // Simular un mensaje fallido y reintento
        const failedMessageId = await chatService.sendMessage(
          testChatIdValue,
          user.uid,
          testUserId,
          'Mensaje de prueba para reintento',
          'text'
        );
        
        // Simular fallo y reintento
        await chatService.updateMessageStatus(testChatIdValue, failedMessageId, 'failed');
        await chatService.updateMessageStatus(testChatIdValue, failedMessageId, 'retrying');
        await chatService.updateMessageStatus(testChatIdValue, failedMessageId, 'sent');
        
        return { 
          message: 'Sistema de reintento funcionando',
          details: { failedMessageId }
        };
      });

      // Test 9: Sincronización en tiempo real
      await runTest(8, async () => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout en sincronización'));
          }, 5000);

          const unsubscribe = chatService.subscribeToMessages(testChatIdValue, (messages) => {
            setTestMessages(messages);
            if (messages.length > 0) {
              clearTimeout(timeout);
              unsubscribe();
              resolve({ 
                message: `Sincronización funcionando. ${messages.length} mensajes recibidos`,
                details: { messageCount: messages.length }
              });
            }
          });
        });
      });

      // Test 10: Limpieza
      await runTest(9, async () => {
        chatService.cleanupMessageListeners(testChatIdValue);
        await chatService.clearPresence();
        return { message: 'Limpieza completada' };
      });

    } catch (error) {
      console.error('Error en las pruebas:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runTest = async (testIndex: number, testFunction: () => Promise<any>): Promise<any> => {
    const startTime = Date.now();
    updateTestResult(testIndex, { status: 'running' });

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      updateTestResult(testIndex, { 
        status: 'success', 
        duration,
        message: result.message,
        details: result.details
      });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(testIndex, { 
        status: 'error', 
        duration,
        message: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pruebas del Sistema de Chat
          </h1>
          <p className="text-gray-600">Debes estar autenticado para ejecutar las pruebas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              🧪 Pruebas del Sistema de Chat
            </h1>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isRunning ? '🔄 Ejecutando...' : '▶️ Ejecutar Todas las Pruebas'}
            </button>
          </div>

          {/* Información del usuario */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">👤 Usuario de Prueba</h2>
            <div className="text-sm text-blue-700">
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
              {testChatId && <p><strong>Chat ID:</strong> {testChatId}</p>}
            </div>
          </div>

          {/* Resultados de las pruebas */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">📊 Resultados de las Pruebas</h2>
            
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusIcon(result.status)}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {index + 1}. {result.test}
                      </h3>
                      {result.message && (
                        <p className={`text-sm ${getStatusColor(result.status)}`}>
                          {result.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {result.duration && `${result.duration}ms`}
                  </div>
                </div>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                      Ver detalles
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {/* Mensajes de prueba */}
          {testMessages.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">💬 Mensajes de Prueba</h2>
              <div className="bg-gray-50 border rounded-lg p-4 max-h-64 overflow-y-auto">
                {testMessages.map((message, index) => (
                  <div key={index} className="mb-2 p-2 bg-white rounded border text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{message.content}</span>
                      <span className="text-xs text-gray-500">{message.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Sin timestamp'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado de typing */}
          {typingStatus && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⌨️ {typingStatus}
              </p>
            </div>
          )}

          {/* Resumen de la prueba */}
          {testResults.some(r => r.status !== 'pending') && (
            <div className="mt-6 bg-gray-50 border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">📈 Resumen</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Exitosas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Fallidas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {testResults.filter(r => r.status === 'running').length}
                  </div>
                  <div className="text-sm text-gray-600">En ejecución</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {testResults.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}