import { useState, useEffect, useCallback } from 'react';
import { Location } from '@/types';

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

export interface UseGeolocationReturn {
  location: Location | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<Location>;
  watchLocation: () => void;
  stopWatching: () => void;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watch = false
  } = options;

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Get current position
  const getCurrentLocation = useCallback((): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocalización no soportada por este navegador';
        setError(error);
        reject(new Error(error));
        return;
      }

      setLoading(true);
      setError(null);

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
          resolve(newLocation);
        },
        (err) => {
          let errorMessage = 'Error al obtener ubicación';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible';
              break;
            case err.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado';
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Watch position changes
  const watchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por este navegador');
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    setError(null);
    
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
        let errorMessage = 'Error al obtener ubicación';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case err.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, watchId]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
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

  // Auto-start watching if enabled
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

  // Get initial location
  useEffect(() => {
    if (!watch && !location) {
      getCurrentLocation().catch(() => {
        // Error already handled in getCurrentLocation
      });
    }
  }, [watch, location, getCurrentLocation]);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    calculateDistance
  };
}