'use client';

import React from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface LocationStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  className,
  showDetails = true,
  compact = false
}) => {
  const { 
    location, 
    loading, 
    error, 
    getCurrentLocation, 
    watchLocation, 
    stopWatching 
  } = useGeolocation();

  const handleGetLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleStartWatching = () => {
    watchLocation();
  };

  const handleStopWatching = () => {
    stopWatching();
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {loading ? (
          <Clock className="w-4 h-4 text-blue-500 animate-spin" />
        ) : error ? (
          <AlertCircle className="w-4 h-4 text-red-500" />
        ) : location ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <MapPin className="w-4 h-4 text-gray-400" />
        )}
        
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {loading ? 'Obteniendo ubicación...' : 
           error ? 'Error de ubicación' :
           location ? 'Ubicación activa' : 'Sin ubicación'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Estado de Ubicación
          </h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {loading ? (
            <Clock className="w-4 h-4 text-blue-500 animate-spin" />
          ) : error ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : location ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4">
        {loading && (
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm">Obteniendo tu ubicación...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {location && !loading && (
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Ubicación obtenida correctamente</span>
          </div>
        )}

        {!location && !loading && !error && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Ubicación no disponible</span>
          </div>
        )}
      </div>

      {/* Location Details */}
      {showDetails && location && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Latitud:</span>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                {location.latitude.toFixed(6)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Longitud:</span>
              <div className="font-mono text-gray-900 dark:text-gray-100">
                {location.longitude.toFixed(6)}
              </div>
            </div>
            {location.city && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Ciudad:</span>
                <div className="text-gray-900 dark:text-gray-100">
                  {location.city}
                  {location.country && `, ${location.country}`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetLocation}
          disabled={loading}
          className="flex-1"
        >
          <MapPin className="w-4 h-4 mr-2" />
          {loading ? 'Obteniendo...' : 'Obtener Ubicación'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartWatching}
          disabled={loading}
          className="flex-1"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Seguir Ubicación
        </Button>
      </div>

      {/* Permission Info */}
      {error && error.includes('denied') && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Permisos de ubicación requeridos</p>
              <p>
                Para encontrar personas cerca de ti, necesitamos acceso a tu ubicación. 
                Por favor, habilita los permisos de ubicación en tu navegador.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationStatus;