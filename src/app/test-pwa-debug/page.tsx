'use client';

import { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { detectBrowser } from '@/utils/browserDetection';

export default function PWADebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [swRegistrations, setSWRegistrations] = useState<ServiceWorkerRegistration[]>([]);
  
  const pwaInstall = usePWAInstall();
  const serviceWorker = useServiceWorker();
  const browserInfo = detectBrowser();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[PWA Debug] ${message}`);
  };

  useEffect(() => {
    addLog('Iniciando diagnóstico PWA...');
    
    // Check Service Worker registrations
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        setSWRegistrations([...registrations]);
        addLog(`Service Workers registrados: ${registrations.length}`);
        registrations.forEach((reg, index) => {
          addLog(`SW ${index + 1}: ${reg.scope} - Estado: ${reg.active ? 'activo' : 'inactivo'}`);
        });
      }).catch(error => {
        addLog(`Error obteniendo SW registrations: ${error.message}`);
      });
    } else {
      addLog('Service Worker no soportado');
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      addLog('🎉 beforeinstallprompt event detectado!');
      e.preventDefault();
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      addLog('🎉 App instalada!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      addLog(`Manifest encontrado: ${manifestLink.href}`);
      fetch(manifestLink.href)
        .then(response => response.json())
        .then(manifest => {
          addLog(`Manifest cargado: ${manifest.name}`);
        })
        .catch(error => {
          addLog(`Error cargando manifest: ${error.message}`);
        });
    } else {
      addLog('❌ No se encontró link al manifest');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const testInstallPrompt = async () => {
    addLog('Probando prompt de instalación...');
    try {
      const result = await pwaInstall.showInstallPrompt();
      addLog(`Resultado del prompt: ${result ? 'aceptado' : 'rechazado'}`);
    } catch (error) {
      addLog(`Error en prompt: ${error}`);
    }
  };

  const registerServiceWorker = async () => {
    addLog('Intentando registrar Service Worker...');
    try {
      await serviceWorker.register();
      addLog('Service Worker registrado exitosamente');
    } catch (error) {
      addLog(`Error registrando SW: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Diagnóstico PWA</h1>
        
        {/* Browser Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Información del Navegador</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Navegador: {browserInfo.browserName}</div>
            <div>Móvil: {browserInfo.isMobile ? 'Sí' : 'No'}</div>
            <div>iOS: {browserInfo.isIOS ? 'Sí' : 'No'}</div>
            <div>Android: {browserInfo.isAndroid ? 'Sí' : 'No'}</div>
            <div>User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</div>
          </div>
        </div>

        {/* PWA Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Estado PWA</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Instalable: {pwaInstall.isInstallable ? '✅ Sí' : '❌ No'}</div>
            <div>Instalada: {pwaInstall.isInstalled ? '✅ Sí' : '❌ No'}</div>
            <div>Standalone: {pwaInstall.isStandalone ? '✅ Sí' : '❌ No'}</div>
            <div>Puede Instalar: {pwaInstall.canInstall ? '✅ Sí' : '❌ No'}</div>
            <div>iOS: {pwaInstall.isIOS ? '✅ Sí' : '❌ No'}</div>
            <div>Prompt Mostrado: {pwaInstall.isInstallPromptShown ? '✅ Sí' : '❌ No'}</div>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={testInstallPrompt}
              disabled={!pwaInstall.canInstall}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300 mr-2"
            >
              Probar Instalación
            </button>
          </div>
        </div>

        {/* Service Worker Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Estado Service Worker</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Soportado: {serviceWorker.isSupported ? '✅ Sí' : '❌ No'}</div>
            <div>Registrado: {serviceWorker.isRegistered ? '✅ Sí' : '❌ No'}</div>
            <div>Instalando: {serviceWorker.isInstalling ? '✅ Sí' : '❌ No'}</div>
            <div>Esperando: {serviceWorker.isWaiting ? '✅ Sí' : '❌ No'}</div>
            <div>Controlando: {serviceWorker.isControlling ? '✅ Sí' : '❌ No'}</div>
            <div>Actualización Disponible: {serviceWorker.updateAvailable ? '✅ Sí' : '❌ No'}</div>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={registerServiceWorker}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              Registrar SW
            </button>
            <button 
              onClick={() => serviceWorker.update()}
              className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
            >
              Actualizar SW
            </button>
            <button 
              onClick={() => serviceWorker.cleanupServiceWorkers()}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Limpiar SW
            </button>
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Información del Entorno</h2>
          <div className="text-sm space-y-2">
            <div>NODE_ENV: {process.env.NODE_ENV || 'undefined'}</div>
            <div>HTTPS: {typeof window !== 'undefined' ? (location.protocol === 'https:' ? 'Sí' : 'No') : 'Loading...'}</div>
            <div>Secure Context: {typeof window !== 'undefined' ? (window.isSecureContext ? 'Sí' : 'No') : 'Loading...'}</div>
            <div>Document Ready: {typeof document !== 'undefined' ? document.readyState : 'Loading...'}</div>
          </div>
        </div>

        {/* Service Worker Registrations */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Service Workers Registrados</h2>
          {swRegistrations.length === 0 ? (
            <p className="text-gray-500">No hay Service Workers registrados</p>
          ) : (
            <div className="space-y-2">
              {swRegistrations.map((reg, index) => (
                <div key={index} className="border p-2 rounded">
                  <div className="text-sm">
                    <div>Scope: {reg.scope}</div>
                    <div>Estado: {reg.active ? 'Activo' : 'Inactivo'}</div>
                    <div>Installing: {reg.installing ? 'Sí' : 'No'}</div>
                    <div>Waiting: {reg.waiting ? 'Sí' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Logs de Diagnóstico</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
          <button 
            onClick={() => setLogs([])}
            className="mt-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Limpiar Logs
          </button>
        </div>
      </div>
    </div>
  );
}