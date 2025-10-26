'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { MapPin, AlertCircle, CheckCircle, Clock, RefreshCw, Navigation } from 'lucide-react';

export default function TestGeolocationPage() {
  const [status, setStatus] = useState<string>('Listo para probar');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Added safe window/navigator detection
  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';
  const userAgent = isBrowser ? navigator.userAgent : 'N/A';
  const geolocationSupported = isBrowser && 'geolocation' in navigator ? 'Sí' : 'No';

  const checkPermissions = async () => {
    setStatus('Verificando permisos...');
    
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por este navegador');
      setStatus('Error: Geolocalización no soportada');
      return;
    }

    try {
      // Verificar permisos usando la API de permisos
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setStatus(`Estado de permisos: ${permission.state}`);
      
      permission.onchange = () => {
        setStatus(`Permisos cambiaron a: ${permission.state}`);
      };
    } catch (err) {
      setStatus('No se pudo verificar permisos (API no soportada)');
    }
  };

  const requestLocation = () => {
    setLoading(true);
    setError(null);
    setLocation(null);
    setStatus('Solicitando ubicación...');

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        setLocation(position);
        setStatus('✅ Ubicación obtenida exitosamente');
        console.log('Ubicación obtenida:', position);
      },
      (err) => {
        setLoading(false);
        let errorMessage = '';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permisos denegados por el usuario';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case err.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
          default:
            errorMessage = 'Error desconocido';
            break;
        }
        
        setError(`${errorMessage} (Código: ${err.code})`);
        setStatus(`❌ Error: ${errorMessage}`);
        console.error('Error de geolocalización:', err);
      }
    );
  };

  const clearData = () => {
    setLocation(null);
    setError(null);
    setStatus('Datos limpiados');
  };

  const testWithWatch = () => {
    setLoading(true);
    setError(null);
    setLocation(null);
    setStatus('Iniciando seguimiento de ubicación...');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLoading(false);
        setLocation(position);
        setStatus('✅ Ubicación obtenida con watchPosition');
        navigator.geolocation.clearWatch(watchId);
      },
      (err) => {
        setLoading(false);
        setError(`Error en watchPosition: ${err.message}`);
        setStatus(`❌ Error en watchPosition`);
        navigator.geolocation.clearWatch(watchId);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Diagnóstico de Geolocalización
            </h1>
          </div>

          {/* Estado actual */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {loading ? (
                <Clock className="w-5 h-5 text-blue-500 animate-spin" />
              ) : error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : location ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <MapPin className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium text-gray-900 dark:text-gray-100">Estado:</span>
            </div>
            <p className="text-gray-700 dark:text-gray-300">{status}</p>
          </div>

          {/* Botones de prueba */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={checkPermissions}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verificar Permisos</span>
            </button>

            <button
              onClick={requestLocation}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>{loading ? 'Obteniendo...' : 'Obtener Ubicación'}</span>
            </button>

            <button
              onClick={testWithWatch}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Navigation className="w-4 h-4" />
              <span>Probar watchPosition</span>
            </button>

            <button
              onClick={clearData}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpiar Datos</span>
            </button>
          </div>

          {/* Mostrar error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-200 mb-1">Error</h3>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar ubicación */}
          {location && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">Ubicación Obtenida</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 dark:text-green-300">Latitud:</span>
                      <div className="font-mono text-green-900 dark:text-green-100">
                        {location.coords.latitude.toFixed(6)}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700 dark:text-green-300">Longitud:</span>
                      <div className="font-mono text-green-900 dark:text-green-100">
                        {location.coords.longitude.toFixed(6)}
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700 dark:text-green-300">Precisión:</span>
                      <div className="font-mono text-green-900 dark:text-green-100">
                        {location.coords.accuracy.toFixed(0)}m
                      </div>
                    </div>
                    <div>
                      <span className="text-green-700 dark:text-green-300">Timestamp:</span>
                      <div className="font-mono text-green-900 dark:text-green-100">
                        {new Date(location.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Instrucciones</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <li>Primero haz clic en "Verificar Permisos" para ver el estado actual</li>
              <li>Luego haz clic en "Obtener Ubicación" - esto debería mostrar el diálogo de permisos</li>
              <li>Si no aparece el diálogo, prueba con "Probar watchPosition"</li>
              <li>Si sigue sin funcionar, revisa la configuración del navegador</li>
            </ol>
          </div>

          {/* Información del navegador */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Información del Navegador</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>User Agent: {userAgent}</div>
              <div>Geolocalización soportada: {geolocationSupported}</div>
              <div>HTTPS: {typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Sí' : 'No'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}