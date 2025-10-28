'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isStandalone, 
    canInstall, 
    isInstallPromptShown,
    showInstallPrompt 
  } = usePWAInstall();
  
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Mostrar el prompt después de 3 segundos si la app es instalable
    if (canInstall && !isInstallPromptShown) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [canInstall, isInstallPromptShown]);

  // No mostrar nada si ya está instalada o en modo standalone
  if (isInstalled || isStandalone || !showPrompt) {
    return null;
  }

  const handleInstall = async () => {
    const result = await showInstallPrompt();
    if (result) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-lg shadow-lg animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">¡Instala Gliter Argentina!</h3>
          <p className="text-xs opacity-90 mt-1">
            {isIOS 
              ? 'Toca el botón de compartir y selecciona "Añadir a pantalla de inicio"'
              : 'Accede más rápido desde tu pantalla de inicio'
            }
          </p>
        </div>
        
        <div className="flex gap-2 ml-4">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="bg-white text-pink-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
            >
              Instalar
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      </div>
      
      {isIOS && (
        <div className="mt-2 text-xs opacity-90">
          <div className="flex items-center gap-1">
            <span>1. Toca</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            <span>2. Selecciona "Añadir a pantalla de inicio"</span>
          </div>
        </div>
      )}
    </div>
  );
}