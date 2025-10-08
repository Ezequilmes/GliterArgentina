import { useCallback, useRef } from 'react';

export type SoundType = 'send_chat' | 'receive_chat' | 'refresh' | 'voip_call';

interface SoundConfig {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
}

export function useSounds() {
  const audioRefs = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

  const initializeSound = useCallback((soundType: SoundType, config: SoundConfig = {}) => {
    if (!audioRefs.current.has(soundType)) {
      const audio = new Audio(`/sounds/${soundType}.mp3`);
      audio.volume = config.volume ?? 0.5;
      audio.loop = config.loop ?? false;
      if (config.preload) {
        audio.preload = 'auto';
      }
      audioRefs.current.set(soundType, audio);
    }
    return audioRefs.current.get(soundType)!;
  }, []);

  const playSound = useCallback(async (soundType: SoundType, config: SoundConfig = {}) => {
    try {
      const audio = initializeSound(soundType, config);
      
      // Reset audio to beginning if it's already playing
      audio.currentTime = 0;
      
      // Apply config if provided
      if (config.volume !== undefined) {
        audio.volume = config.volume;
      }
      if (config.loop !== undefined) {
        audio.loop = config.loop;
      }

      await audio.play();
    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
    }
  }, [initializeSound]);

  const stopSound = useCallback((soundType: SoundType) => {
    const audio = audioRefs.current.get(soundType);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  const stopAllSounds = useCallback(() => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }, []);

  const preloadSounds = useCallback(() => {
    const soundTypes: SoundType[] = ['send_chat', 'receive_chat', 'refresh', 'voip_call'];
    soundTypes.forEach(soundType => {
      initializeSound(soundType, { preload: true });
    });
  }, [initializeSound]);

  // Convenience methods for specific sounds
  const playSendChatSound = useCallback(() => playSound('send_chat', { volume: 0.6 }), [playSound]);
  const playReceiveChatSound = useCallback(() => playSound('receive_chat', { volume: 0.7 }), [playSound]);
  const playRefreshSound = useCallback(() => playSound('refresh', { volume: 0.4 }), [playSound]);
  const playVoipCallSound = useCallback((loop = true) => playSound('voip_call', { volume: 0.8, loop }), [playSound]);

  return {
    playSound,
    stopSound,
    stopAllSounds,
    preloadSounds,
    // Convenience methods
    playSendChatSound,
    playReceiveChatSound,
    playRefreshSound,
    playVoipCallSound,
  };
}