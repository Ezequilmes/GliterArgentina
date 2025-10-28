'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { fcmService } from '@/services/fcmService';

export default function TestNotificationsPage() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Iniciando diagnóstico de notificaciones...');

    try {
      // Verificar soporte básico
      const isSupported = await fcmService.isNotificationSupported();
      addLog(`Soporte de notificaciones: ${isSupported}`);

      // Verificar estado del permiso
      const permissionStatus = fcmService.getPermissionStatus();
      addLog(`Estado del permiso: ${permissionStatus}`);

      // Verificar Service Worker
      const swSupported = 'serviceWorker' in navigator;
      addLog(`Service Worker soportado: ${swSupported}`);

      // Verificar si hay SW registrado
      if (swSupported) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        addLog(`Service Workers registrados: ${registrations.length}`);
        registrations.forEach((reg, index) => {
          addLog(`SW ${index + 1}: ${reg.scope}`);
        });
      }

      // Verificar variables de entorno
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      addLog(`VAPID Key configurada: ${vapidKey ? 'Sí' : 'No'}`);

      // Verificar contexto seguro
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      addLog(`Contexto seguro: ${isSecure}`);

      // Intentar obtener token si el permiso está concedido
      if (permissionStatus === 'granted') {
        try {
          addLog('Intentando obtener token de registro...');
          const token = await fcmService.getCurrentToken();
          if (token) {
            addLog('Token obtenido: Sí');
            addLog(`Token: ${token.substring(0, 50)}...`);
            setRegistrationToken(token);
          } else {
            addLog('Token obtenido: No');
            setRegistrationToken(null);
          }
        } catch (error) {
          addLog(`Error obteniendo token: ${error}`);
          setRegistrationToken(null);
        }
      }

      setDiagnostics({
        isSupported,
        permissionStatus,
        swSupported,
        vapidKey: !!vapidKey,
        isSecure,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      addLog(`Error en diagnóstico: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    addLog('Solicitando permiso de notificaciones...');
    try {
      const granted = await fcmService.requestPermission();
      addLog(`Permiso concedido: ${granted ? 'Sí' : 'No'}`);
      await runDiagnostics();
    } catch (error) {
      addLog(`Error al solicitar permiso: ${error}`);
    }
  };

  const sendTestNotification = async () => {
    if (!registrationToken) {
      addLog('❌ No hay token de registro disponible. Ejecuta el diagnóstico primero.');
      return;
    }

    setIsSendingTest(true);
    addLog('📤 Enviando notificación de prueba...');

    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: registrationToken,
          title: 'Prueba de Notificación - Gliter Argentina',
          body: `Notificación enviada a las ${new Date().toLocaleTimeString()}`,
          data: {
            type: 'test',
            source: 'diagnostic-page',
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        addLog('✅ Notificación enviada correctamente');
        addLog(`📋 ID del mensaje: ${result.messageId}`);
        addLog('🔔 Deberías recibir la notificación en unos segundos');
      } else {
        addLog(`❌ Error enviando notificación: ${result.error}`);
        if (result.details) {
          addLog(`📝 Detalles: ${result.details}`);
        }
      }
    } catch (error) {
      addLog(`❌ Error de red: ${error}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Notificaciones</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Soporte:</span>
                <Badge variant={diagnostics.isSupported ? "default" : "error"} className="ml-2">
                  {diagnostics.isSupported ? "Soportado" : "No soportado"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Permiso:</span>
                <Badge 
                  variant={
                    diagnostics.permissionStatus === 'granted' ? "success" : 
                    diagnostics.permissionStatus === 'denied' ? "error" : "secondary"
                  } 
                  className="ml-2"
                >
                  {diagnostics.permissionStatus || "Desconocido"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Service Worker:</span>
                <Badge variant={diagnostics.swSupported ? "default" : "error"} className="ml-2">
                  {diagnostics.swSupported ? "Soportado" : "No soportado"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">VAPID Key:</span>
                <Badge variant={diagnostics.vapidKey ? "default" : "error"} className="ml-2">
                  {diagnostics.vapidKey ? "Configurada" : "No configurada"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Contexto Seguro:</span>
                <Badge variant={diagnostics.isSecure ? "default" : "error"} className="ml-2">
                  {diagnostics.isSecure ? "Seguro" : "No seguro"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runDiagnostics} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}
              </Button>
              <Button 
                onClick={sendTestNotification}
                disabled={isSendingTest || !registrationToken}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSendingTest ? 'Enviando...' : 'Enviar Notificación de Prueba'}
              </Button>
              <Button 
                onClick={() => setLogs([])} 
                variant="outline"
              >
                Limpiar Logs
              </Button>
            </div>
            <Button onClick={requestPermission} variant="outline">
              Solicitar Permiso
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs de Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No hay logs disponibles</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}