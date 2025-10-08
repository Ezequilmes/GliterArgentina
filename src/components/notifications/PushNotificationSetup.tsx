'use client';

import { useState } from 'react';
import { Bell, BellOff, Settings, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationSetupProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

export default function PushNotificationSetup({ 
  onClose, 
  showAsModal = false 
}: PushNotificationSetupProps) {
  const {
    isSupported,
    permission,
    isEnabled,
    canRequestPermission,
    isLoading,
    error,
    requestPermissionAndToken,
    disableNotifications
  } = usePushNotifications();

  const [dismissed, setDismissed] = useState(false);

  if (!isSupported || dismissed) {
    return null;
  }

  const handleEnableNotifications = async () => {
    const success = await requestPermissionAndToken();
    if (success && onClose) {
      onClose();
    }
  };

  const handleDisableNotifications = async () => {
    await disableNotifications();
    if (onClose) {
      onClose();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onClose) {
      onClose();
    }
  };

  const getStatusMessage = () => {
    if (isEnabled) {
      return {
        icon: <Bell className="w-5 h-5 text-green-500" />,
        title: 'Notificaciones activadas',
        message: 'Recibirás notificaciones sobre nuevos matches, mensajes y más.',
        action: 'Deshabilitar'
      };
    }

    if (permission === 'denied') {
      return {
        icon: <BellOff className="w-5 h-5 text-red-500" />,
        title: 'Notificaciones bloqueadas',
        message: 'Para recibir notificaciones, habilítalas en la configuración de tu navegador.',
        action: 'Configurar'
      };
    }

    return {
      icon: <Bell className="w-5 h-5 text-blue-500" />,
      title: 'Activa las notificaciones',
      message: 'No te pierdas nuevos matches, mensajes y actividad importante.',
      action: 'Activar'
    };
  };

  const status = getStatusMessage();

  const content = (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {status.icon}
          <h3 className="text-lg font-semibold text-gray-900">
            {status.title}
          </h3>
        </div>
        {showAsModal && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message */}
      <p className="text-gray-600 mb-6">
        {status.message}
      </p>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        {isEnabled ? (
          <button
            onClick={handleDisableNotifications}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Procesando...' : 'Deshabilitar'}
          </button>
        ) : permission === 'denied' ? (
          <button
            onClick={() => {
              // Abrir configuración del navegador
              alert('Ve a la configuración de tu navegador y habilita las notificaciones para este sitio.');
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configurar</span>
          </button>
        ) : canRequestPermission ? (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Configurando...' : 'Activar notificaciones'}
          </button>
        ) : null}

        {!showAsModal && (
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Ahora no
          </button>
        )}
      </div>

      {/* Info */}
      {canRequestPermission && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-700 text-sm">
            💡 Las notificaciones te ayudan a no perderte conexiones importantes y nuevos mensajes.
          </p>
        </div>
      )}
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        {content}
      </div>
    );
  }

  return content;
}