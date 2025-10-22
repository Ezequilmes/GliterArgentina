'use client';

import React, { useState } from 'react';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Switch from '../ui/Switch';
import Slider from '../ui/Slider';
import { Volume2, VolumeX, Bell, BellOff, Sparkles, Eye } from 'lucide-react';
import type { NotificationSettings } from '../../types/notifications';

interface NotificationSettingsPanelProps {
  effectsSettings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  effectsSettings,
  updateSettings,
}) => {
  // Valores por defecto para propiedades opcionales
  const settings = {
    toastEnabled: true,
    bubbleEnabled: true,
    microAnimationsEnabled: true,
    ...effectsSettings,
  };

  const testNotification = () => {
    if (window.notificationManager) {
      window.notificationManager.showTestNotification('Notificación de prueba');
    }
  };

  const resetSettings = () => {
    updateSettings({
      soundEnabled: true,
      visualEnabled: true,
      volume: 0.5,
      toastEnabled: true,
      bubbleEnabled: true,
      microAnimationsEnabled: true,
    });
  };

  const handleTestNotification = () => {
    testNotification();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Configuración de Notificaciones
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Personaliza cómo recibes las notificaciones en Gliter
        </p>
      </div>

      {/* Configuración de Sonido */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {settings.soundEnabled ? (
              <Volume2 className="h-5 w-5 text-blue-500" />
            ) : (
              <VolumeX className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Sonido</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reproducir sonidos de notificación
              </p>
            </div>
          </div>
          <Button
            variant={settings.soundEnabled ? "primary" : "outline"}
            size="sm"
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          >
            {settings.soundEnabled ? 'Activado' : 'Desactivado'}
          </Button>
        </div>

        {/* Control de Volumen */}
        {settings.soundEnabled && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Volumen: {Math.round(settings.volume * 100)}%
            </label>
            <Slider
              value={[settings.volume]}
              onValueChange={(value) => updateSettings({ volume: value[0] })}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Configuración de Notificaciones Visuales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {settings.visualEnabled ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Notificaciones Visuales</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrar notificaciones en pantalla
              </p>
            </div>
          </div>
          <Button
            variant={settings.visualEnabled ? "primary" : "outline"}
            size="sm"
            onClick={() => updateSettings({ visualEnabled: !settings.visualEnabled })}
          >
            {settings.visualEnabled ? 'Activado' : 'Desactivado'}
          </Button>
        </div>

        {/* Opciones de notificaciones visuales */}
        {settings.visualEnabled && (
          <div className="space-y-3 mt-4">
            {/* Toast Notifications */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Toast Notifications</span>
              <Button
                variant={settings.toastEnabled ? "primary" : "outline"}
                size="sm"
                onClick={() => updateSettings({ toastEnabled: !settings.toastEnabled })}
              >
                {settings.toastEnabled ? 'Sí' : 'No'}
              </Button>
            </div>

            {/* Burbujas Animadas */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Burbujas Animadas</span>
              <Button
                variant={settings.bubbleEnabled ? "primary" : "outline"}
                size="sm"
                onClick={() => updateSettings({ bubbleEnabled: !settings.bubbleEnabled })}
              >
                {settings.bubbleEnabled ? 'Sí' : 'No'}
              </Button>
            </div>

            {/* Micro-animaciones */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Micro-animaciones</span>
              <Button
                variant={settings.microAnimationsEnabled ? "primary" : "outline"}
                size="sm"
                onClick={() => updateSettings({ microAnimationsEnabled: !settings.microAnimationsEnabled })}
              >
                {settings.microAnimationsEnabled ? 'Sí' : 'No'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Botón de reset */}
      <div className="pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetSettings}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          Restablecer configuración
        </Button>
      </div>
    </div>
  );
}