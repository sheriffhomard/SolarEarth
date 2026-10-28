import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Compass,
  Globe2,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Database,
  Zap,
  History,
  ArrowRight,
  Sun,
} from 'lucide-react';
import { ComingSoonCard } from '../components/common/ComingSoonCard';
import { SolarRadiationChart } from '../components/solar/SolarRadiationChart';
import { fetchHealth, fetchInfo } from '../services/api';
import { HealthResponse, InfoResponse } from '../types';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [info, setInfo] = useState<InfoResponse | null>(null);

  useEffect(() => {
    Promise.all([fetchHealth(), fetchInfo()])
      .then(([healthData, infoData]) => {
        setHealth(healthData);
        setInfo(infoData);
      });
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero / Header Section */}
      <section className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 mb-1 font-semibold">
              <span>SOLAR EARTH OBSERVATION PLATFORM</span>
              <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">·</span>
              <span>PHASE V0.3 SYSTÈME & PARAMÈTRES</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              SOLAR EARTH
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Mesure, calcul et visualisation du rayonnement solaire reçu sur Terre au cours de la
              journée. Double mode architectural : PWA 100% autonome sur smartphone avec base <strong>IndexedDB</strong>, ou station locale développeur avec base <strong>SQLite</strong>.
            </p>
          </div>

          {/* Quick Technical Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>PWA Smartphone : IndexedDB</span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-500" />
              <span>Station Dev : SQLite (solar_earth.db)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Modules Hub */}
      <section aria-labelledby="modules-hub-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="modules-hub-heading" className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Modules Scientifiques Opérationnels
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Outils d&apos;exploration, simulation et validation du rayonnement solaire
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">5 Modules Actifs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Card 1: World Map */}
          <Link
            to="/map"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Globe2 className="w-4 h-4" />
                  Carte Mondiale
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Actif
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Visualisation planétaire GHI, DNI, DHI avec curseur 24h, ombre de nuit (terminator) et comparaison de deux lieux.
              </p>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-semibold pt-3 mt-2 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Ouvrir la Carte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: PV Simulator */}
          <Link
            to="/pv"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <Zap className="w-4 h-4" />
                  Simulateur PV
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  Actif
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Transposition sur plan incliné (POA), échauffement cellule NOCT, pertes et benchmark de 4 géométries.
              </p>
            </div>
            <div className="flex items-center gap-1 text-sky-400 font-semibold pt-3 mt-2 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Simuler le Productible</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Trajectory */}
          <Link
            to="/trajectory"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Compass className="w-4 h-4" />
                  Trajectoire Solaire
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Actif
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Voûte céleste en projection polaire, éphémérides de lever/coucher, hauteur zénithale et mode solstices / équinoxes.
              </p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-semibold pt-3 mt-2 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Voir la Voûte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Climate History */}
          <Link
            to="/history"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                  <History className="w-4 h-4" />
                  Climatologie
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Actif
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Moyennes mensuelles sur 20 ans, ratios de saisonnalité été/hiver, classement mondial et indice SAI (0-100).
              </p>
            </div>
            <div className="flex items-center gap-1 text-purple-400 font-semibold pt-3 mt-2 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Consulter l&apos;Historique</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 5: Scientific Validation Lab */}
          <Link
            to="/lab"
            className="p-4 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group flex flex-col justify-between sm:col-span-2 lg:col-span-2"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Laboratoire Scientifique & Audit
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Export CSV & Audit
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Contrôles de cohérence physique, comparaison multi-sources (PVGIS vs Bird vs NASA POWER), banc de test des situations astronomiques et export certifié.
              </p>
            </div>
            <div className="flex items-center gap-1 text-amber-300 font-semibold pt-3 mt-2 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Accéder au Laboratoire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* V0.2 Core Operational Module: Interactive Solar Radiation Chart */}
      <section aria-labelledby="solar-radiation-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="solar-radiation-heading" className="text-lg font-bold text-slate-100 tracking-tight">
              Solar Radiation
            </h2>
            <p className="text-xs text-slate-400">
              Observatoire quotidien : flux solaire direct (DNI), diffus (DHI) et global (GHI) par heure avec stockage IndexedDB
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded">
            Opérationnel · V0.2
          </span>
        </div>

        <SolarRadiationChart />
      </section>

      {/* Space Weather Roadmap Section */}
      <section aria-labelledby="space-weather-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="space-weather-heading" className="text-lg font-bold text-slate-100 tracking-tight">
              Météorologie Spatiale (Feuille de Route V0.4)
            </h2>
            <p className="text-xs text-slate-400">
              Surveillance de la couronne solaire et des perturbations géomagnétiques terrestres
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Zéro fausse donnée affichée
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Solar Activity */}
          <ComingSoonCard
            title="Solar Activity"
            subtitle="Flux radio F10.7 & Taches solaires"
            targetVersion="V0.4"
            icon={Flame}
            parameters={[
              'Flux F10.7 (sfu)',
              'Sunspots SSN',
              'Rayons X GOES',
              'Éruptions solaires (C/M/X)',
            ]}
            unit="sfu (solar flux units)"
            source="NOAA SWPC (Space Weather)"
            description="Surveillance de l'activité de la couronne solaire et des émissions radioélectriques influençant l'ionosphère terrestre."
          />

          {/* Geomagnetic Activity */}
          <ComingSoonCard
            title="Geomagnetic Activity"
            subtitle="Indice planétaire Kp & Dst storm index"
            targetVersion="V0.4"
            icon={Compass}
            parameters={[
              'Indice Kp (0-9)',
              'Dst Index (nT)',
              'Pression vent solaire',
              'Alertes orages géomagnétiques',
            ]}
            unit="nT (nanotesla) & Kp index"
            source="NOAA SWPC / Observatoires mondiaux"
            description="État de perturbation de la magnétosphère terrestre sous l'effet du vent solaire et des éjections de masse coronale (CME)."
          />

          {/* World Map Advanced 3D Globe */}
          <ComingSoonCard
            title="World Map"
            subtitle="Globe 3D WebGL & Rendu PostGIS"
            targetVersion="V0.6"
            icon={Globe2}
            parameters={[
              'Globe 3D interactif WebGL',
              'Isolignes haute résolution',
              'Interpolation spatiale',
              'Couverture planétaire',
            ]}
            unit="Coordonnées EPSG:4326"
            source="Moteur 3D Sphérique"
            description="Extension 3D sphérique de la cartographie mondiale avec simulation temps réel des flux solaires en haute définition."
          />
        </div>
      </section>

      {/* Providers Readiness & Architecture Matrix */}
      <section aria-labelledby="providers-status-heading" className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 id="providers-status-heading" className="text-base font-bold text-slate-100 tracking-tight">
              Architecture Fournisseurs de Données (Providers)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              État d&apos;intégration des interfaces externes
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded">
            PVGIS Actif en V0.2
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Domaine & Source</th>
                <th className="py-2.5 px-3">Organisme & Type</th>
                <th className="py-2.5 px-3">Version Cible</th>
                <th className="py-2.5 px-3">État Opérationnel</th>
                <th className="py-2.5 px-3">Variables Fournies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {/* Category 1: Surface Solar Radiation */}
              <tr className="bg-amber-950/20">
                <td colSpan={5} className="py-2 px-3 font-mono font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                  1. Rayonnement Solaire de Surface (GHI, DNI, DHI — Irradiance au sol)
                </td>
              </tr>
              <tr className="bg-amber-950/10">
                <td className="py-3 px-3 font-semibold text-amber-300">PVGIS (JRC)</td>
                <td className="py-3 px-3 text-slate-300">Commission Européenne JRC (Satellites MSG/SARAH-2)</td>
                <td className="py-3 px-3 font-mono text-emerald-400">V0.2 (Actif)</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-emerald-400 font-medium">activé (API v5.3 + Cache local)</span>
                </td>
                <td className="py-3 px-3 text-slate-300 font-mono">GHI, DNI, DHI, Hauteur solaire, T2m</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">Modèle Bird & Hulstrom</td>
                <td className="py-3 px-3 text-slate-400">SERI 1981 / Spencer 1971 (Modèle physique Ciel Clair)</td>
                <td className="py-3 px-3 font-mono text-emerald-400">V0.2 (Embarqué)</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-emerald-400 font-medium">actif (hors-ligne 100% autonome)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">GHI, DNI, DHI, Décomposition spectrale</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">NASA POWER</td>
                <td className="py-3 px-3 text-slate-400">NASA Langley (Satellites CERES / Réanalyses MERRA-2)</td>
                <td className="py-3 px-3 font-mono text-amber-400">V0.3</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-slate-500">simulé (modèle calibré mondial)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">Irradiance mondiale, Température, TMY</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">EUMETSAT</td>
                <td className="py-3 px-3 text-slate-400">Organisation Européenne Satellites Météo (SARAH-3)</td>
                <td className="py-3 px-3 font-mono text-amber-400">V0.7</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-slate-500">indisponible (non configuré)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">Produits SARAH-3, Albédo nuageux</td>
              </tr>

              {/* Category 2: Space Weather */}
              <tr className="bg-sky-950/20">
                <td colSpan={5} className="py-2 px-3 font-mono font-bold text-sky-300 text-[11px] uppercase tracking-wider">
                  2. Météorologie Spatiale & Ionosphère (Contexte héliophysique — Non substituable au rayonnement de surface)
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">NOAA SWPC</td>
                <td className="py-3 px-3 text-slate-400">Space Weather Prediction Center (Couronne & Magnétosphère)</td>
                <td className="py-3 px-3 font-mono text-amber-400">V0.4</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-sky-400">intégré (flux héliophysique)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">F10.7 (sfu), Kp index, Dst (nT), Rayons X GOES</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Scientific Integrity & Unit Standards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            Intégrité Scientifique
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Distinction formelle entre mesure au sol, modèle atmosphérique, observation satellite,
            normales climatiques et prévisions. Aucune donnée inventée.
          </p>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-sky-400 mb-2">
            <Layers className="w-4 h-4" />
            Unités Standards OMM
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Irradiance: W/m² · Irradiation: kWh/m² · Puissance PV: kWp · Seuil soleil: &ge;120 W/m²
          </p>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Architecture 100% Mobile
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fonctionne entièrement sur le téléphone (PWA) : stockage sur l&apos;appareil (IndexedDB), moteur de calcul astronomique embarqué, zéro Docker, zéro cloud.
          </p>
        </div>
      </section>
    </div>
  );
};
