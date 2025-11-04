'use client';

import React from 'react';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';

interface FallbackModeProps {
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export default function FallbackMode({ onRetry, showRetryButton = true }: FallbackModeProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      typeof window !== 'undefined' && window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Modo Básico
          </h1>
          <p className="text-gray-600">
            Algunas funciones avanzadas no están disponibles temporalmente
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-700">Navegación básica</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <span className="text-sm text-gray-700">Inicio de sesión</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm text-gray-700">Funciones offline</span>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm text-gray-700">Notificaciones push</span>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-3">
          {showRetryButton && (
            <button
              onClick={handleRetry}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar configuración
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Continuar en modo básico
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Wifi className="w-4 h-4" />
            <span>
              Verifica tu conexión a internet para acceder a todas las funciones
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}