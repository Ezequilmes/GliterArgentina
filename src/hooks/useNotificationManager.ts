import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { toast } from '../utils/toast';

interface NotificationSettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
  volume: number;
  toastEnabled: boolean;
  bubbleEnabled: boolean;
  microAnimationsEnabled: boolean;
}

interface UseNotificationManagerProps {
  isChatActive?: boolean;
  settings?: Partial<NotificationSettings>;
}

interface NotificationManagerHook {
  playSound: () => void;
  showToast: (message: string, sender?: string) => void;
  cleanup: () => void;
  triggerMicroAnimation: () => void;
  isAnimating: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  visualEnabled: true,
  volume: 0.5,
  toastEnabled: true,
  bubbleEnabled: true,
  microAnimationsEnabled: true,
};

export const useNotificationManager = ({
  isChatActive = false,
  settings = {},
}: UseNotificationManagerProps = {}): NotificationManagerHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayTimeRef = useRef<number>(0);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Debounce time para evitar múltiples sonidos
  const SOUND_DEBOUNCE_MS = 1000;

  // Memoizar configuraciones combinadas
  const finalSettings = useMemo(() => ({
    ...DEFAULT_SETTINGS,
    ...settings,
  }), [settings]);

  // Inicializar audio una sola vez
  useEffect(() => {
    if (typeof window === 'undefined' || !finalSettings.soundEnabled) return;

    const audio = new Audio('/sounds/messenger-tono-mensaje-.mp3');
    audio.volume = finalSettings.volume;
    audio.preload = 'auto';
    
    const handleError = (e: Event) => {
      console.warn('Error loading notification sound:', e);
    };
    
    audio.addEventListener('error', handleError);
    audioRef.current = audio;

    // Función de limpieza
    const cleanup = () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };

    cleanupFunctionsRef.current.push(cleanup);

    return cleanup;
  }, [finalSettings.soundEnabled, finalSettings.volume]);

  // Función optimizada para reproducir sonido
  const playSound = useCallback(() => {
    if (!finalSettings.soundEnabled || !audioRef.current) return;

    const now = Date.now();
    if (now - lastPlayTimeRef.current < SOUND_DEBOUNCE_MS) {
      return; // Evitar spam de sonidos
    }

    lastPlayTimeRef.current = now;

    // Usar requestAnimationFrame para mejor rendimiento
    requestAnimationFrame(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.warn('Error playing notification sound:', error);
        });
      }
    });
  }, [finalSettings.soundEnabled]);

  // Función optimizada para mostrar toast
  const showToast = useCallback((message: string, sender?: string) => {
    if (!finalSettings.visualEnabled || !finalSettings.toastEnabled) return;

    const displayMessage = sender ? `${sender}: ${message}` : message;
    
    // Usar requestIdleCallback si está disponible para mejor rendimiento
    const showToastFn = () => {
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
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(showToastFn);
    } else {
      setTimeout(showToastFn, 0);
    }
  }, [finalSettings.visualEnabled, finalSettings.toastEnabled]);

  // Función para activar micro animaciones
  const triggerMicroAnimation = useCallback(() => {
    if (!finalSettings.microAnimationsEnabled || isAnimating) return;

    setIsAnimating(true);
    
    // Usar requestAnimationFrame para animaciones suaves
    requestAnimationFrame(() => {
      setTimeout(() => {
        setIsAnimating(false);
      }, 300); // Duración de la animación
    });
  }, [finalSettings.microAnimationsEnabled, isAnimating]);

  // Función de limpieza manual
  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => fn());
    cleanupFunctionsRef.current = [];
  }, []);

  // Limpieza automática al desmontar
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    playSound,
    showToast,
    cleanup,
    triggerMicroAnimation,
    isAnimating,
  };
};

export default useNotificationManager;