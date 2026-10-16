import React from 'react';
import { History, Calendar, LineChart, Database } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
          <span>DONNÉES HISTORIQUES & CLIMATOLOGIE</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>SÉRIES HORAIRES ET MULTI-ANNUELLES</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">History — Données Historiques</h1>
        <p className="text-xs text-slate-400 mt-1">
          Comparaison temporelle, réanalyses atmosphériques et années météorologiques types (TMY).
        </p>
      </div>

      <div className="relative border border-slate-800 rounded-2xl bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <History className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">
          History — Coming soon
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          Le module d'analyse historique sera activé lors des versions <strong>V0.2 (PVGIS)</strong> et{' '}
          <strong>V0.3 (NASA POWER)</strong>. Il permettra de comparer les profils réels passés avec
          les normales saisonnières sans inventer de données.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full text-left font-mono text-xs text-slate-400">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Séries TMY
            </div>
            <p className="text-[11px] text-slate-400">Typical Meteorological Years JRC</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <LineChart className="w-3.5 h-3.5 text-sky-400" />
              Graphiques Horaires
            </div>
            <p className="text-[11px] text-slate-400">GHI, DNI et DHI sur 24h</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Multi-Fournisseurs
            </div>
            <p className="text-[11px] text-slate-400">Croisement PVGIS / NASA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
