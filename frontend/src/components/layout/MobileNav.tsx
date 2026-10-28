import React from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from './Sidebar';
import { APP_VERSION } from '../../services/updateService';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop and Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation mobile"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-6 font-bold">
                Navigation Solar Earth
              </div>
              <nav aria-label="Menu mobile" className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <PWAInstallButton variant="compact" className="w-full justify-center" />
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Solar Earth · v{APP_VERSION}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Barre d'onglets mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-1 py-1 flex items-center justify-around shadow-lg"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[9px] font-medium transition-colors ${
                  isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[55px] text-center">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
