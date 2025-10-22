'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface MobileLoadingScreenProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  timeout?: number; // timeout en ms
  children?: React.ReactNode;
}

interface LoadingState {
  phase: 'initializing' | 'loading' | 'timeout' | 'error' | 'ready';
  message: string;
  isOnline: boolean;
  timeElapsed: number;
}

export default function MobileLoadingScreen({ 
  isLoading, 
  error, 
  onRetry, 
  timeout = 15000,
  children 
}: MobileLoadingScreenProps) {
  const [state, setState] = useState<LoadingState>({
    phase: 'initializing',
    message: 'Iniciando aplicación...',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    timeElapsed: 0
  });

  // Detectar si es móvil
  const isMobile = typeof window !== 'undefined' && (
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) ||
    ('ontouchstart' in window && window.innerWidth <= 768)
  );

  // Monitorear conexión
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Timer para timeout y progreso
  useEffect(() => {
    if (!isLoading) {
      setState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      setState(prev => {
        if (elapsed > timeout) {
          return {
            ...prev,
            phase: 'timeout',
            message: 'La carga está tomando más tiempo del esperado...',
            timeElapsed: elapsed
          };
        }

        // Mensajes progresivos
        let message = 'Iniciando aplicación...';
        if (elapsed > 2000) message = 'Conectando con Firebase...';
        if (elapsed > 5000) message = 'Cargando datos del usuario...';
        if (elapsed > 8000) message = 'Finalizando configuración...';

        return {
          ...prev,
          phase: elapsed > timeout ? 'timeout' : 'loading',
          message,
          timeElapsed: elapsed
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading, timeout]);

  // Manejar errores
  useEffect(() => {
    if (error) {
      setState(prev => ({
        ...prev,
        phase: 'error',
        message: error
      }));
    }
  }, [error]);

  // Si no es móvil o no está cargando, mostrar children
  if (!isMobile || (!isLoading && !error && state.phase === 'ready')) {
    return <>{children}</>;
  }

  // Pantalla de error
  if (state.phase === 'error' || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 px-4">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Error de carga
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {error || state.message}
            </p>

            {!state.isOnline && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-center space-x-2">
                  <WifiOff className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <p className="text-xs text-orange-800 dark:text-orange-400">
                    Sin conexión a internet
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="primary"
                  className="w-full flex items-center justify-center space-x-2"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reintentar</span>
                </Button>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de timeout
  if (state.phase === 'timeout') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 px-4">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-full p-3">
                <Loader2 className="w-8 h-8 text-yellow-600 dark:text-yellow-400 animate-spin" />
              </div>
            </div>
            
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Carga lenta detectada
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              La aplicación está tardando más de lo normal en cargar. Esto puede deberse a una conexión lenta.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800 dark:text-blue-400">
                Tiempo transcurrido: {Math.round(state.timeElapsed / 1000)}s
              </p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                className="w-full flex items-center justify-center space-x-2"
                size="sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar</span>
              </Button>
              
              <Button
                onClick={() => setState(prev => ({ ...prev, phase: 'loading' }))}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                Seguir esperando
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de carga normal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo o icono de la app */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  G
                </span>
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Gliter
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
            {state.message}
          </p>

          {/* Indicador de progreso */}
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            
            {/* Barra de progreso estimada */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((state.timeElapsed / timeout) * 100, 90)}%` 
                }}
              />
            </div>
          </div>

          {/* Indicador de conexión */}
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            {state.isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span>Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span>Sin conexión</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}