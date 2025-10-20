'use client';

import React from 'react';
import { MapPin, Navigation, AlertCircle, CheckCircle, Clock, RefreshCw, Shield, Wifi } from 'lucide-react';
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
    permissionState,
    getCurrentLocation, 
    watchLocation, 
    stopWatching,
    retryCount,
    isWatching
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

  // Get status info for better UX
  const getStatusInfo = () => {
    if (loading) {
      return {
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        message: retryCount > 0 ? `Reintentando... (${retryCount})` : 'Obteniendo ubicación...',
        animate: 'animate-spin'
      };
    }
    
    if (error) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        message: 'Error de ubicación',
        animate: ''
      };
    }
    
    if (location) {
      return {
        icon: isWatching ? Navigation : CheckCircle,
        color: isWatching ? 'text-green-500' : 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        message: isWatching ? 'Siguiendo ubicación' : 'Ubicación activa',
        animate: isWatching ? 'animate-pulse' : ''
      };
    }
    
    return {
      icon: MapPin,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      message: 'Sin ubicación',
      animate: ''
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <StatusIcon className={cn('w-4 h-4', statusInfo.color, statusInfo.animate)} />
        
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {statusInfo.message}
        </span>
        
        {/* Permission indicator */}
        {permissionState && (
          <div className="flex items-center">
            <Shield className={cn(
              'w-3 h-3 ml-1',
              permissionState === 'granted' ? 'text-green-500' :
              permissionState === 'denied' ? 'text-red-500' : 'text-yellow-500'
            )} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border transition-all duration-300',
      statusInfo.borderColor,
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-primary-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            Estado de Ubicación
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <StatusIcon className={cn('w-4 h-4', statusInfo.color, statusInfo.animate)} />
          
          {/* Permission state indicator */}
          {permissionState && (
            <div className="flex items-center space-x-1">
              <Shield className={cn(
                'w-4 h-4',
                permissionState === 'granted' ? 'text-green-500' :
                permissionState === 'denied' ? 'text-red-500' : 'text-yellow-500'
              )} />
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {permissionState}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Status Message */}
      <div className={cn('mb-4 p-3 rounded-lg border', statusInfo.bgColor, statusInfo.borderColor)}>
        <div className="flex items-center space-x-2">
          <StatusIcon className={cn('w-4 h-4', statusInfo.color, statusInfo.animate)} />
          <span className={cn('text-sm font-medium', statusInfo.color)}>
            {statusInfo.message}
          </span>
        </div>
        
        {/* Additional status details */}
        {loading && retryCount > 0 && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Intento {retryCount} de 3...
          </div>
        )}
        
        {error && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        
        {location && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
            Precisión: ±{location.accuracy?.toFixed(0) || 'N/A'}m
            {location.timestamp && (
              <span className="ml-2">
                • Actualizado: {new Date(location.timestamp).toLocaleTimeString()}
              </span>
            )}
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
            {location.accuracy && (
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Precisión:</span>
                <div className="text-gray-900 dark:text-gray-100">
                  ±{location.accuracy.toFixed(0)} metros
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGetLocation}
          disabled={loading}
          className="flex-1 transition-all duration-200 hover:scale-105"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 mr-2" />
          )}
          {loading ? 'Obteniendo...' : 'Obtener Ubicación'}
        </Button>
        
        {isWatching ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStopWatching}
            className="flex-1 transition-all duration-200 hover:scale-105 border-red-200 text-red-600 hover:bg-red-50"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Detener Seguimiento
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartWatching}
            disabled={loading}
            className="flex-1 transition-all duration-200 hover:scale-105"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Seguir Ubicación
          </Button>
        )}
      </div>

      {/* Enhanced Permission Info */}
      {error && error.includes('denegado') && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Permisos de ubicación requeridos</p>
              <p className="mb-2">
                Para encontrar personas cerca de ti, necesitamos acceso a tu ubicación. 
                Por favor, habilita los permisos de ubicación en tu navegador.
              </p>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                <p>💡 <strong>Cómo habilitar:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Haz clic en el ícono de candado en la barra de direcciones</li>
                  <li>Selecciona "Permitir" para la ubicación</li>
                  <li>Recarga la página</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network connectivity warning */}
      {error && error.includes('no disponible') && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-2">
            <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Problema de conectividad</p>
              <p>
                Verifica tu conexión GPS o de red. Si estás en interiores, 
                intenta acercarte a una ventana o salir al exterior.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationStatus;