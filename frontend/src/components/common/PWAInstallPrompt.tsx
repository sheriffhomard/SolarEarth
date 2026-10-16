import React, { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
        <Check className="w-3.5 h-3.5" />
        PWA Active
      </span>
    );
  }

  if (!deferredPrompt) {
    return (
      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
        PWA Ready (Standalone)
      </span>
    );
  }

  return (
    <button
      onClick={handleInstall}
      aria-label="Installer l'application Solar Earth sur votre appareil"
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
    >
      <Download className="w-3.5 h-3.5" />
      Installer l'App
    </button>
  );
};
