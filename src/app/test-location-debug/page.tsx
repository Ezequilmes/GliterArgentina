'use client';

import React, { useEffect } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui';

export default function TestLocationDebugPage() {
  const { 
    location, 
    loading, 
    error, 
    permissionState,
    retryCount,
    getCurrentLocation,
    checkPermissions
  } = useGeolocation({ 
    enableHighAccuracy: true, 
    timeout: 10000, 
    maximumAge: 300000 
  });

  useEffect(() => {
    console.log('🧪 TestLocationDebugPage mounted');
    console.log('🧪 Initial state:', { location, loading, error, permissionState, retryCount });
  }, []);

  useEffect(() => {
    console.log('🧪 State changed:', { location, loading, error, permissionState, retryCount });
  }, [location, loading, error, permissionState, retryCount]);

  const handleTestLocation = async () => {
    console.log('🧪 Manual location test started');
    try {
      const result = await getCurrentLocation();
      console.log('🧪 Manual location test success:', result);
    } catch (err) {
      console.error('🧪 Manual location test error:', err);
    }
  };

  const handleCheckPermissions = async () => {
    console.log('🧪 Manual permission check started');
    try {
      const result = await checkPermissions();
      console.log('🧪 Manual permission check result:', result);
    } catch (err) {
      console.error('🧪 Manual permission check error:', err);
    }
  };

  const handleTestNavigatorGeolocation = () => {
    console.log('🧪 Testing navigator.geolocation directly');
    
    if (typeof window === 'undefined') {
      console.error('🧪 Running on server side, navigator not available');
      return;
    }
    
    if (!navigator.geolocation) {
      console.error('🧪 navigator.geolocation not available');
      return;
    }

    console.log('🧪 navigator.geolocation is available');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('🧪 Direct geolocation success:', position);
      },
      (error) => {
        console.error('🧪 Direct geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Diagnóstico de Geolocalización</h1>
        
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Estado del Hook</h2>
            <div className="space-y-2 text-sm">
              <div>Location: {location ? `${location.latitude}, ${location.longitude}` : 'null'}</div>
              <div>Loading: {loading ? 'true' : 'false'}</div>
              <div>Error: {error || 'null'}</div>
              <div>Permission State: {permissionState || 'null'}</div>
              <div>Retry Count: {retryCount}</div>
            </div>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Navegador</h2>
            <div className="space-y-2 text-sm">
              <div>navigator.geolocation: {typeof window !== 'undefined' && navigator.geolocation ? 'disponible' : 'no disponible'}</div>
              <div>navigator.permissions: {typeof window !== 'undefined' && navigator.permissions ? 'disponible' : 'no disponible'}</div>
              <div>HTTPS: {typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'sí' : 'no'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleCheckPermissions} className="w-full">
              Verificar Permisos
            </Button>
            
            <Button onClick={handleTestLocation} className="w-full" disabled={loading}>
              {loading ? 'Obteniendo...' : 'Obtener Ubicación (Hook)'}
            </Button>
            
            <Button onClick={handleTestNavigatorGeolocation} className="w-full">
              Probar navigator.geolocation Directamente
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-destructive">Error:</h3>
              <p className="text-sm text-destructive-foreground">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}