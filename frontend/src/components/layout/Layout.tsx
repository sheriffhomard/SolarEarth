import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { OnboardingModal } from '../common/OnboardingModal';
import { fetchHealth } from '../../services/api';
import { UpdateService } from '../../services/updateService';
import { Sparkles, RefreshCw, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<string>('ok');
  const [backgroundUpdateNotice, setBackgroundUpdateNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((data) => setServiceStatus(data.status))
      .catch(() => setServiceStatus('degraded'));

    // Start background auto-update watcher
    const cleanupWatcher = UpdateService.startBackgroundUpdateWatcher((newVersion) => {
      setBackgroundUpdateNotice(`Nouvelle version (${newVersion}) installée automatiquement en arrière-plan.`);
    });

    return () => {
      cleanupWatcher();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        serviceStatus={serviceStatus}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Auto-update background notification toast */}
      {backgroundUpdateNotice && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-3 shadow-md z-30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{backgroundUpdateNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-0.5 rounded bg-slate-950 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Actualiser
            </button>
            <button
              onClick={() => setBackgroundUpdateNotice(null)}
              className="p-1 hover:bg-amber-600 rounded transition-colors"
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Contextual Onboarding & Legal Disclaimer modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        forceShow={isOnboardingOpen}
      />
    </div>
  );
};
