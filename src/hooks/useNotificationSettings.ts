import { useState, useEffect, useCallback } from 'react';

export interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  volume: number;
  toastEnabled: boolean;
  bubbleEnabled: boolean;
  microAnimationsEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  visualEnabled: true,
  volume: 0.5,
  toastEnabled: true,
  bubbleEnabled: true,
  microAnimationsEnabled: true,
};

const STORAGE_KEY = 'gliter_notification_settings';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar configuraciones desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
        }
      } catch (error) {
        console.warn('Error loading notification settings:', error);
      } finally {
        setIsLoaded(true);
      }
    }
  }, []);

  // Guardar configuraciones en localStorage
  const saveSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
      } catch (error) {
        console.warn('Error saving notification settings:', error);
      }
    }
  }, [settings]);

  // Funciones específicas para actualizar configuraciones individuales
  const toggleSound = useCallback(() => {
    saveSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, saveSettings]);

  const toggleVisual = useCallback(() => {
    saveSettings({ visualEnabled: !settings.visualEnabled });
  }, [settings.visualEnabled, saveSettings]);

  const toggleToast = useCallback(() => {
    saveSettings({ toastEnabled: !settings.toastEnabled });
  }, [settings.toastEnabled, saveSettings]);

  const toggleBubble = useCallback(() => {
    saveSettings({ bubbleEnabled: !settings.bubbleEnabled });
  }, [settings.bubbleEnabled, saveSettings]);

  const toggleMicroAnimations = useCallback(() => {
    saveSettings({ microAnimationsEnabled: !settings.microAnimationsEnabled });
  }, [settings.microAnimationsEnabled, saveSettings]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    saveSettings({ volume: clampedVolume });
  }, [saveSettings]);

  // Resetear a configuraciones por defecto
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('Error resetting notification settings:', error);
      }
    }
  }, []);

  // Configuraciones derivadas para compatibilidad con el hook de efectos
  const effectsSettings = {
    soundEnabled: settings.soundEnabled,
    visualEnabled: settings.visualEnabled && (settings.toastEnabled || settings.bubbleEnabled || settings.microAnimationsEnabled),
    volume: settings.volume,
  };

  return {
    settings,
    effectsSettings,
    isLoaded,
    saveSettings,
    toggleSound,
    toggleVisual,
    toggleToast,
    toggleBubble,
    toggleMicroAnimations,
    setVolume,
    resetToDefaults,
  };
};

export default useNotificationSettings;