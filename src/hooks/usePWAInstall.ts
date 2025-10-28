'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  showInstallPrompt: () => Promise<boolean>;
  dismissInstallPrompt: () => void;
  isInstallPromptShown: boolean;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallPromptShown, setIsInstallPromptShown] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Check if app can be installed
  const canInstall = isInstallable && !isInstalled && !isStandalone;

  useEffect(() => {
    // Detect iOS
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(detectIOS);

    // Detect if app is running in standalone mode
    const detectStandalone = (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    );
    setIsStandalone(detectStandalone);

    // Check if already installed
    setIsInstalled(detectStandalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      console.log('PWA install prompt available');
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if service worker is ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker is ready for PWA install');
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    try {
      setIsInstallPromptShown(true);
      await deferredPrompt.prompt();
      
      const choiceResult = await deferredPrompt.userChoice;
      console.log('User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
      setIsInstallPromptShown(false);
      
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error showing install prompt:', error);
      setIsInstallPromptShown(false);
      return false;
    }
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback(() => {
    setDeferredPrompt(null);
    setIsInstallable(false);
    console.log('Install prompt dismissed');
  }, []);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    canInstall,
    showInstallPrompt,
    dismissInstallPrompt,
    isInstallPromptShown,
  };
}

export default usePWAInstall;