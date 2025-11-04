'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface UseNetworkStatusReturn {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionInfo: NetworkStatus;
  retryConnection: () => Promise<boolean>;
  isRetrying: boolean;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<NetworkStatus>({
    isOnline: true,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  });

  const { addToast } = useToast();
  const addToastRef = useRef(addToast);
  
  // Update ref when addToast changes
  useEffect(() => {
    addToastRef.current = addToast;
  }, [addToast]);

  // Update connection info
  const updateConnectionInfo = useCallback(() => {
    const online = navigator.onLine;
    
    // Get network information if available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    let slowConnection = false;
    let connType = 'unknown';
    let effectiveType = 'unknown';
    let downlink = 0;
    let rtt = 0;

    if (connection) {
      connType = connection.type || connection.effectiveType || 'unknown';
      effectiveType = connection.effectiveType || 'unknown';
      downlink = connection.downlink || 0;
      rtt = connection.rtt || 0;

      // Determine if connection is slow
      slowConnection = effectiveType === 'slow-2g' || 
                      effectiveType === '2g' || 
                      (downlink > 0 && downlink < 0.5) ||
                      (rtt > 0 && rtt > 2000);
    }

    const newConnectionInfo: NetworkStatus = {
      isOnline: online,
      isSlowConnection: slowConnection,
      connectionType: connType,
      effectiveType,
      downlink,
      rtt,
    };

    // Update all states in a single batch
    setConnectionInfo(prev => {
      // Only update if there's actually a change
      if (JSON.stringify(prev) !== JSON.stringify(newConnectionInfo)) {
        setIsOnline(online);
        setIsSlowConnection(slowConnection);
        return newConnectionInfo;
      }
      return prev;
    });

    return newConnectionInfo;
  }, []);

  // Test actual connectivity by making a request
  const testConnectivity = useCallback(async (retryCount = 0): Promise<boolean> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo base
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Usar la URL correcta con trailing slash según la configuración de Next.js
      const healthUrl = process.env.NODE_ENV === 'development' 
        ? '/api/health/' 
        : `${window.location.origin}/api/health/`;
      
      const response = await fetch(healthUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return true;
      }
      
      // Si la respuesta no es ok, intentar con GET como fallback
      if (response.status === 405) { // Method Not Allowed
        const getResponse = await fetch(healthUrl, {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });
        clearTimeout(timeoutId);
        return getResponse.ok;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      console.warn(`Connectivity test failed (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Implementar backoff exponencial para reintentos
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000; // Jitter
        console.log(`Retrying connectivity test in ${Math.round(delay)}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return testConnectivity(retryCount + 1);
      }
      
      // Si todos los reintentos fallan, verificar si es un error de red o del servidor
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network connectivity issue detected');
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('Connectivity test timed out');
      } else {
        console.error('Server connectivity issue:', error);
      }
      
      return false;
    }
  }, []);

  // Retry connection
  const retryConnection = useCallback(async (): Promise<boolean> => {
    if (isRetrying) return false;

    setIsRetrying(true);
    console.log('🔄 Attempting to restore connection...');
    
    try {
      // Usar testConnectivity que ya tiene reintentos incorporados
      const isConnected = await testConnectivity();
      
      if (isConnected) {
        updateConnectionInfo();
        if (!isOnline) {
          addToastRef.current({
            type: 'success',
            title: 'Conexión restaurada',
            message: 'La conexión a internet se ha restablecido'
          });
        }
        
        // Mostrar notificación de reconexión exitosa
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Conexión restaurada', {
            body: 'La conexión a internet se ha restablecido',
            icon: '/logo.svg',
            tag: 'connection-restored'
          });
        }
        
        console.log('✅ Connection restored successfully');
        return true;
      }
      
      console.log('❌ Connection retry failed');
      return false;
    } catch (error) {
      console.error('Error during connection retry:', error);
      addToastRef.current({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudo verificar la conectividad'
      });
      return false;
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, isOnline, testConnectivity, updateConnectionInfo]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateConnectionInfo();
      if (!isOnline) {
        addToastRef.current({
          type: 'success',
          title: 'Conexión restaurada',
          message: 'La conexión a internet se ha restablecido'
        });
      }
    };

    const handleOffline = () => {
      updateConnectionInfo();
      addToastRef.current({
        type: 'error',
        title: 'Sin conexión',
        message: 'Se ha perdido la conexión a internet'
      });
    };

    const handleConnectionChange = () => {
      updateConnectionInfo();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial check
    updateConnectionInfo();

    // Periodic connectivity check con backoff inteligente
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    const baseInterval = 30000; // 30 segundos base
    
    const performPeriodicCheck = async () => {
      // Solo verificar si el navegador indica que está online
      if (!navigator.onLine) {
        consecutiveFailures = 0;
        return;
      }
      
      try {
        const isConnected = await testConnectivity();
        
        if (!isConnected && isOnline) {
          consecutiveFailures++;
          setIsOnline(false);
          addToastRef.current({
            type: 'error',
            title: 'Conexión perdida',
            message: 'Se ha perdido la conexión a internet',
            persistent: true
          });
        } else if (isConnected && !isOnline) {
          consecutiveFailures = 0;
          setIsOnline(true);
          addToastRef.current({
            type: 'success',
            title: 'Conexión restablecida',
            message: 'La conexión a internet se ha restablecido'
          });
        } else if (isConnected) {
          consecutiveFailures = 0;
        }
      } catch (error) {
        console.warn('Periodic connectivity check failed:', error);
        consecutiveFailures++;
      }
    };
    
    const scheduleNextCheck = () => {
      // Aumentar el intervalo si hay fallos consecutivos para evitar spam
      const interval = consecutiveFailures > maxConsecutiveFailures 
        ? baseInterval * Math.min(Math.pow(2, consecutiveFailures - maxConsecutiveFailures), 8) // Max 4 minutos
        : baseInterval;
        
      setTimeout(() => {
        performPeriodicCheck().then(scheduleNextCheck);
      }, interval);
    };
    
    // Iniciar la verificación periódica
    scheduleNextCheck();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      // La verificación periódica se limpia automáticamente cuando el componente se desmonta
      // ya que usa setTimeout en lugar de setInterval
    };
  }, [isOnline, testConnectivity, updateConnectionInfo]);

  return {
    isOnline,
    isSlowConnection,
    connectionInfo,
    retryConnection,
    isRetrying,
  };
}

// Hook for components that need to react to network changes
export function useNetworkAwareActions() {
  const { isOnline, isSlowConnection, retryConnection } = useNetworkStatus();

  const executeWithNetworkCheck = useCallback(async <T>(
    action: () => Promise<T>,
    options?: {
      retryOnFailure?: boolean;
      showOfflineMessage?: boolean;
    }
  ): Promise<T | null> => {
    const { retryOnFailure = true, showOfflineMessage = true } = options || {};

    if (!isOnline) {
      if (showOfflineMessage) {
        // Could show a toast here
        console.warn('Action attempted while offline');
      }
      return null;
    }

    try {
      return await action();
    } catch (error) {
      if (retryOnFailure && !isOnline) {
        const reconnected = await retryConnection();
        if (reconnected) {
          try {
            return await action();
          } catch (retryError) {
            throw retryError;
          }
        }
      }
      throw error;
    }
  }, [isOnline, retryConnection]);

  return {
    isOnline,
    isSlowConnection,
    executeWithNetworkCheck,
    retryConnection,
  };
}

// Hook for optimizing data usage on slow connections
export function useDataOptimization() {
  const { isSlowConnection, connectionInfo } = useNetworkStatus();

  const shouldOptimizeImages = isSlowConnection || 
    connectionInfo.effectiveType === '2g' || 
    connectionInfo.effectiveType === 'slow-2g';

  const shouldReduceAnimations = isSlowConnection;

  const shouldLimitAutoRefresh = isSlowConnection || 
    connectionInfo.downlink < 1;

  const getImageQuality = useCallback(() => {
    if (shouldOptimizeImages) {
      return 'low';
    }
    if (connectionInfo.effectiveType === '3g') {
      return 'medium';
    }
    return 'high';
  }, [shouldOptimizeImages, connectionInfo.effectiveType]);

  const getVideoQuality = useCallback(() => {
    if (isSlowConnection) {
      return '240p';
    }
    if (connectionInfo.effectiveType === '3g') {
      return '480p';
    }
    if (connectionInfo.effectiveType === '4g') {
      return '720p';
    }
    return '1080p';
  }, [isSlowConnection, connectionInfo.effectiveType]);

  return {
    shouldOptimizeImages,
    shouldReduceAnimations,
    shouldLimitAutoRefresh,
    getImageQuality,
    getVideoQuality,
    isSlowConnection,
    connectionInfo,
  };
}