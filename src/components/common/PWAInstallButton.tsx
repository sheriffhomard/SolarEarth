import React, { useState, useEffect } from 'react';
import { Download, Check, Smartphone, Monitor, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PWAInstallButtonProps {
  variant?: 'button' | 'compact' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const isStandalone =
      (typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' &&
        (window.navigator as any).standalone === true);

    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isAppleDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Chromium / Android / Desktop Chrome & Edge
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // iOS Safari guide
      setShowIOSGuide(true);
    } else {
      // Generic desktop guide
      setShowDesktopGuide(true);
    }
  };

  if (isInstalled) {
    if (variant === 'compact') {
      return (
        <span
          title="Application installée et active en mode autonome"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 ${className}`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          PWA Installée
        </span>
      );
    }

    if (variant === 'card') {
      return (
        <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Application Installée sur votre Appareil
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Solar Earth s'exécute en mode PWA autonome avec stockage IndexedDB local.
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
            STANDALONE
          </span>
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
        <Check className="w-3.5 h-3.5" />
        PWA Active
      </span>
    );
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          title="Installer Solar Earth sur votre écran d'accueil (Mobile ou Ordinateur)"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700/60 rounded-lg shadow-xs transition-colors ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Installer l'application</span>
          <span className="sm:hidden">Installer</span>
        </button>
      ) : variant === 'card' ? (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Installer Solar Earth sur votre écran d'accueil
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                  PWA Mobile & Desktop
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Ajoutez l'icône de Solar Earth directement sur l'écran de votre smartphone, tablette ou bureau pour y accéder en un clic et travailler 100% hors-ligne.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Installer l'application
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 shadow-sm shadow-amber-500/20 transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer l'application</span>
        </button>
      )}

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Smartphone className="w-4 h-4 text-amber-500" />
                Installer sur iPhone ou iPad
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  Dans Safari, appuyez sur l'icône de <strong>Partage</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 text-sky-500 mx-0.5" /> (en bas ou en haut de l'écran).
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 text-emerald-500 mx-0.5" />.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                  3
                </div>
                <div>
                  Touchez <strong>« Ajouter »</strong> en haut à droite. L'icône Solar Earth apparaîtra sur votre écran d'accueil.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors"
            >
              C'est compris
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Manual Guide Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Monitor className="w-4 h-4 text-amber-500" />
                Installer sur Ordinateur
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Pour installer Solar Earth comme application de bureau native :
              </p>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  Sur Google Chrome ou Microsoft Edge :
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Cliquez sur l'icône d'installation dans la barre d'adresse (à droite de l'URL).</li>
                  <li>Ou ouvrez le menu <strong>⋮</strong> &gt; <strong>« Installer Solar Earth... »</strong>.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};
