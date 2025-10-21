import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { detectBrowser, getWebViewFallbacks } from '@/utils/browserDetection';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  city?: string;
  country?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number;
}

export class GeolocationService {
  private watchId: number | null = null;
  private lastUpdate: Date | null = null;
  private updateInterval: number = 30000; // 30 seconds
  private isTracking: boolean = false;
  private browserInfo = detectBrowser();
  private fallbacks = getWebViewFallbacks();

  constructor(private userId: string) {
    console.log('🌍 GeolocationService initialized for browser:', this.browserInfo.browserName);
    if (this.browserInfo.isTraeApp) {
      console.log('🎯 Trae App detected - using WebView optimizations');
    }
  }

  /**
   * Start tracking user location
   */
  async startTracking(options: GeolocationOptions = {}): Promise<void> {
    if (this.isTracking) {
      return;
    }

    // Check browser support
    if (!this.browserInfo.supportsGeolocation) {
      console.warn('🚫 Geolocation not supported in this browser:', this.browserInfo.browserName);
      if (this.browserInfo.isTraeApp) {
        throw new Error('La geolocalización no está disponible en el navegador integrado de Trae. Por favor, abre la aplicación en tu navegador principal para usar esta función.');
      } else {
        throw new Error('Geolocation is not supported by this browser');
      }
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const {
      enableHighAccuracy = true,
      timeout = 10000,
      maximumAge = 60000,
      updateInterval = 30000
    } = options;

    this.updateInterval = updateInterval;
    this.isTracking = true;

    const geolocationOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge
    };

    // Get initial position
    try {
      const position = await this.getCurrentPosition(geolocationOptions);
      await this.updateUserLocation(position);
    } catch (error) {
      console.error('Error getting initial position:', error);
    }

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      geolocationOptions
    );
  }

  /**
   * Stop tracking user location
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
  }

  /**
   * Get current position as a Promise
   */
  private getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  /**
   * Handle position updates
   */
  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    const now = new Date();
    
    // Throttle updates based on interval
    if (this.lastUpdate && (now.getTime() - this.lastUpdate.getTime()) < this.updateInterval) {
      return;
    }

    try {
      await this.updateUserLocation(position);
      this.lastUpdate = now;
    } catch (error) {
      console.error('Error updating user location:', error);
    }
  }

  /**
   * Handle position errors
   */
  private handlePositionError(error: GeolocationPositionError): void {
    console.error('Geolocation error:', error);
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('User denied the request for Geolocation.');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        console.error('The request to get user location timed out.');
        break;
      default:
        console.error('An unknown error occurred.');
        break;
    }
  }

  /**
   * Update user location in Firestore
   */
  private async updateUserLocation(position: GeolocationPosition): Promise<void> {
    const { latitude, longitude, accuracy } = position.coords;

    const geolocationData: GeolocationData = {
      latitude,
      longitude,
      accuracy,
      timestamp: new Date()
    };

    // Try to get city and country from reverse geocoding
    try {
      const locationInfo = await this.reverseGeocode(latitude, longitude);
      geolocationData.city = locationInfo.city;
      geolocationData.country = locationInfo.country;
    } catch (error) {
      console.warn('Could not get location info:', error);
    }

    // Update user document in Firestore
    const userRef = doc(db, 'users', this.userId);
    await updateDoc(userRef, {
      location: {
        latitude,
        longitude,
        accuracy,
        city: geolocationData.city,
        country: geolocationData.country,
        lastUpdated: serverTimestamp()
      }
    });
  }

  /**
   * Reverse geocoding to get city and country
   */
  private async reverseGeocode(latitude: number, longitude: number): Promise<{
    city?: string;
    country?: string;
  }> {
    try {
      // Using a free geocoding service (you might want to use a paid service for production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      
      return {
        city: data.city || data.locality,
        country: data.countryName
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {};
    }
  }

  /**
   * Calculate distance between two points in kilometers
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if geolocation is available
   */
  static isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request geolocation permission
   */
  static async requestPermission(): Promise<PermissionState> {
    if (!navigator.permissions) {
      throw new Error('Permissions API not supported');
    }

    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  }
}

export default GeolocationService;