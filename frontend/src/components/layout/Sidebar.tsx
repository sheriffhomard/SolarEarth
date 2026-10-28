import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe2,
  Zap,
  Compass,
  History,
  ShieldCheck,
  Activity,
  Settings,
  Database,
  Radio,
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { APP_VERSION } from '../../services/updateService';

export const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'World Map', path: '/map', icon: Globe2 },
  { name: 'Simulateur PV', path: '/pv', icon: Zap },
  { name: 'Trajectoire Solaire', path: '/trajectory', icon: Compass },
  { name: 'History', path: '/history', icon: History },
  { name: 'Laboratoire & Audit', path: '/lab', icon: ShieldCheck },
  { name: 'Solar Activity', path: '/activity', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-4 shrink-0 transition-colors">
      {/* Navigation Links */}
      <nav aria-label="Navigation principale" className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border-l-2 border-amber-500 rounded-l-none'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* System Technical Foundation block */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Architecture Mobile PWA
        </div>
        <div className="space-y-2 text-xs font-mono text-slate-600 dark:text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Database className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              Stockage
            </span>
            <span className="text-slate-700 dark:text-slate-300">IndexedDB local</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Moteur Solaire
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Autonome</span>
          </div>
        </div>

        {/* In-app install button */}
        <div className="pt-1">
          <PWAInstallButton variant="compact" className="w-full justify-center" />
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Version v{APP_VERSION}</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>Offline Ready</span>
        </div>
      </div>
    </aside>
  );
};
