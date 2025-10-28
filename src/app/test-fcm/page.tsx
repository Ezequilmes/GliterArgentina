'use client';

import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '@/contexts/AuthContext';
import { fcmService } from '@/services/fcmService';
import app from '@/lib/firebase';

export default function TestFCM() {
  const { user, authUser, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Verificar el estado inicial de los permisos
    if (typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined') {
      setPermission(window.Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar que el usuario esté autenticado
      if (!authUser) {
        setError('Debes estar autenticado para obtener tokens FCM. Por favor, inicia sesión primero.');
        return;
      }

      console.log('Usuario autenticado:', authUser.uid);

      // Solicitar permisos de notificación usando el servicio FCM
      const hasPermission = await fcmService.requestPermission();
      if (typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined') {
        setPermission(window.Notification.permission);
      }

      if (hasPermission) {
        // Obtener token FCM usando el servicio
        const currentToken = await fcmService.getRegistrationToken();

        if (currentToken) {
          setToken(currentToken);
          console.log('Token FCM obtenido:', currentToken);

          // Configurar listener para mensajes en primer plano
          const messaging = getMessaging(app);
          onMessage(messaging, (payload) => {
            console.log('Mensaje recibido en primer plano:', payload);
            setMessages(prev => [...prev, {
              ...payload,
              timestamp: new Date().toLocaleString()
            }]);
          });

        } else {
          setError('No se pudo obtener el token FCM. Verifica la configuración VAPID y que estés en un contexto seguro (HTTPS).');
        }
      } else {
        setError('Permisos de notificación denegados');
      }
    } catch (err: unknown) {
      console.error('Error al obtener token FCM:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    alert('Token copiado al portapapeles');
  };

  const testNotification = async () => {
    if (!token) {
      alert('Primero obtén un token FCM');
      return;
    }

    if (!authUser) {
      alert('Debes estar autenticado para enviar notificaciones');
      return;
    }

    try {
      const response = await fetch('/api/test/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          title: 'Notificación de Prueba',
          body: `Esta es una notificación de prueba para el usuario ${authUser.uid}`,
          userId: authUser.uid
        }),
      });

      const result = await response.json();
      console.log('Notificación enviada:', result);
      alert('Notificación enviada');
    } catch (err) {
      console.error('Error al enviar notificación:', err);
      alert('Error al enviar notificación');
    }
  };

  const saveTokenToFirestore = async () => {
    if (!token) {
      alert('Primero obtén un token FCM');
      return;
    }

    if (!authUser) {
      alert('Debes estar autenticado para guardar el token');
      return;
    }

    try {
      // Usar el servicio FCM para guardar el token
      const success = await fcmService.saveTokenToServer(authUser.uid, token);
      
      if (success) {
        console.log('Token guardado exitosamente');
        alert('Token guardado en Firestore');
      } else {
        console.error('Error al guardar token');
        alert('Error al guardar token en Firestore');
      }
    } catch (err) {
      console.error('Error al guardar token:', err);
      alert('Error al guardar token');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🧪 Prueba de Tokens FCM Reales
          </h1>

          <div className="space-y-6">
            {/* Estado de autenticación */}
            <div className={`border rounded-lg p-4 ${authUser ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h2 className="text-lg font-semibold mb-2">Estado de Autenticación</h2>
              {authUser ? (
                <div className="text-green-700">
                  <p>✅ Usuario autenticado: {authUser.email}</p>
                  <p>🆔 ID de usuario: {authUser.uid}</p>
                </div>
              ) : (
                <div className="text-red-700">
                  <p>❌ No hay usuario autenticado</p>
                  <p>Por favor, inicia sesión en la aplicación antes de usar esta página</p>
                </div>
              )}
            </div>
            {/* Estado de permisos */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Estado de Permisos</h2>
              <p className="text-sm">
                Permisos de notificación: 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  permission === 'granted' ? 'bg-green-100 text-green-800' :
                  permission === 'denied' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {permission || 'No verificado'}
                </span>
              </p>
            </div>

            {/* Botón para obtener token */}
            <div className="space-y-4">
              <button
                onClick={requestPermission}
                disabled={loading || !authUser}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Obteniendo...' : '🔑 Obtener Token FCM Real'}
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
            </div>

            {/* Mostrar token */}
            {token && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-green-800">
                  ✅ Token FCM Obtenido
                </h3>
                <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                  {token}
                </div>
                <div className="mt-3 space-x-3">
                  <button
                    onClick={copyToken}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    📋 Copiar Token
                  </button>
                  <button
                    onClick={saveTokenToFirestore}
                    disabled={!token || !authUser}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm"
                  >
                    💾 Guardar en Firestore
                  </button>
                  <button
                    onClick={testNotification}
                    disabled={!token || !authUser}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm"
                  >
                    🚀 Probar Notificación
                  </button>
                </div>
              </div>
            )}

            {/* Mensajes recibidos */}
            {messages.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-yellow-800">
                  📨 Mensajes Recibidos
                </h3>
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="font-medium">{msg.notification?.title}</div>
                      <div className="text-sm text-gray-600">{msg.notification?.body}</div>
                      <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">📋 Instrucciones</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Asegúrate de estar autenticado en la aplicación</li>
                <li>Haz clic en "Obtener Token FCM Real" para solicitar permisos</li>
                <li>Acepta los permisos de notificación en el navegador</li>
                <li>Copia el token generado</li>
                <li>Guarda el token en Firestore para pruebas</li>
                <li>Prueba el envío de notificaciones con el token real</li>
                <li>Los tokens reales tienen 163 caracteres (no 152 como los falsos)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}