import React, { useEffect, useState } from 'react';
import {
  Flame,
  Compass,
  Globe2,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Database,
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
      <section className="border-b border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <span>SOLAR EARTH OBSERVATION PLATFORM</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>PHASE V0.2 INTÉGRATION PVGIS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
              SOLAR EARTH
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Mesure, calcul et visualisation du rayonnement solaire reçu sur Terre au cours de la
              journée. Fonctionnement 100% autonome sur smartphone : moteur solaire embarqué, décomposition GHI / DNI / DHI sur 24h et stockage local IndexedDB & SQLite.
            </p>
          </div>

          {/* Quick Technical Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs font-mono text-slate-400 bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Mode Téléphone PWA</span>
            </div>
            <span className="hidden sm:inline text-slate-700" aria-hidden="true">|</span>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span>IndexedDB & SQLite Local</span>
            </div>
          </div>
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
              Module opérationnel V0.2 : flux solaire direct, diffus et global par heure
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded">
            Opérationnel · V0.2
          </span>
        </div>

        <SolarRadiationChart />
      </section>

      {/* Core Scientific Modules Roadmap */}
      <section aria-labelledby="core-modules-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 id="core-modules-heading" className="text-lg font-bold text-slate-100 tracking-tight">
              Autres Modules Scientifiques (Feuille de Route)
            </h2>
            <p className="text-xs text-slate-400">
              Spécifications des composants en cours de développement (V0.4 & V0.6)
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

          {/* World Map */}
          <ComingSoonCard
            title="World Map"
            subtitle="Cartographie globale & Time Slider"
            targetVersion="V0.6"
            icon={Globe2}
            parameters={[
              'Projection WGS84 EPSG:4326',
              'Couche d\'irradiance mondiale',
              'Curseur temporel horaire',
              'Terminator jour/nuit',
            ]}
            unit="Coordonnées WGS84"
            source="Moteur Cartographique GeoJSON"
            description="Visualisation cartographique interactive à l'échelle planétaire avec simulation du déplacement du rayonnement solaire au cours de la journée."
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
              État d'intégration des interfaces externes
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
                <th className="py-2.5 px-3">Fournisseur</th>
                <th className="py-2.5 px-3">Organisme</th>
                <th className="py-2.5 px-3">Version Cible</th>
                <th className="py-2.5 px-3">État V0.2</th>
                <th className="py-2.5 px-3">Paramètres Prévus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="bg-amber-950/10">
                <td className="py-3 px-3 font-semibold text-amber-300">PVGIS</td>
                <td className="py-3 px-3 text-slate-300">Commission Européenne JRC</td>
                <td className="py-3 px-3 font-mono text-emerald-400">V0.2 (Actif)</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-emerald-400 font-medium">activé (PVGIS v5.3 + Cache)</span>
                </td>
                <td className="py-3 px-3 text-slate-300 font-mono">GHI, DNI, DHI, Hauteur solaire, T2m</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">NASA POWER</td>
                <td className="py-3 px-3 text-slate-400">NASA Langley Research Center</td>
                <td className="py-3 px-3 font-mono text-amber-400">V0.3</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-slate-500">configuré (placeholder)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">Irradiance mondiale, Température, TMY</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">NOAA SWPC</td>
                <td className="py-3 px-3 text-slate-400">Space Weather Prediction Center</td>
                <td className="py-3 px-3 font-mono text-amber-400">V0.4</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-slate-500">configuré (placeholder)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">F10.7, Kp index, Dst, Éruptions solaires</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-medium text-slate-200">EUMETSAT</td>
                <td className="py-3 px-3 text-slate-400">Organisation Européenne Satellites Météo</td>
                <td className="py-3 px-3 font-mono text-amber-400">V0.7</td>
                <td className="py-3 px-3">
                  <span className="font-mono text-slate-500">configuré (placeholder)</span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono">Produits SARAH-3, MTG/FCI, Albédo nuageux</td>
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
            prévision et indices calculés. Aucune interpolation occulte.
          </p>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-sky-400 mb-2">
            <Layers className="w-4 h-4" />
            Unités Standards
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Irradiance: W/m² · Irradiation: kWh/m² · Flux radio: sfu · Kp: 0-9 · Dst: nT
          </p>
        </div>

        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            Architecture 100% Mobile
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Fonctionne entièrement sur le téléphone (PWA) : stockage sur l'appareil (IndexedDB), moteur de calcul astronomique embarqué, zéro Docker, zéro cloud.
          </p>
        </div>
      </section>
    </div>
  );
};
