'use client';

import { MaterialIcon } from '@/components/icons/MaterialIcon';
import { useEffect, useState } from 'react';
import { Button } from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if app is already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running on iOS
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = (window.navigator as any).standalone === true;

      if (isIOS && isStandalone) {
        setIsInstalled(true);
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check if already installed
      const checkInstalled = () => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
          setIsInstalled(true);
          setIsVisible(false);
        }
      };

      checkInstalled();

      // Listen for app installed event
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setIsVisible(false);
        setDeferredPrompt(null);
      });
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // For iOS, show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert(
          'لتثبيت التطبيق على iOS:\n' +
          '1. اضغط على زر المشاركة في Safari\n' +
          '2. اختر "إضافة إلى الشاشة الرئيسية"\n' +
          '3. اضغط "إضافة"'
        );
      }
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsVisible(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  // Don't render if not mounted, already installed or not visible
  if (!mounted || isInstalled || !isVisible) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      variant="primary"
      size="sm"
      className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
      aria-label="تثبيت التطبيق"
    >
      <MaterialIcon name="get_app" className="text-white" size="sm" />
      <span className="hidden sm:inline">تثبيت التطبيق</span>
      <span className="sm:hidden">تثبيت</span>
    </Button>
  );
}

