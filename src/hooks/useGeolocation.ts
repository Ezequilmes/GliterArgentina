import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger } from '@/services/loggingService';

// Create component-specific logger
const logger = createLogger('useGeolocation');

interface GeolocationState {
  location: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  permission: PermissionState | null;
  retryCount: number;
  isWatching: boolean;
  lastAttempt: number | null;
  consecutiveFailures: number;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  maxRetries?: number;
  retryDelay?: number;
  watchPosition?: boolean;
  minRetryInterval?: number;
  maxConsecutiveFailures?: number;
  fallbackToIP?: boolean;
}

const DEFAULT_OPTIONS: Required<GeolocationOptions> = {
  enableHighAccuracy: true,
  timeout: 15000, // Increased timeout
  maximumAge: 300000, // 5 minutes
  maxRetries: 5, // Increased max retries
  retryDelay: 3000, // Increased retry delay
  watchPosition: false,
  minRetryInterval: 5000, // Minimum 5 seconds between retries
  maxConsecutiveFailures: 3,
  fallbackToIP: true,
};

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    permission: null,
    retryCount: 0,
    isWatching: false,
    lastAttempt: null,
    consecutiveFailures: 0,
  });

  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Check if geolocation is supported
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Use centralized logging service
  const logGeolocation = useCallback((level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    switch (level) {
      case 'info':
        logger.info(message, data);
        break;
      case 'warn':
        logger.warn(message, data);
        break;
      case 'error':
        logger.error(message, data);
        break;
    }
  }, []);

  // Set permission state helper
  const setPermissionState = useCallback((permission: PermissionState) => {
    setState(prev => ({ ...prev, permission }));
  }, []);

  // Check geolocation permissions
  const checkPermissions = useCallback(async (): Promise<PermissionState> => {
    try {
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionState(permission.state);
        
        // Listen for permission changes
        permission.onchange = () => {
          setPermissionState(permission.state);
        };
        
        return permission.state;
      }
    } catch {
      console.warn('Permissions API not supported');
    }
    
    return 'prompt';
  }, [setPermissionState]);

  // Enhanced error handling with detailed messages
  const getErrorMessage = useCallback((err: GeolocationPositionError): string => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en la configuración del navegador.';
      case err.POSITION_UNAVAILABLE:
        return 'Información de ubicación no disponible. Verifica tu conexión GPS o de red.';
      case err.TIMEOUT:
        return `Tiempo de espera agotado (${opts.timeout}ms). Intenta nuevamente.`;
      default:
        return `Error desconocido al obtener ubicación: ${err.message}`;
    }
  }, [opts.timeout]);

  // Anti-cycle mechanism: check if we should attempt location request
  const shouldAttemptLocation = useCallback((): boolean => {
    const now = Date.now();
    
    // Check if we've exceeded max retries
    if (state.retryCount >= opts.maxRetries) {
      logGeolocation('warn', `Máximo de reintentos alcanzado: ${opts.maxRetries}`);
      return false;
    }

    // Check if we've exceeded max consecutive failures
    if (state.consecutiveFailures >= opts.maxConsecutiveFailures) {
      logGeolocation('warn', `Máximo de fallos consecutivos alcanzado: ${opts.maxConsecutiveFailures}`);
      return false;
    }

    // Check minimum retry interval
    if (state.lastAttempt && (now - state.lastAttempt) < opts.minRetryInterval) {
      logGeolocation('warn', `Esperando intervalo mínimo de reintento: ${opts.minRetryInterval}ms`);
      return false;
    }

    return true;
  }, [state.retryCount, state.consecutiveFailures, state.lastAttempt, opts, logGeolocation]);

  // Retry logic for failed geolocation requests
  const retryGetLocation = useCallback((attempt: number): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (attempt >= options.maxRetries!) {
        reject(new Error(`Falló después de ${options.maxRetries} intentos`));
        return;
      }

      setState(prev => ({ ...prev, retryCount: attempt + 1 }));
      
      // Clear any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation: GeolocationPosition = position;
              
              setState(prev => ({
                ...prev,
                location: newLocation,
                loading: false,
                retryCount: 0,
                consecutiveFailures: 0,
                lastAttempt: Date.now()
              }));
              resolve(newLocation);
            },
            (err) => {
              if (err.code === err.PERMISSION_DENIED) {
                // Don't retry on permission denied
                const errorMessage = getErrorMessage(err);
                setState(prev => ({
                  ...prev,
                  error: errorMessage,
                  loading: false,
                  retryCount: 0,
                  consecutiveFailures: prev.consecutiveFailures + 1
                }));
                reject(new Error(errorMessage));
              } else {
                // Retry on other errors
                retryGetLocation(attempt + 1).then(resolve).catch(reject);
              }
            },
            {
              enableHighAccuracy: options.enableHighAccuracy,
              timeout: Math.min(options.timeout!, 15000), // Cap timeout at 15 seconds
              maximumAge: options.maximumAge
            }
          );
        } else {
          reject(new Error('Geolocalización no soportada'));
        }
      }, attempt > 0 ? options.retryDelay! : 0);
    });
  }, [options.maxRetries, options.enableHighAccuracy, options.timeout, options.maximumAge, options.retryDelay, getErrorMessage]);

  // Get current position with enhanced error handling and retry logic
  const getCurrentLocation = useCallback(async (): Promise<GeolocationPosition> => {
    if (!isSupported) {
      const error = 'Geolocalización no soportada por este navegador';
      logGeolocation('error', error);
      throw new Error(error);
    }

    if (!shouldAttemptLocation()) {
      const error = 'No se puede intentar obtener ubicación en este momento';
      logGeolocation('warn', error);
      throw new Error(error);
    }

    // Check permissions first
    const permission = await checkPermissions();
    if (permission === 'denied') {
      const error = 'Permisos de ubicación denegados. Por favor, permite el acceso en la configuración del navegador.';
      logGeolocation('error', error);
      setState(prev => ({ ...prev, error }));
      throw new Error(error);
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      lastAttempt: Date.now() 
    }));

    logGeolocation('info', `Obteniendo ubicación (intento ${state.retryCount + 1}/${options.maxRetries})`);

    return new Promise((resolve, reject) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const timeoutId = setTimeout(() => {
        const error = `Tiempo de espera agotado (${options.timeout}ms)`;
        logGeolocation('error', error);
        setState(prev => ({ 
          ...prev, 
          error, 
          loading: false,
          consecutiveFailures: prev.consecutiveFailures + 1
        }));
        reject(new Error(error));
      }, options.timeout);

      const successCallback = (position: GeolocationPosition) => {
        clearTimeout(timeoutId);
        if (isUnmountedRef.current) return;

        logGeolocation('info', 'Ubicación obtenida exitosamente', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });

        setState(prev => ({
          ...prev,
          location: position,
          loading: false,
          error: null,
          retryCount: 0,
          consecutiveFailures: 0
        }));

        resolve(position);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        clearTimeout(timeoutId);
        if (isUnmountedRef.current) return;

        const errorMessage = getErrorMessage(error);
        logGeolocation('error', `Error al obtener ubicación: ${errorMessage}`, error);

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
          retryCount: prev.retryCount + 1,
          consecutiveFailures: prev.consecutiveFailures + 1
        }));

        // Auto-retry for certain errors
        if (error.code !== error.PERMISSION_DENIED && 
            state.retryCount < options.maxRetries! - 1 &&
            state.consecutiveFailures < options.maxConsecutiveFailures! - 1) {
          
          logGeolocation('info', `Reintentando en ${options.retryDelay}ms...`);
          
          retryTimeoutRef.current = setTimeout(() => {
            getCurrentLocation().then(resolve).catch(reject);
          }, options.retryDelay);
        } else {
          reject(new Error(errorMessage));
        }
      };

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          successCallback,
          errorCallback,
          {
            enableHighAccuracy: options.enableHighAccuracy,
            timeout: options.timeout,
            maximumAge: options.maximumAge,
          }
        );
      } else {
        const error = 'Geolocalización no soportada por este navegador';
        logGeolocation('error', error);
        setState(prev => ({ 
          ...prev, 
          error, 
          loading: false,
          consecutiveFailures: prev.consecutiveFailures + 1
        }));
        reject(new Error(error));
      }
    });
  }, [isSupported, shouldAttemptLocation, options, state.retryCount, state.consecutiveFailures, checkPermissions, getErrorMessage, logGeolocation]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      logGeolocation('info', 'Watch de ubicación detenido');
    }

    setState(prev => ({ ...prev, isWatching: false }));
  }, [logGeolocation]);

  // Watch position with enhanced error handling
  const watchLocation = useCallback(() => {
    if (!isSupported) {
      logGeolocation('error', 'Geolocation no soportada para watch');
      return;
    }

    if (watchIdRef.current !== null) {
      logGeolocation('warn', 'Ya hay un watch activo');
      return;
    }

    setState(prev => ({ ...prev, isWatching: true, loading: true }));
    logGeolocation('info', 'Iniciando watch de ubicación');

    const successCallback = (position: GeolocationPosition) => {
      if (isUnmountedRef.current) return;

      logGeolocation('info', 'Ubicación actualizada via watch', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      });

      setState(prev => ({
        ...prev,
        location: position,
        loading: false,
        error: null,
        retryCount: 0,
        consecutiveFailures: 0
      }));
    };

    const errorCallback = (error: GeolocationPositionError) => {
      if (isUnmountedRef.current) return;

      const errorMessage = getErrorMessage(error);
      logGeolocation('error', `Error en watch de ubicación: ${errorMessage}`, error);

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        consecutiveFailures: prev.consecutiveFailures + 1
      }));

      // Stop watching on persistent errors
      if (state.consecutiveFailures >= options.maxConsecutiveFailures!) {
        stopWatching();
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        {
          enableHighAccuracy: options.enableHighAccuracy,
          timeout: options.timeout,
          maximumAge: options.maximumAge,
        }
      );
    }
  }, [isSupported, options, getErrorMessage, logGeolocation, state.consecutiveFailures, stopWatching]);

  // (moved above)

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    setState({
      location: null,
      error: null,
      loading: false,
      permission: null,
      retryCount: 0,
      isWatching: false,
      lastAttempt: null,
      consecutiveFailures: 0,
    });
    logGeolocation('info', 'Estado de geolocalización reiniciado');
  }, [cleanup, logGeolocation]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // (moved above)

  // Check permissions on mount and when needed
  useEffect(() => {
    let mounted = true;

    const initPermissions = async () => {
      try {
        const permission = await checkPermissions();
        if (mounted) {
          setState(prev => ({ ...prev, permission }));
        }
      } catch (error) {
        logGeolocation('error', 'Error al inicializar permisos', error);
      }
    };

    initPermissions();

    return () => {
      mounted = false;
    };
  }, [checkPermissions, logGeolocation]);

  // Auto-start watching if enabled
  useEffect(() => {
    if (options.watchPosition && !state.isWatching && state.permission === 'granted') {
      watchLocation();
    }

    return () => {
      if (options.watchPosition) {
        stopWatching();
      }
    };
  }, [options.watchPosition, state.isWatching, state.permission, watchLocation, stopWatching]);

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false;

    return () => {
      isUnmountedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    location: state.location,
    error: state.error,
    loading: state.loading,
    permission: state.permission,
    retryCount: state.retryCount,
    isWatching: state.isWatching,
    consecutiveFailures: state.consecutiveFailures,
    lastAttempt: state.lastAttempt,
    
    // Actions
    getCurrentLocation,
    watchLocation,
    stopWatching,
    reset,
    checkPermissions,
    calculateDistance,
    
    // Utils
    isSupported,
    shouldAttemptLocation,
  };
}
