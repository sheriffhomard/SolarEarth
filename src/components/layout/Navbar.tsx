import React from 'react';
import { Sun, Moon, Menu, X, HelpCircle, Sparkles } from 'lucide-react';
import { SolarLogo } from '../common/SolarLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  serviceStatus: string;
  onOpenOnboarding?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  serviceStatus,
  onOpenOnboarding,
}) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <SolarLogo size="md" showText={true} version="V0.3" />
        </div>

        {/* Status, Theme Switcher, Install & Actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Status info */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                serviceStatus === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>PWA : IndexedDB Local</span>
            <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
            <span>Station Dev : SQLite</span>
          </div>

          {/* Onboarding & Legal Disclaimer trigger button */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              title="Afficher l'accueil, guide et mentions légales"
              className="p-2 rounded-lg text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
              aria-label="Guide et mentions légales"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* Theme Switcher Toggle (Clair / Sombre) */}
          <button
            onClick={toggleTheme}
            title={resolvedTheme === 'dark' ? 'Passer au thème Clair' : 'Passer au thème Sombre'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 transition-colors"
            aria-label="Basculer le thème clair ou sombre"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Mobile menu toggle */}
          <button
            onClick={onToggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
