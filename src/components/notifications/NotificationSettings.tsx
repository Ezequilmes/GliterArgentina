'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';

interface NotificationSettingsProps {
  className?: string;
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  onClose,
}) => {
  const {
    settings,
    toggleSound,
    toggleVisual,
    toggleToast,
    toggleBubble,
    toggleMicroAnimations,
    setVolume,
    resetToDefaults,
  } = useNotificationSettings();

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const testNotification = () => {
    if (typeof window !== 'undefined' && (window as any).gliterNotifications) {
      (window as any).gliterNotifications.showNotification(
        'Esta es una notificación de prueba',
        'Sistema',
        'general'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Configuración de Notificaciones
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Configuraciones principales */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
            Configuraciones Generales
          </h4>
          
          {/* Sonido */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sonido
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reproducir sonidos de notificación
              </p>
            </div>
            <button
              onClick={toggleSound}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Volumen */}
          {settings.soundEnabled && (
            <div className="ml-4">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Volumen: {Math.round(settings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>
          )}

          {/* Notificaciones visuales */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notificaciones Visuales
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrar efectos visuales y animaciones
              </p>
            </div>
            <button
              onClick={toggleVisual}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.visualEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.visualEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Configuraciones específicas de visuales */}
        {settings.visualEnabled && (
          <div className="space-y-4 ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Tipos de Notificaciones Visuales
            </h4>

            {/* Toast notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Toast Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notificaciones emergentes cuando el chat no está activo
                </p>
              </div>
              <button
                onClick={toggleToast}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.toastEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.toastEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Bubble notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Burbujas Animadas
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Burbujas con efectos de entrada y salida
                </p>
              </div>
              <button
                onClick={toggleBubble}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.bubbleEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.bubbleEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Micro animations */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Micro Animaciones
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Efectos sutiles cuando el chat está abierto
                </p>
              </div>
              <button
                onClick={toggleMicroAnimations}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.microAnimationsEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    settings.microAnimationsEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={testNotification}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Probar Notificación
          </button>
          <button
            onClick={resetToDefaults}
            className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
          >
            Restablecer
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationSettings;