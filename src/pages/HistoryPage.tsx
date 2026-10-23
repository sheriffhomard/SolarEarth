import React from 'react';
import { ClimateAnalysisView } from '../components/solar/ClimateAnalysisView';

export const HistoryPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
          <span>DONNÉES HISTORIQUES & SÉRIES MULTI-ANNUELLES</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>NORMALES CLIMATIQUES DE RÉFÉRENCE</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Analyse Historique & Climatologie</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Distribution mensuelle du rayonnement sur 20 ans, ratios de saisonnalité été/hiver,
          variabilité interannuelle ($\sigma$) et classement mondial du potentiel énergétique.
        </p>
      </div>

      <ClimateAnalysisView />
    </div>
  );
};
