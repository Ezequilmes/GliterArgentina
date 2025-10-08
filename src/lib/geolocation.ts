import { Location, User, UserDistance } from '@/types';

/**
 * Convierte grados a radianes
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula la distancia entre dos puntos usando la fórmula Haversine
 * @param lat1 Latitud del primer punto
 * @param lon1 Longitud del primer punto
 * @param lat2 Latitud del segundo punto
 * @param lon2 Longitud del segundo punto
 * @returns Distancia en kilómetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Obtiene la ubicación actual del usuario
 */
export function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada por este navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let errorMessage = 'Error desconocido';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de geolocalización denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado para obtener la ubicación';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      }
    );
  });
}

/**
 * Observa los cambios de ubicación del usuario
 */
export function watchLocation(
  onLocationUpdate: (location: Location) => void,
  onError: (error: Error) => void
): number | null {
  if (!navigator.geolocation) {
    onError(new Error('Geolocalización no soportada por este navegador'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      let errorMessage = 'Error desconocido';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso de geolocalización denegado';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Información de ubicación no disponible';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo de espera agotado para obtener la ubicación';
          break;
      }
      
      onError(new Error(errorMessage));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutos
    }
  );
}

/**
 * Detiene el seguimiento de ubicación
 */
export function stopWatchingLocation(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}

/**
 * Calcula la distancia entre el usuario actual y una lista de usuarios
 * y los ordena por cercanía
 */
export function calculateUsersDistance(
  currentLocation: Location,
  users: User[]
): UserDistance[] {
  return users
    .filter((user) => user.location) // Filter out users without location
    .map((user) => ({
      user,
      distance: calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        user.location!.latitude,
        user.location!.longitude
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filtra usuarios por distancia máxima
 */
export function filterUsersByDistance(
  users: UserDistance[],
  maxDistance: number
): UserDistance[] {
  return users.filter((user) => user.distance <= maxDistance);
}

/**
 * Formatea la distancia para mostrar al usuario
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Verifica si el navegador soporta geolocalización
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

/**
 * Solicita permisos de geolocalización
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isGeolocationSupported()) {
    return false;
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    
    if (permission.state === 'granted') {
      return true;
    } else if (permission.state === 'prompt') {
      // Intentar obtener la ubicación para activar el prompt
      await getCurrentLocation();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error al solicitar permisos de geolocalización:', error);
    return false;
  }
}

/**
 * Obtiene la ciudad y país basado en coordenadas (usando API de geocodificación inversa)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city?: string; country?: string }> {
  try {
    // Usando la API de OpenStreetMap Nominatim (gratuita)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    );
    
    if (!response.ok) {
      throw new Error('Error en la respuesta de geocodificación');
    }
    
    const data = await response.json();
    
    return {
      city: data.address?.city || data.address?.town || data.address?.village,
      country: data.address?.country,
    };
  } catch (error) {
    console.error('Error en geocodificación inversa:', error);
    return {};
  }
}