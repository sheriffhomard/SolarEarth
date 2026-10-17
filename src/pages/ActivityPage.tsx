import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Radio,
  Compass,
  ShieldCheck,
  RefreshCw,
  Info,
  Sun,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { fetchSpaceWeatherReport, SpaceWeatherReport } from '../services/noaaSwpcService';

export const ActivityPage: React.FC = () => {
  const [report, setReport] = useState<SpaceWeatherReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchSpaceWeatherReport();
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>V0.4 HÉLIOPHYSIQUE & MÉTÉOROLOGIE SPATIALE · NOAA SWPC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Activité Solaire & Géomagnétique
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Surveillance en temps réel du flux radioélectrique solaire F10.7, des indices géomagnétiques Kp et Dst, et des éruptions GOES
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Opérationnel V0.4
          </span>
          <button
            onClick={loadData}
            disabled={loading}
            aria-label="Actualiser les données de météo spatiale NOAA SWPC"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !report ? (
        <div className="py-12 text-center text-xs font-mono text-slate-500 animate-pulse">
          Récupération des indices héliophysiques NOAA SWPC...
        </div>
      ) : report ? (
        <>
          {/* Main KPI Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Flux F10.7 */}
            <div className="p-4 bg-slate-900/70 border border-amber-900/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  Flux Radio F10.7
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  {report.f10_7_status}
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-amber-300">
                {report.f10_7_flux_sfu}
                <span className="text-xs font-normal text-slate-400 ml-1.5">sfu</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Émission solaire à 2800 MHz (10.7 cm) · Dominion Observatory
              </p>
            </div>

            {/* Indice Planétaire Kp */}
            <div className="p-4 bg-slate-900/70 border border-sky-900/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  Indice Kp (0-9)
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  report.current_kp >= 5
                    ? 'text-rose-400 bg-rose-950/60 border-rose-800/40'
                    : 'text-sky-400 bg-sky-950/60 border-sky-800/40'
                }`}>
                  {report.storm_level}
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-sky-300">
                {report.current_kp}
                <span className="text-xs font-normal text-slate-400 ml-1.5">/ 9</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Agitation magnétique planétaire tri-horaire
              </p>
            </div>

            {/* Indice Dst */}
            <div className="p-4 bg-slate-900/70 border border-purple-900/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Indice Dst
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
                  Courant annulaire
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-purple-300">
                {report.dst_index_nt}
                <span className="text-xs font-normal text-slate-400 ml-1.5">nT</span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Perturbation équatoriale de la magnétosphère
              </p>
            </div>

            {/* Éruption Solaire GOES */}
            <div className="p-4 bg-slate-900/70 border border-rose-900/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Dernier Flare X-Ray
                </span>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/40 px-2 py-0.5 rounded">
                  Classe {report.latest_flare.class_code}
                </span>
              </div>
              <div className="text-3xl font-bold font-mono text-rose-300">
                {report.latest_flare.intensity_str}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Flux crête : {report.latest_flare.peak_flux_w_m2.toExponential(1)} W/m²
              </p>
            </div>
          </div>

          {/* Historical Trends: Kp 24h Bars + F10.7 7-Day Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kp 24h Bar Chart */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  <span>Historique Récent de l'Indice Kp (Par tranche de 3h)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Échelle 0-9</span>
              </div>

              <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2">
                {report.history_kp.map((kp, idx) => {
                  const heightPercent = Math.min(100, (kp.kp_value / 9) * 100);
                  const isStorm = kp.kp_value >= 5;
                  const isModerate = kp.kp_value >= 4;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-slate-300">
                        {kp.kp_value}
                      </span>
                      <div
                        style={{ height: `${Math.max(12, heightPercent)}%` }}
                        className={`w-full rounded-t transition-all ${
                          isStorm
                            ? 'bg-rose-500 shadow-lg shadow-rose-500/20'
                            : isModerate
                            ? 'bg-amber-500'
                            : 'bg-sky-500/80'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-slate-500 whitespace-nowrap mt-1">
                        {kp.time_utc.slice(-9, -4) || `${idx * 3}h`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-sky-500" /> Kp &lt; 4 (Calme)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-amber-500" /> Kp 4 (Agité)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-rose-500" /> Kp ≥ 5 (Orage)
                  </span>
                </div>
              </div>
            </div>

            {/* F10.7 Trend & Cycle 25 Context */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Évolution du Flux F10.7 sur 7 Jours (sfu)</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  {report.solar_cycle_phase}
                </span>
              </div>

              <div className="h-40 flex items-end justify-between gap-2 pt-4 px-2">
                {report.history_f10_7.map((item, idx) => {
                  const minBase = 120;
                  const maxBase = 200;
                  const heightPercent = Math.min(100, Math.max(15, ((item.flux_sfu - minBase) / (maxBase - minBase)) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        {item.flux_sfu}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400"
                      />
                      <span className="text-[9px] font-mono text-slate-500 mt-1">
                        {item.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Nombre de taches solaires (SSN) : <strong className="text-amber-300">{report.sunspot_number}</strong></span>
                <span>Moyenne lissée : <strong className="text-slate-200">{report.f10_7_smoothed} sfu</strong></span>
              </div>
            </div>
          </div>

          {/* Scientific Rationale: Solar-Terrestrial Radiation Coupling */}
          <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <span>Pourquoi la météo spatiale est déterminante pour l'énergie solaire sur Terre ?</span>
            </div>
            <p className="text-slate-400">
              1. <strong>Irradiance Solaire Totale (TSI)</strong> : La constante solaire (1361.2 W/m²) n'est pas strictement constante. Elle varie d'environ 0.1% (~1.5 W/m²) au rythme du cycle solaire de 11 ans. Le flux radio F10.7 est l'indicateur universel de cette activité coronale.
            </p>
            <p className="text-slate-400">
              2. <strong>Impact sur les capteurs satellitaires</strong> : Les orages géomagnétiques (Kp ≥ 5) chauffent et dilatent la haute atmosphère, augmentant le frottement orbital et modifiant la transmission optique pour les satellites d'observation (Meteosat, GOES).
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};
