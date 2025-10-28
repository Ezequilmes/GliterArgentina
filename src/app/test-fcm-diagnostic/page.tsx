'use client';

import { useState, useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app } from '@/lib/firebase';

export default function FCMDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: {
        isProduction: process.env.NODE_ENV === 'production',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
        isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      },
      firebase: {
        appInitialized: !!app,
        projectId: app?.options?.projectId || 'unknown'
      },
      serviceWorker: {
        supported: 'serviceWorker' in navigator,
        registered: false,
        swPath: null
      },
      messaging: {
        supported: false,
        initialized: false,
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Set' : 'Missing',
        token: null,
        error: null
      },
      permissions: {
        notification: 'unknown',
        pushManager: 'unknown'
      }
    };

    try {
      // Check service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        results.serviceWorker.registered = !!registration;
        results.serviceWorker.swPath = registration?.active?.scriptURL || null;
      }

      // Check notification permissions
      if (typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined') {
        results.permissions.notification = window.Notification.permission;
      } else {
        results.permissions.notification = 'not available';
      }

      // Check push manager
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        results.permissions.pushManager = 'supported';
      } else {
        results.permissions.pushManager = 'not supported';
      }

      // Check FCM support
      const messagingSupported = await isSupported();
      results.messaging.supported = messagingSupported;

      if (messagingSupported) {
        try {
          const messaging = getMessaging(app);
          results.messaging.initialized = true;

          // Try to get token
          const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
          if (vapidKey) {
            const fcmToken = await getToken(messaging, { vapidKey });
            results.messaging.token = fcmToken ? 'Generated successfully' : 'Failed to generate';
            setToken(fcmToken);
          } else {
            results.messaging.error = 'VAPID key not configured';
          }
        } catch (error: any) {
          results.messaging.error = {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 3)
          };
        }
      }

    } catch (error: any) {
      results.globalError = {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      };
    }

    setDiagnostics(results);
    setLoading(false);
  };

  const sendTestNotification = async () => {
    if (!token) {
      setTestResult('No hay token FCM disponible');
      return;
    }

    setTestResult('Enviando notificación de prueba...');
    
    try {
      const response = await fetch('/api/send-fcm-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          title: 'Prueba FCM Real',
          body: 'Esta es una notificación REAL desde Gliter Argentina',
          data: {
            type: 'test',
            timestamp: Date.now().toString(),
            url: '/test-fcm-diagnostic'
          },
          icon: '/icons/icon-96x96.png',
          image: '/icons/icon-192x192.png'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult(`✅ Notificación enviada: ${result.messageId}`);
        if (result.isSimulated) {
          setTestResult(prev => prev + '\n⚠️ Modo simulación (Firebase Admin no configurado)');
        } else {
          setTestResult(prev => prev + '\n🚀 Notificación REAL enviada via Firebase Cloud Messaging');
        }
        setTestResult(prev => prev + '\n📱 La notificación debería llegar incluso con la app cerrada...');
      } else {
        setTestResult(`❌ Error: ${result.error}`);
        if (result.details) {
          setTestResult(prev => prev + `\n📋 Detalles: ${result.details}`);
        }
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResult(`❌ Error enviando notificación: ${error}`);
    }
  };

  const getStatusIcon = (condition: boolean | string) => {
    if (typeof condition === 'boolean') {
      return condition ? '✅' : '❌';
    }
    if (condition === 'supported' || condition === 'granted') return '✅';
    if (condition === 'denied') return '❌';
    if (condition === 'default') return '⚠️';
    return '❓';
  };

  const getStatusColor = (condition: boolean | string) => {
    if (typeof condition === 'boolean') {
      return condition ? 'text-green-600' : 'text-red-600';
    }
    if (condition === 'supported' || condition === 'granted') return 'text-green-600';
    if (condition === 'denied') return 'text-red-600';
    if (condition === 'default') return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ejecutando diagnósticos FCM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Diagnóstico FCM - Firebase Cloud Messaging
          </h1>

          <div className="space-y-6">
            {/* Environment */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">🌍 Entorno</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Producción:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.environment?.isProduction)}`}>
                    {getStatusIcon(diagnostics.environment?.isProduction)} {diagnostics.environment?.isProduction ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Protocolo:</span>
                  <span className={`ml-2 ${diagnostics.environment?.protocol === 'https:' ? 'text-green-600' : 'text-red-600'}`}>
                    {getStatusIcon(diagnostics.environment?.protocol === 'https:')} {diagnostics.environment?.protocol}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Contexto Seguro:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.environment?.isSecureContext)}`}>
                    {getStatusIcon(diagnostics.environment?.isSecureContext)} {diagnostics.environment?.isSecureContext ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Firebase */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">🔥 Firebase</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">App Inicializada:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.firebase?.appInitialized)}`}>
                    {getStatusIcon(diagnostics.firebase?.appInitialized)} {diagnostics.firebase?.appInitialized ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Project ID:</span>
                  <span className="ml-2 text-gray-600">{diagnostics.firebase?.projectId}</span>
                </div>
              </div>
            </div>

            {/* Service Worker */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">⚙️ Service Worker</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Soportado:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.serviceWorker?.supported)}`}>
                    {getStatusIcon(diagnostics.serviceWorker?.supported)} {diagnostics.serviceWorker?.supported ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Registrado:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.serviceWorker?.registered)}`}>
                    {getStatusIcon(diagnostics.serviceWorker?.registered)} {diagnostics.serviceWorker?.registered ? 'Sí' : 'No'}
                  </span>
                </div>
                {diagnostics.serviceWorker?.swPath && (
                  <div>
                    <span className="font-medium">Ruta:</span>
                    <span className="ml-2 text-gray-600 text-xs">{diagnostics.serviceWorker.swPath}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Messaging */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">💬 Firebase Messaging</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Soportado:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.messaging?.supported)}`}>
                    {getStatusIcon(diagnostics.messaging?.supported)} {diagnostics.messaging?.supported ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Inicializado:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.messaging?.initialized)}`}>
                    {getStatusIcon(diagnostics.messaging?.initialized)} {diagnostics.messaging?.initialized ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">VAPID Key:</span>
                  <span className={`ml-2 ${diagnostics.messaging?.vapidKey === 'Set' ? 'text-green-600' : 'text-red-600'}`}>
                    {getStatusIcon(diagnostics.messaging?.vapidKey === 'Set')} {diagnostics.messaging?.vapidKey}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Token:</span>
                  <span className={`ml-2 ${diagnostics.messaging?.token === 'Generated successfully' ? 'text-green-600' : 'text-red-600'}`}>
                    {getStatusIcon(diagnostics.messaging?.token === 'Generated successfully')} {diagnostics.messaging?.token || 'No generado'}
                  </span>
                </div>
                {diagnostics.messaging?.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded">
                    <span className="font-medium text-red-800">Error:</span>
                    <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">
                      {JSON.stringify(diagnostics.messaging.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">🔐 Permisos</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Notificaciones:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.permissions?.notification)}`}>
                    {getStatusIcon(diagnostics.permissions?.notification)} {diagnostics.permissions?.notification}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Push Manager:</span>
                  <span className={`ml-2 ${getStatusColor(diagnostics.permissions?.pushManager)}`}>
                    {getStatusIcon(diagnostics.permissions?.pushManager)} {diagnostics.permissions?.pushManager}
                  </span>
                </div>
              </div>
            </div>

            {/* Global Error */}
            {diagnostics.globalError && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h2 className="text-lg font-semibold mb-3 text-red-800">❌ Error Global</h2>
                <pre className="text-xs text-red-600 whitespace-pre-wrap">
                  {JSON.stringify(diagnostics.globalError, null, 2)}
                </pre>
              </div>
            )}

            {/* Actions */}
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">🔧 Acciones</h2>
              <div className="space-y-2">
                <button
                  onClick={runDiagnostics}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                >
                  🔄 Ejecutar Diagnósticos Nuevamente
                </button>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(diagnostics, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `fcm-diagnostics-${new Date().toISOString()}.json`;
                    link.click();
                  }}
                  className="ml-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  💾 Descargar Diagnósticos
                </button>
                {diagnostics.messaging?.token === 'Generated successfully' && (
                  <button
                    onClick={sendTestNotification}
                    className="ml-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    🚀 Enviar Notificación de Prueba
                  </button>
                )}
              </div>
              {testResult && (
                <div className="mt-4 p-3 bg-blue-50 rounded border">
                  <h3 className="font-medium text-blue-800 mb-2">Resultado de Prueba:</h3>
                  <pre className="text-sm text-blue-700 whitespace-pre-wrap">{testResult}</pre>
                </div>
              )}
            </div>

            {/* Raw Data */}
            <details className="border rounded-lg p-4">
              <summary className="text-lg font-semibold cursor-pointer">📊 Datos Completos (JSON)</summary>
              <pre className="mt-3 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}