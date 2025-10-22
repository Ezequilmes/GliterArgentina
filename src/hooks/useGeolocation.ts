import { useState, useEffect, useCallback, useRef } from 'react';
import { Location } from '@/types';

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface UseGeolocationReturn {
  location: Location | null;
  loading: boolean;
  error: string | null;
  permissionState: PermissionState | null;
  getCurrentLocation: () => Promise<Location>;
  watchLocation: () => void;
  stopWatching: () => void;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  checkPermissions: () => Promise<PermissionState>;
  retryCount: number;
  isWatching: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watch = false,
    retryAttempts = 3,
    retryDelay = 2000
  } = options;

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check geolocation permissions
  const checkPermissions = useCallback(async (): Promise<PermissionState> => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          setPermissionState(permission.state);
        };
        
        return permission.state;
      }
    } catch (err) {
      console.warn('Permissions API not supported');
    }
    
    return 'prompt';
  }, []);

  // Enhanced error handling with detailed messages
  const getErrorMessage = useCallback((err: GeolocationPositionError): string => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en la configuración del navegador.';
      case err.POSITION_UNAVAILABLE:
        return 'Información de ubicación no disponible. Verifica tu conexión GPS o de red.';
      case err.TIMEOUT:
        return `Tiempo de espera agotado (${timeout}ms). Intenta nuevamente.`;
      default:
        return `Error desconocido al obtener ubicación: ${err.message}`;
    }
  }, [timeout]);

  // Retry logic for failed geolocation requests
  const retryGetLocation = useCallback((attempt: number): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (attempt >= retryAttempts) {
        reject(new Error(`Falló después de ${retryAttempts} intentos`));
        return;
      }

      setRetryCount(attempt + 1);
      
      // Clear any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation: Location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            
            setLocation(newLocation);
            setLoading(false);
            setRetryCount(0);
            resolve(newLocation);
          },
          (err) => {
            if (err.code === err.PERMISSION_DENIED) {
              // Don't retry on permission denied
              const errorMessage = getErrorMessage(err);
              setError(errorMessage);
              setLoading(false);
              setRetryCount(0);
              reject(new Error(errorMessage));
            } else {
              // Retry on other errors
              retryGetLocation(attempt + 1).then(resolve).catch(reject);
            }
          },
          {
            enableHighAccuracy,
            timeout: Math.min(timeout, 15000), // Cap timeout at 15 seconds
            maximumAge
          }
        );
      }, attempt > 0 ? retryDelay : 0);
    });
  }, [enableHighAccuracy, timeout, maximumAge, retryAttempts, retryDelay, getErrorMessage]);

  // Get current position with enhanced error handling and retry logic
  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise(async (resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocalización no soportada por este navegador';
        setError(error);
        reject(new Error(error));
        return;
      }

      // Check permissions first
      const permission = await checkPermissions();
      if (permission === 'denied') {
        const error = 'Permisos de ubicación denegados. Por favor, permite el acceso en la configuración del navegador.';
        setError(error);
        reject(new Error(error));
        return;
      }

      setLoading(true);
      setError(null);
      setRetryCount(0);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Timeout para casos donde la solicitud no resuelve
      timeoutRef.current = setTimeout(() => {
        const error = 'Tiempo de espera agotado. Verifica tu conexión y permisos de ubicación.';
        setError(error);
        setLoading(false);
        reject(new Error(error));
      }, Math.min(timeout + 2000, 20000)); // Cap total timeout at 20 seconds

      try {
        const location = await retryGetLocation(0);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        resolve(location);
      } catch (err) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener ubicación';
        setError(errorMessage);
        setLoading(false);
        reject(new Error(errorMessage));
      }
    });
  }, [checkPermissions, retryGetLocation, timeout]);

  // Watch position changes with enhanced error handling
  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por este navegador');
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    setError(null);
    setIsWatching(true);
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setLocation(newLocation);
        setLoading(false);
      },
      (err) => {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        setLoading(false);
        
        // Stop watching on permission denied
        if (err.code === err.PERMISSION_DENIED) {
          setIsWatching(false);
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
          }
        }
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, watchId, getErrorMessage]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
    }
    
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [watchId]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }, []);

  // Helper function to convert degrees to radians
  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Auto-start watching if enabled (only if explicitly requested)
  useEffect(() => {
    if (watch) {
      watchLocation();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watch, watchLocation, watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    location,
    loading,
    error,
    permissionState,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    calculateDistance,
    checkPermissions,
    retryCount,
    isWatching
  };
}