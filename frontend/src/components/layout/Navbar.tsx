import React from 'react';
import { Sun, Menu, X } from 'lucide-react';
import { PWAInstallPrompt } from '../common/PWAInstallPrompt';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  serviceStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  serviceStatus,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-sm shadow-amber-500/20">
            <Sun className="w-5 h-5 animate-[spin_60s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-100 text-base">SOLAR EARTH</span>
              <span className="font-mono text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                V0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Mesure & visualisation du rayonnement solaire sur Terre
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                serviceStatus === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{serviceStatus === 'ok' ? 'Mode Téléphone Autonome' : 'Initialisation'}</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="text-slate-400">IndexedDB & SQLite Local</span>
          </div>

          <PWAInstallPrompt />

          {/* Mobile menu toggle */}
          <button
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
