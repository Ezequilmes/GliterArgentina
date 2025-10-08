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
  const testConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }, []);

  // Retry connection
  const retryConnection = useCallback(async (): Promise<boolean> => {
    if (isRetrying) return false;

    setIsRetrying(true);
    
    try {
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
        return true;
      }
      
      return false;
    } catch (error) {
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

    // Periodic connectivity check
    const intervalId = setInterval(async () => {
      if (navigator.onLine) {
        const isConnected = await testConnectivity();
        if (!isConnected && isOnline) {
          setIsOnline(false);
          addToastRef.current({
            type: 'error',
            title: 'Conexión perdida',
            message: 'Se ha perdido la conexión a internet',
            persistent: true
          });
        } else if (isConnected && !isOnline) {
          setIsOnline(true);
          addToastRef.current({
            type: 'success',
            title: 'Conexión restablecida',
            message: 'La conexión a internet se ha restablecido'
          });
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(intervalId);
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