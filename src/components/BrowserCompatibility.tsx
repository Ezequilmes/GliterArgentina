'use client';

import { useEffect, useState } from 'react';
import { detectBrowser, logBrowserInfo, type BrowserInfo } from '@/utils/browserDetection';
import { AlertTriangle, Info, ExternalLink } from 'lucide-react';

interface BrowserCompatibilityProps {
  showDetails?: boolean;
  className?: string;
}

export function BrowserCompatibility({ showDetails = false, className = '' }: BrowserCompatibilityProps) {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const info = detectBrowser();
    setBrowserInfo(info);
    logBrowserInfo();

    // Show warning for WebView/Trae app with limited features
    if (info.isWebView || info.isTraeApp) {
      setShowWarning(true);
    }
  }, []);

  if (!browserInfo) return null;

  const limitedFeatures = [];
  if (!browserInfo.supportsServiceWorker) limitedFeatures.push('Modo offline');
  if (!browserInfo.supportsNotifications) limitedFeatures.push('Notificaciones push');
  if (!browserInfo.supportsGeolocation) limitedFeatures.push('Ubicación');

  if (!showWarning && !showDetails) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Warning for Trae App */}
      {showWarning && browserInfo.isTraeApp && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                Navegador integrado detectado
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Estás usando la aplicación desde el navegador integrado de Trae. 
                Algunas funciones pueden estar limitadas.
              </p>
              {limitedFeatures.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-600">
                    Funciones limitadas: {limitedFeatures.join(', ')}
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowWarning(false)}
                className="text-xs text-amber-600 hover:text-amber-800 mt-2 underline"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General WebView warning */}
      {showWarning && browserInfo.isWebView && !browserInfo.isTraeApp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Navegador integrado
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Para una mejor experiencia, te recomendamos abrir Gliter en tu navegador principal.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Gliter Argentina',
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Abrir en navegador
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Continuar aquí
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed browser info (for debugging) */}
      {showDetails && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">
            Información del navegador
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Navegador: {browserInfo.browserName}</div>
            <div>WebView: {browserInfo.isWebView ? 'Sí' : 'No'}</div>
            <div>Trae App: {browserInfo.isTraeApp ? 'Sí' : 'No'}</div>
            <div>Móvil: {browserInfo.isMobile ? 'Sí' : 'No'}</div>
            <div>Service Worker: {browserInfo.supportsServiceWorker ? '✅' : '❌'}</div>
            <div>Notificaciones: {browserInfo.supportsNotifications ? '✅' : '❌'}</div>
            <div>Geolocalización: {browserInfo.supportsGeolocation ? '✅' : '❌'}</div>
            <div>Local Storage: {browserInfo.supportsLocalStorage ? '✅' : '❌'}</div>
            <div>IndexedDB: {browserInfo.supportsIndexedDB ? '✅' : '❌'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowserCompatibility;