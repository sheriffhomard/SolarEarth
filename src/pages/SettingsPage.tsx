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
  Upload,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  HelpCircle,
  ShieldAlert,
  Calendar,
  Clock,
  Radio,
} from 'lucide-react';
import { fetchHealth, fetchInfo } from '../services/api';
import { mobileDatabase } from '../services/indexedDbService';
import { getAllEnvVariables } from '../services/envConfig';
import { HealthResponse, InfoResponse } from '../types';
import {
  UpdateService,
  APP_VERSION,
  RELEASE_DATE,
  UpdateCheckResult,
} from '../services/updateService';
import { useTheme, Theme } from '../context/ThemeContext';
import { PWAInstallButton } from '../components/common/PWAInstallButton';
import { OnboardingModal } from '../components/common/OnboardingModal';
import { InfoTooltip } from '../components/common/InfoTooltip';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [dbStats, setDbStats] = useState<{ locationsCount: number; recordsCount: number; dbName: string }>({
    locationsCount: 0,
    recordsCount: 0,
    dbName: 'SolarEarth_MobileDB',
  });
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // System Updates State
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
  const [autoUpdateInterval, setAutoUpdateInterval] = useState<number>(15);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isForcingUpdate, setIsForcingUpdate] = useState<boolean>(false);

  // Onboarding Modal state
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const refreshStats = async () => {
    const stats = await mobileDatabase.getStats();
    setDbStats(stats);
  };

  useEffect(() => {
    fetchHealth().then(setHealth);
    fetchInfo().then(setInfo);
    refreshStats();

    setLastCheckDate(UpdateService.getLastCheckDate());
    setAutoUpdateEnabled(UpdateService.isAutoUpdateEnabled());
    setAutoUpdateInterval(UpdateService.getAutoUpdateIntervalMinutes());
  }, []);

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await UpdateService.checkForUpdates();
      setUpdateResult(result);
      setLastCheckDate(result.checkedAtIso);
    } catch {
      // Handled
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleForceUpdate = async () => {
    if (window.confirm('Voulez-vous forcer la réinitialisation complète des caches et recharger l’application depuis le serveur ?')) {
      setIsForcingUpdate(true);
      await UpdateService.forceUpdate();
    }
  };

  const handleToggleAutoUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoUpdateEnabled(val);
    UpdateService.setAutoUpdateEnabled(val);
  };

  const handleChangeInterval = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    setAutoUpdateInterval(val);
    UpdateService.setAutoUpdateIntervalMinutes(val);
  };

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

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await mobileDatabase.importDatabaseJSON(text);
      await refreshStats();
      setImportMessage(`Import réussi : ${res.importedLocations} stations, ${res.importedRecords} historiques.`);
      setTimeout(() => setImportMessage(null), 4000);
    } catch (err: any) {
      setImportMessage(`Erreur : ${err?.message || 'Fichier JSON invalide'}`);
      setTimeout(() => setImportMessage(null), 5000);
    }
    e.target.value = '';
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return 'Jamais vérifié';
    try {
      const date = new Date(iso);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Paramètres Système & Configuration
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Mises à jour automatiques en arrière-plan, thème d'affichage, installation PWA et stockage autonome.
        </p>
      </div>

      {/* 1. System Updates & Maintenance Card */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Gestion des Mises à Jour & Versioning
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 font-semibold">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vérification manuelle, déploiement forcé et cycle de mise à jour automatique en tâche de fond.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              {isCheckingUpdate ? 'Vérification...' : 'Vérifier les mises à jour'}
            </button>

            <button
              onClick={handleForceUpdate}
              disabled={isForcingUpdate}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              title="Vide les caches du Service Worker et recharge l'application"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Forcer la mise à jour
            </button>
          </div>
        </div>

        {/* Release date & Last check metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Date de sortie
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {RELEASE_DATE}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              Dernière vérification
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {formatDateTime(lastCheckDate)}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Statut de la version
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Version Officielle Stable
            </div>
          </div>
        </div>

        {/* Update result banner */}
        {updateResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
              updateResult.hasUpdate
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="font-bold">{updateResult.message}</div>
              <div className="text-[11px] opacity-90">
                Version courante : v{updateResult.currentVersion} · Version détectée : v{updateResult.latestVersion}
              </div>
            </div>
          </div>
        )}

        {/* Background Auto-Update Controls */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" />
                Mises à jour automatiques en arrière-plan
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  RECOMMANDÉ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Vérifie périodiquement la disponibilité d'une nouvelle version et l'installe silencieusement en arrière-plan sans interrompre vos calculs solaires.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoUpdateEnabled}
                onChange={handleToggleAutoUpdate}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {autoUpdateEnabled && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                Fréquence des vérifications en arrière-plan :
              </span>
              <select
                value={autoUpdateInterval}
                onChange={handleChangeInterval}
                className="px-2.5 py-1 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value={5}>Toutes les 5 minutes</option>
                <option value={15}>Toutes les 15 minutes (Standard)</option>
                <option value={30}>Toutes les 30 minutes</option>
                <option value={60}>Toutes les 60 minutes</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Visual Theme Switcher (Clair / Sombre / Système) */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Thème Visuel & Apparence
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Basculez entre le thème Sombre (observatoire astronomique nocturne) et le thème Clair (lecture haute luminosité).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 text-slate-900'
                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Thème Clair
                {theme === 'light' && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Fond blanc et contrastes optimisés pour lecture en plein jour.
              </p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 text-slate-100'
                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Moon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Thème Sombre
                {theme === 'dark' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Atmosphère spatiale profonde (ardoise foncée) préservant la vision nocturne.
              </p>
            </div>
          </button>

          <button
            onClick={() => setTheme('system')}
            className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 text-slate-900 dark:text-slate-100'
                : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Laptop className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Système Automatique
                {theme === 'system' && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                S'adapte automatiquement aux préférences de votre système d'exploitation.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. In-App Install App Button Card */}
      <PWAInstallButton variant="card" />

      {/* 4. Onboarding & Mentions Légales Review Button Card */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Mentions Légales & Avertissement de Non-Responsabilité
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                CADRE SCIENTIFIQUE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              L'application fournit des calculs et estimations physiques à titre informatif. L'auteur et l'éditeur ne sont pas responsables des décisions ou utilisations matérielles/financières prises sur cette base.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOnboardingModalOpen(true)}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          Revoir le guide & mentions légales
        </button>
      </div>

      {/* 5. Autonomous On-Device Database Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* On-device Mobile Database Control Panel */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <HardDrive className="w-4 h-4 text-sky-500" />
              Base de Données sur le Téléphone
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded">
              IndexedDB
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Emplacement de stockage</span>
              <span>Mémoire interne de l'appareil</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Nom de la base</span>
              <span className="text-sky-600 dark:text-sky-400">{dbStats.dbName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Stations enregistrées</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{dbStats.locationsCount} stations</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Calculs solaires archivés</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dbStats.recordsCount} calculs</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Dépendance Cloud / Docker</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Aucune (0%)</span>
            </div>
          </div>

          {/* Database Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleExportJSON}
              className="flex-1 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              {exportSuccess ? 'Téléchargé !' : 'Exporter (JSON)'}
            </button>

            <label className="flex-1 py-1.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span>Importer (JSON)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={handleResetDB}
              className="py-1.5 px-3 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-xs font-mono text-rose-700 dark:text-rose-300 rounded-lg transition-colors flex items-center justify-center gap-1 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
              title="Réinitialiser les stations de base"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {importMessage && (
            <div className="p-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>{importMessage}</span>
            </div>
          )}
        </div>

        {/* Calculation Engine & Physics */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Cpu className="w-4 h-4 text-amber-500" />
            Moteur Solaire Embarqué
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Moteur de calcul</span>
              <span>Spencer / Bird Ciel Clair</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Calcul du zénith & élévation</span>
              <span>Temps solaire vrai (TST)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Composantes calculées</span>
              <span className="text-amber-600 dark:text-amber-400">GHI, DNI, DHI (W/m²)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Source PVGIS</span>
              <span className="text-emerald-600 dark:text-emerald-400">Active (v5.3) + Cache local</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500 dark:text-slate-400">Mode déconnecté</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Opérationnel sans réseau
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Audit Reference Panel */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Sécurité, Secrets & Audit d'Exposition Réseau</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-0.5 rounded">
            Audité & Conforme
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold">
              <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                <Lock className="w-3.5 h-3.5" />
                Exposition des Ports Base de Données
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                0 Port Exposé
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Le passage à <strong>SQLite 3 local</strong> et <strong>IndexedDB</strong> supprime tout port TCP distant (5432 / 3306). La base est un conteneur protégé par les permissions OS et cloisonnée dans le bac à sable du navigateur.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold">
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Validation Stricte des Entrées
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                WGS84 & ISO
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Coordonnées géographiques bornées (lat [-90.0°, +90.0°], lon [-180.0°, +180.0°]). Dates vérifiées sur calendrier grégorien (1980-2060).
            </p>
          </div>
        </div>
      </div>

      {/* Re-open Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        forceShow={isOnboardingModalOpen}
      />
    </div>
  );
};
