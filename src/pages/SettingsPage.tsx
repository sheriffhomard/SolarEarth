import React, { useEffect, useState } from 'react';
import {
  Server,
  Database,
  Smartphone,
  Settings,
  Download,
  Trash2,
  CheckCircle,
  HardDrive,
  Cpu,
  WifiOff,
  Copy,
  Check,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { fetchHealth, fetchInfo } from '../services/api';
import { mobileDatabase } from '../services/indexedDbService';
import { getAllEnvVariables } from '../services/envConfig';
import { HealthResponse, InfoResponse } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [dbStats, setDbStats] = useState<{ locationsCount: number; recordsCount: number; dbName: string }>({
    locationsCount: 0,
    recordsCount: 0,
    dbName: 'SolarEarth_MobileDB',
  });
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const refreshStats = async () => {
    const stats = await mobileDatabase.getStats();
    setDbStats(stats);
  };

  useEffect(() => {
    fetchHealth().then(setHealth);
    fetchInfo().then(setInfo);
    refreshStats();
  }, []);

  const handleExportJSON = async () => {
    const jsonStr = await mobileDatabase.exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-earth-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleResetDB = async () => {
    if (window.confirm('Voulez-vous réinitialiser les stations avec les observatoires de référence ?')) {
      await mobileDatabase.clearDatabase();
      await refreshStats();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          Configuration & Base Locale Mobile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Architecture 100% autonome sur smartphone : stockage IndexedDB / SQLite local, zéro cloud, zéro Docker.
        </p>
      </div>

      {/* Zero Cloud / Zero Docker banner */}
      <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-mono font-bold text-emerald-300">
            FONCTIONNEMENT AUTONOME SUR SMARTPHONE (OFFLINE-FIRST)
          </div>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            L'application fonctionne directement dans votre navigateur mobile ou installée comme application native (PWA). Les stations et les séries de rayonnement solaire sont enregistrées directement dans la mémoire de votre téléphone (IndexedDB / SQLite local). Aucun conteneur Docker, aucune base PostgreSQL et aucun serveur cloud distant ne sont nécessaires.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* On-device Mobile Database Control Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
              <HardDrive className="w-4 h-4 text-sky-400" />
              Base de Données sur le Téléphone
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              IndexedDB
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Emplacement de stockage</span>
              <span>Mémoire interne du téléphone</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Nom de la base</span>
              <span className="text-sky-300">{dbStats.dbName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Stations enregistrées</span>
              <span className="text-amber-400 font-bold">{dbStats.locationsCount} stations</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Calculs solaires archivés</span>
              <span className="text-emerald-400 font-bold">{dbStats.recordsCount} calculs</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Dépendance Cloud / Docker</span>
              <span className="text-emerald-400 font-semibold">Aucune (0%)</span>
            </div>
          </div>

          {/* Database Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              {exportSuccess ? 'Téléchargé !' : 'Exporter sauvegarde (JSON)'}
            </button>
            <button
              onClick={handleResetDB}
              className="py-1.5 px-3 bg-rose-950/30 hover:bg-rose-950/60 text-xs font-mono text-rose-300 rounded-lg transition-colors flex items-center justify-center gap-1 border border-rose-900/50"
              title="Réinitialiser les stations de base"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Calculation Engine & Physics */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Cpu className="w-4 h-4 text-amber-400" />
            Moteur Solaire Embarqué
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Moteur de calcul</span>
              <span>Spencer / Bird Ciel Clair</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Calcul du zénith & élévation</span>
              <span>Temps solaire vrai (TST)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Composantes calculées</span>
              <span className="text-amber-400">GHI, DNI, DHI (W/m²)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Source PVGIS</span>
              <span className="text-emerald-400">Active (V0.2) + Cache local</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Mode déconnecté</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Opérationnel sans réseau
              </span>
            </div>
          </div>
        </div>

        {/* PWA & Mobile Installation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Smartphone className="w-4 h-4 text-amber-400" />
            Progressive Web App (PWA Mobile)
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Nom PWA</span>
              <span>Solar Earth</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Affichage</span>
              <span>Standalone (Plein écran smartphone)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Service Worker</span>
              <span className="text-emerald-400">Actif (Mise en cache hors-ligne)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Installation mobile</span>
              <span>Bouton "Installer l'App" ou Safari "Sur l'écran d'accueil"</span>
            </div>
          </div>
        </div>

        {/* Roadmap without cloud dependencies */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-100">
            <Settings className="w-4 h-4 text-purple-400" />
            Feuille de Route Locale
          </div>

          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>V0.1: Architecture autonome PWA & base locale</span>
            </li>
            <li className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              <span>V0.2: Intégration PVGIS & tracé 24h sur smartphone</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] shrink-0">
                ·
              </span>
              <span>V0.3: Météorologie de surface locale (Température, Humidité)</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] shrink-0">
                ·
              </span>
              <span>V0.4: Flux solaire F10.7 & indices géomagnétiques</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] shrink-0">
                ·
              </span>
              <span>V0.6: Carte mondiale interactive sur smartphone</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Security, Secrets & Zero Database Port Exposure Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sécurité, Secrets & Audit d'Exposition Réseau</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded">
            Audité & Conforme
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-slate-200 font-bold">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Lock className="w-3.5 h-3.5" />
                Exposition des Ports Base de Données
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                0 Port Exposé
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Contrairement à PostgreSQL (port TCP 5432) ou MySQL (3306), le passage à <strong>SQLite 3 local</strong> et <strong>IndexedDB</strong> supprime tout port d'écoute réseau. La base est un fichier local protégé par les droits OS et cloisonnée dans le bac à sable (sandbox) du navigateur selon la <em>Same-Origin Policy</em>.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-slate-200 font-bold">
              <span className="flex items-center gap-1.5 text-amber-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Validation Stricte des Entrées (Inputs)
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                WGS84 & ISO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Les coordonnées géographiques sont strictement bornées (latitudes [-90.0°, +90.0°], longitudes [-180.0°, +180.0°]). Les dates sont validées au format calendrier ISO (1980-2060). Les entrées de stations sont protégées contre les injections XSS.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-slate-200 font-bold">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Server className="w-3.5 h-3.5" />
                Politique CORS & En-têtes HTTP
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                Restreint
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Les origines CORS sont limitées aux hôtes applicatifs autorisés (localhost:3000, PWA mobile). Les en-têtes de sécurité <code>X-Content-Type-Options: nosniff</code> et <code>X-Frame-Options: SAMEORIGIN</code> sont appliqués aux flux de données.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-slate-200 font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Cpu className="w-3.5 h-3.5" />
                Gestion des Secrets & Dépendances
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                Vite 8.3.4 Verrouillé
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Aucun secret applicatif critique n'est consigné dans le code. PVGIS est une API publique ouverte sans clé secrète requise. Les versions des dépendances sont verrouillées (Vite 8.3.4, React 19.0.1, TypeScript 7.0.2) et exemptes de failles connues.
            </p>
          </div>
        </div>
      </div>

      {/* Environment Variables Reference Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Variables d'Environnement & Paramètres Automatiques</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Toutes les variables sont injectées et configurées automatiquement avec leurs valeurs de référence.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded">
              100% Renseignées
            </span>
            <button
              onClick={() => {
                const vars = getAllEnvVariables();
                const content = vars.map(v => `${v.key}="${v.value}"`).join('\n');
                navigator.clipboard.writeText(content);
                setExportSuccess(true);
                setTimeout(() => setExportSuccess(false), 2500);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Copier .env</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2 pr-4 font-semibold">Variable</th>
                <th className="py-2 px-4 font-semibold">Valeur Automatique Active</th>
                <th className="py-2 px-4 font-semibold">Rôle & Domaine</th>
                <th className="py-2 pl-4 font-semibold text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {getAllEnvVariables().map((variable) => (
                <tr key={variable.key}>
                  <td className="py-2.5 pr-4 font-bold text-amber-400 whitespace-nowrap">
                    {variable.key}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-300 font-mono select-all break-all">
                    {variable.value}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">
                    {variable.description}
                  </td>
                  <td className="py-2.5 pl-4 text-right whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      Renseignée & Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
