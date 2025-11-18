import { useCallback, useRef, useEffect, useState } from 'react';
import { createNotificationAudio, playAudioSafely } from '@/utils/audio';
import { toast } from 'react-hot-toast';

interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  volume: number;
}

interface UseNotificationEffectsProps {
  isChatActive?: boolean;
  settings?: NotificationSettings;
}

interface NotificationEffects {
  showVisualNotification: (message: string, sender?: string) => void;
  playNotificationSound: () => void;
  showToastNotification: (message: string, sender?: string) => void;
  triggerMicroAnimation: () => void;
  isAnimating: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  visualEnabled: true,
  volume: 0.5,
};

export const useNotificationEffects = ({
  isChatActive = false,
  settings = DEFAULT_SETTINGS,
}: UseNotificationEffectsProps = {}): NotificationEffects => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayTimeRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Debounce time para evitar múltiples sonidos
  const SOUND_DEBOUNCE_MS = 1000;

  // Inicializar audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = createNotificationAudio([
        '/sounds/tono-mensaje-.mp3',
        '/sounds/receive_chat.mp3',
        '/sounds/newMessage.mp3',
        '/sounds/refresh.mp3'
      ], settings.volume);
      
      // Manejar errores de carga
      audioRef.current.addEventListener('error', (e) => {
        console.warn('Error loading notification sound:', e);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', () => {});
        if (!audioRef.current.paused) {
          const el = audioRef.current;
          const onEnded = () => {
            el.removeEventListener('ended', onEnded);
            audioRef.current = null;
          };
          el.addEventListener('ended', onEnded);
        } else {
          audioRef.current = null;
        }
      }
    };
  }, [settings.volume]);

  // Actualizar volumen cuando cambie la configuración
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
    }
  }, [settings.volume]);

  const playNotificationSound = useCallback(() => {
    if (!settings.soundEnabled || !audioRef.current) return;

    const now = Date.now();
    if (now - lastPlayTimeRef.current < SOUND_DEBOUNCE_MS) {
      return; // Evitar spam de sonidos
    }

    lastPlayTimeRef.current = now;

    // Resetear el audio al inicio para permitir múltiples reproducciones
    audioRef.current.currentTime = 0;
    
    playAudioSafely(audioRef.current);
  }, [settings.soundEnabled]);

  const showToastNotification = useCallback((message: string, sender?: string) => {
    if (!settings.visualEnabled) return;

    const displayMessage = sender ? `${sender}: ${message}` : message;
    
    toast(displayMessage, {
      icon: '💬',
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#1f2937',
        color: '#f9fafb',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        maxWidth: '300px',
      },
      className: 'notification-toast',
    });
  }, [settings.visualEnabled]);

  const triggerMicroAnimation = useCallback(() => {
    if (!settings.visualEnabled) return;

    setIsAnimating(true);
    
    // Resetear la animación después de un tiempo
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  }, [settings.visualEnabled]);

  const showVisualNotification = useCallback((message: string, sender?: string) => {
    if (!settings.visualEnabled) return;

    if (isChatActive) {
      // Si el chat está activo, mostrar micro-animación
      triggerMicroAnimation();
    } else {
      // Si el chat no está activo, mostrar toast
      showToastNotification(message, sender);
    }
  }, [isChatActive, settings.visualEnabled, triggerMicroAnimation, showToastNotification]);

  return {
    showVisualNotification,
    playNotificationSound,
    showToastNotification,
    triggerMicroAnimation,
    isAnimating,
  };
};

export default useNotificationEffects;
