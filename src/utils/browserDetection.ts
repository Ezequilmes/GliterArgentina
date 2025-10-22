/**
 * Browser detection utilities for handling WebView and embedded browser limitations
 */

export interface BrowserInfo {
  isWebView: boolean;
  isTraeApp: boolean;
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
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isClient = typeof window !== 'undefined';
  
  // Detect WebView patterns - more conservative approach
  const isWebView = isClient && (
    // Only detect explicit WebView indicators, not version patterns
    /WebView/i.test(userAgent) ||
    // Android WebView with explicit wv indicator
    /Android.*wv\)/.test(userAgent) ||
    // iOS WebView without Safari in user agent
    /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent)
  );

  // Detect Trae app specifically - only through explicit markers
  const isTraeApp = isClient && (
    // Only detect if explicitly marked as Trae app through user agent or window properties
    /TraeApp/i.test(userAgent) ||
    (window as any).TraeApp ||
    (window as any).trae
  );

  const isMobile = isClient && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isIOS = isClient && /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = isClient && /Android/.test(userAgent);

  // Determine browser name
  let browserName = 'Unknown';
  if (isTraeApp) {
    browserName = 'Trae App';
  } else if (isWebView) {
    browserName = 'WebView';
  } else if (userAgent.includes('Chrome')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browserName = 'Edge';
  }

  // Test API support
  const supportsServiceWorker = isClient && 'serviceWorker' in navigator && !isWebView;
  const supportsNotifications = isClient && !isWebView && (() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined';
    } catch {
      return false;
    }
  })();
  const supportsGeolocation = isClient && 'geolocation' in navigator;
  const supportsLocalStorage = isClient && (() => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  })();
  const supportsIndexedDB = isClient && 'indexedDB' in window;

  return {
    isWebView,
    isTraeApp,
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
  
  if (info.isTraeApp) {
    console.log('🎯 Trae App detected - applying WebView optimizations');
  }
  
  if (info.isWebView) {
    console.log('📱 WebView detected - some features may be limited');
  }
  
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

export function getWebViewFallbacks() {
  const info = detectBrowser();
  
  return {
    // Storage fallbacks
    storage: info.supportsLocalStorage ? localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    },
    
    // Geolocation fallback
    geolocation: info.supportsGeolocation ? navigator.geolocation : {
      getCurrentPosition: (success: any, error: any) => {
        error({ code: 1, message: 'Geolocation not supported' });
      },
      watchPosition: () => 0,
      clearWatch: () => {}
    },
    
    // Notification fallback
    notification: info.supportsNotifications ? Notification : {
      permission: 'denied' as NotificationPermission,
      requestPermission: () => Promise.resolve('denied' as NotificationPermission)
    }
  };
}