'use client';

import { useEffect, useState } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface SWStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isInstalling: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
  manualRegistration: boolean;
}

export default function TestSWRegister() {
  const { isSupported, isRegistered, isInstalling, registration, register } = useServiceWorker();
  const [status, setStatus] = useState<SWStatus>({
    isSupported: false,
    isRegistered: false,
    isInstalling: false,
    registration: null,
    error: null,
    manualRegistration: false
  });

  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      isSupported,
      isRegistered,
      isInstalling,
      registration
    }));
  }, [isSupported, isRegistered, isInstalling, registration]);

  const handleManualRegister = async () => {
    try {
      setStatus(prev => ({ ...prev, error: null, manualRegistration: true }));
      console.log('🔄 Iniciando registro manual del Service Worker...');
      
      await register();
      
      console.log('✅ Service Worker registrado manualmente');
      setStatus(prev => ({ ...prev, manualRegistration: false }));
    } catch (error) {
      console.error('❌ Error en registro manual:', error);
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        manualRegistration: false 
      }));
    }
  };

  const checkCurrentRegistrations = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('📋 Registros actuales de Service Worker:', registrations);
        
        registrations.forEach((reg, index) => {
          console.log(`SW ${index + 1}:`, {
            scope: reg.scope,
            active: reg.active?.scriptURL,
            installing: reg.installing?.scriptURL,
            waiting: reg.waiting?.scriptURL
          });
        });
      } catch (error) {
        console.error('Error obteniendo registros:', error);
      }
    }
  };

  useEffect(() => {
    checkCurrentRegistrations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Test Service Worker Registration
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado del Service Worker</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Soportado:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  status.isSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status.isSupported ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Registrado:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  status.isRegistered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status.isRegistered ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-medium">Instalando:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  status.isInstalling ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {status.isInstalling ? '🔄 Sí' : '⏸️ No'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-medium">Registration:</span>
                <div className="text-sm text-gray-600 mt-1">
                  {status.registration ? (
                    <div>
                      <div>Scope: {status.registration.scope}</div>
                      <div>Active: {status.registration.active?.scriptURL || 'None'}</div>
                    </div>
                  ) : (
                    'No registration'
                  )}
                </div>
              </div>
            </div>
          </div>

          {status.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <span className="text-red-800 font-medium">Error: </span>
              <span className="text-red-700">{status.error}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleManualRegister}
              disabled={status.manualRegistration || status.isInstalling}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status.manualRegistration ? '🔄 Registrando...' : '📝 Registrar Manualmente'}
            </button>
            
            <button
              onClick={checkCurrentRegistrations}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-4"
            >
              🔍 Verificar Registros
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>💡 Abre la consola del navegador para ver logs detallados</p>
          <p>🔧 Esta página fuerza el registro del Service Worker para FCM</p>
        </div>
      </div>
    </div>
  );
}