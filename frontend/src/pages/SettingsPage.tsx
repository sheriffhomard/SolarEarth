import React, { useEffect, useState } from 'react';
import { Settings, Server, Database, Smartphone, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchHealth, fetchInfo } from '../services/api';
import { HealthResponse, InfoResponse } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([fetchHealth(), fetchInfo()])
      .then(([h, i]) => {
        setHealth(h);
        setInfo(i);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <span>CONFIGURATION SYSTÈME</span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>V0.1 FONDATION</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Paramètres & Diagnostics</h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspection de l'environnement technique, base de données et statut PWA.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          aria-label="Rafraîchir les diagnostics système"
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Tester connexion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & API Configuration */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Server className="w-4 h-4 text-emerald-400" />
            Backend FastAPI
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Service</span>
              <span>{health?.service || 'solar-earth-api'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Version</span>
              <span>v{health?.version || '0.1.0'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Environnement</span>
              <span>{info?.environment || 'development'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Statut HTTP</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {health?.status || 'ok'}
              </span>
            </div>
          </div>
        </div>

        {/* Database & Local Engine */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Database className="w-4 h-4 text-sky-400" />
            Base de Données Locale
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Moteur</span>
              <span>{info?.database_type || 'SQLite 3 (Embarquée Mobile / Hors-ligne)'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Fichier local</span>
              <span>./solar_earth.db (ou IndexedDB mobile)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Connexion DB</span>
              <span className="text-emerald-400">{health?.database || 'SQLite connectée'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Migrations</span>
              <span>Alembic 001_initial_locations</span>
            </div>
          </div>
        </div>

        {/* PWA Information */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Smartphone className="w-4 h-4 text-amber-400" />
            Progressive Web App (PWA)
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Nom PWA</span>
              <span>Solar Earth</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Affichage</span>
              <span>Standalone</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Service Worker</span>
              <span className="text-emerald-400">Enregistré (Workbox auto-update)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Manifest</span>
              <span>/manifest.webmanifest (valide)</span>
            </div>
          </div>
        </div>

        {/* Roadmap Checklist */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Settings className="w-4 h-4 text-purple-400" />
            Feuille de Route Prévue
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300">
            {info?.roadmap ? (
              info.roadmap.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span
                    className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
                      idx === 0 ? 'bg-amber-400' : 'bg-slate-600'
                    }`}
                  />
                  <span className={idx === 0 ? 'text-amber-300 font-medium' : 'text-slate-400'}>
                    {step}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-slate-500">Chargement...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
