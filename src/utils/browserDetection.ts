/**
 * Browser detection utilities for handling WebView and embedded browser limitations
 */

export interface BrowserInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browserName: string;
  supportsServiceWorker: boolean;
  supportsNotifications: boolean;
  supportsGeolocation: boolean;
  supportsLocalStorage: boolean;
  supportsIndexedDB: boolean;
}

export function detectBrowser(): BrowserInfo {
  // Return safe defaults for server-side rendering
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      browserName: 'Unknown',
      supportsServiceWorker: false,
      supportsNotifications: false,
      supportsGeolocation: false,
      supportsLocalStorage: false,
      supportsIndexedDB: false,
    };
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  // Detect mobile devices
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  // Detect browser name
  let browserName = 'Unknown';
  if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
    browserName = 'Chrome';
  } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
    browserName = 'Safari';
  } else if (/edg/.test(userAgent)) {
    browserName = 'Edge';
  } else if (/firefox/.test(userAgent)) {
    browserName = 'Firefox';
  } else if (/opera/.test(userAgent)) {
    browserName = 'Opera';
  }
  
  // Feature detection
  const supportsServiceWorker = 'serviceWorker' in navigator;
  const supportsNotifications = 'Notification' in window;
  const supportsGeolocation = 'geolocation' in navigator;
  const supportsLocalStorage = 'localStorage' in window;
  const supportsIndexedDB = 'indexedDB' in window;
  
  return {
    isMobile,
    isIOS,
    isAndroid,
    browserName,
    supportsServiceWorker,
    supportsNotifications,
    supportsGeolocation,
    supportsLocalStorage,
    supportsIndexedDB
  };
}

export function logBrowserInfo(): void {
  const info = detectBrowser();
  console.log('🔍 Browser Detection:', info);
  
  // Log unsupported features
  const unsupported = [];
  if (!info.supportsServiceWorker) unsupported.push('Service Worker');
  if (!info.supportsNotifications) unsupported.push('Push Notifications');
  if (!info.supportsGeolocation) unsupported.push('Geolocation');
  if (!info.supportsLocalStorage) unsupported.push('Local Storage');
  if (!info.supportsIndexedDB) unsupported.push('IndexedDB');
  
  if (unsupported.length > 0) {
    console.warn('⚠️ Unsupported features:', unsupported.join(', '));
  }
}

export function isFeatureSupported(feature: keyof BrowserInfo): boolean {
  const info = detectBrowser();
  return info[feature] as boolean;
}