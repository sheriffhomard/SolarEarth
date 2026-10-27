import React, { useState } from 'react';
import {
  History,
  Calendar,
  TrendingUp,
  Globe2,
  ShieldCheck,
  Award,
  AlertCircle,
  BarChart3,
  Sun,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  GLOBAL_SOLAR_BENCHMARKS,
  ClimateStationProfile,
  getClimateNormalsForLocation,
  calculateClimateAnomaly,
} from '../../services/climateService';
import { generateScientificSolarDay } from '../../services/physicsEngine';

export const ClimateAnalysisView: React.FC = () => {
  const [selectedStationId, setSelectedStationId] = useState<string>('carpentras');
  const [customLat, setCustomLat] = useState<number>(44.053);
  const [customLon, setCustomLon] = useState<number>(5.048);
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [anomalyDate, setAnomalyDate] = useState<string>('2026-06-21');

  const selectedStation: ClimateStationProfile = isCustom
    ? getClimateNormalsForLocation(customLat, customLon)
    : GLOBAL_SOLAR_BENCHMARKS.find((s) => s.id === selectedStationId) || GLOBAL_SOLAR_BENCHMARKS[4];

  // Daily observation for anomaly comparison
  const observedDay = generateScientificSolarDay(
    selectedStation.latitude,
    selectedStation.longitude,
    anomalyDate,
    selectedStation.name
  );

  const anomaly = calculateClimateAnomaly(
    observedDay.daily_ghi_kwh_m2,
    anomalyDate,
    selectedStation.latitude,
    selectedStation.longitude
  );

  // Maximum GHI for chart scale
  const maxMonthGhi = Math.max(...selectedStation.monthlyNormals.map((m) => m.ghiDailyAvgKwhM2), 8.5);

  return (
    <div className="space-y-6">
      {/* Header & Station Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <History className="w-3.5 h-3.5" />
              <span>CLIMATOLOGIE SOLAIRE & SÉRIES MULTI-ANNUELLES</span>
              <span className="text-slate-600">·</span>
              <span>NORMALES SARAH-2 / ERA5 (2005-2024)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Analyse Historique & Potentiel Climatique</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Moyennes mensuelles sur 20 ans, régularité saisonnière et détection d&apos;écarts anormaux.
              Distingue rigoureusement les données d&apos;observations réelles des normales climatiques multi-annuelles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustom(false)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                !isCustom
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Stations de Référence
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isCustom
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500 font-semibold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              GPS Personnalisé
            </button>
          </div>
        </div>

        {/* Station Selectors or Custom GPS Inputs */}
        {!isCustom ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 mr-2">Sélectionnez un site :</span>
            {GLOBAL_SOLAR_BENCHMARKS.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStationId(st.id)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  selectedStationId === st.id
                    ? 'bg-slate-800 border-amber-500 text-amber-300 font-semibold shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {st.name} ({st.country})
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Latitude :</span>
              <input
                type="number"
                step="0.05"
                value={customLat}
                onChange={(e) => setCustomLat(Number(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Longitude :</span>
              <input
                type="number"
                step="0.05"
                value={customLon}
                onChange={(e) => setCustomLon(Number(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <span className="text-slate-400 text-[11px]">
              Interpolation synthétique sur la bande climatique correspondante.
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards: Annual GHI, Seasonality Ratio, Variability, Solar Availability Index (SAI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">GHI Annuel Cumulé</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {selectedStation.annualGhiKwhM2.toLocaleString()} kWh/m²
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            DNI Annuel : {selectedStation.annualDniKwhM2.toLocaleString()} kWh/m²
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Ratio de Saisonnalité</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">
            x {selectedStation.seasonalityRatio.toFixed(1)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Max Été / Min Hiver ({selectedStation.seasonalityRatio > 4 ? 'Forte amplitude' : 'Régulier'})
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Variabilité Interannuelle (σ)</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ± {selectedStation.interannualVariabilityPercent.toFixed(1)} %
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Stabilité de la ressource sur 20 ans
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider">Indice SAI / GAI</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            {selectedStation.solarAvailabilityIndex} / 100
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Disponibilité & Régularité annuelle
          </div>
        </div>
      </div>

      {/* 12-Month Climatological Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Distribution Mensuelle du Rayonnement — {selectedStation.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Rayonnement journalier moyen (kWh/m²/jour) pour chaque mois de l&apos;année
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              GHI Journalier (kWh/m²/j)
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />
              DNI Journalier
            </span>
          </div>
        </div>

        {/* SVG Climatological Bar Chart */}
        <div className="relative pt-4">
          <svg viewBox="0 0 720 220" className="w-full h-52 select-none">
            {/* Grid lines */}
            <line x1="40" y1="20" x2="710" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="65" x2="710" y2="65" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="110" x2="710" y2="110" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="155" x2="710" y2="155" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="190" x2="710" y2="190" stroke="#334155" />

            {/* Y axis labels */}
            <text x="35" y="24" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              {maxMonthGhi.toFixed(1)} kWh
            </text>
            <text x="35" y="110" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              {(maxMonthGhi / 2).toFixed(1)} kWh
            </text>
            <text x="35" y="190" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              0
            </text>

            {/* Monthly bars */}
            {selectedStation.monthlyNormals.map((m, idx) => {
              const barHeight = (m.ghiDailyAvgKwhM2 / maxMonthGhi) * 160;
              const dniBarHeight = (m.dniDailyAvgKwhM2 / maxMonthGhi) * 160;
              const x = 55 + idx * 55;
              const yGhi = 190 - barHeight;

              return (
                <g key={m.monthIndex} className="group">
                  {/* GHI bar */}
                  <rect
                    x={x}
                    y={yGhi}
                    width="22"
                    height={Math.max(2, barHeight)}
                    fill="#f59e0b"
                    rx="2"
                    className="transition-all hover:opacity-80"
                  />
                  {/* Value on top */}
                  <text
                    x={x + 11}
                    y={Math.max(15, yGhi - 5)}
                    fontSize="9"
                    fill="#fef08a"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {m.ghiDailyAvgKwhM2}
                  </text>
                  {/* Month label */}
                  <text
                    x={x + 11}
                    y="205"
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {m.monthNameFr.slice(0, 3)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Observed vs Climate Reference Anomaly Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>DÉTECTEUR D&apos;ÉCART CLIMATIQUE (ANOMALIE)</span>
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Journée Observée vs Normale Historique de Référence
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Date analysée :</span>
            <input
              type="date"
              value={anomalyDate}
              onChange={(e) => setAnomalyDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Irradiation Observée</div>
            <div className="text-xl font-bold text-amber-300 mt-1">{anomaly.observedGhiKwhM2} kWh/m²</div>
            <div className="text-[10px] text-slate-400">Modèle ou station locale</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Normale Climatologique Mensuelle</div>
            <div className="text-xl font-bold text-slate-200 mt-1">{anomaly.climateReferenceGhiKwhM2} kWh/m²</div>
            <div className="text-[10px] text-slate-400">Moyenne 2005-2024</div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Écart relatif (Anomalie)</div>
            <div
              className={`text-xl font-bold mt-1 ${
                anomaly.status === 'surplus'
                  ? 'text-emerald-400'
                  : anomaly.status === 'deficit'
                  ? 'text-rose-400'
                  : 'text-sky-300'
              }`}
            >
              {anomaly.anomalyPercent > 0 ? '+' : ''}{anomaly.anomalyPercent}%
            </div>
            <div className="text-[10px] text-slate-400">
              Statut : {anomaly.status.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{anomaly.explanationFr}</p>
        </div>
      </div>

      {/* Global Benchmark Ranking Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-slate-100">Classement Mondial du Potentiel Solaire</h4>
            <p className="text-[11px] text-slate-400">
              Hiérarchie des stations selon l&apos;irradiation globale annuelle et l&apos;indice de disponibilité (SAI)
            </p>
          </div>
          <span className="text-[10px] text-slate-400">Classé par GHI Annuel Décroissant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Rang</th>
                <th className="py-2 px-3">Station / Lieu</th>
                <th className="py-2 px-3">Zone Climatique</th>
                <th className="py-2 px-3 text-right">GHI Annuel</th>
                <th className="py-2 px-3 text-right">DNI Annuel</th>
                <th className="py-2 px-3 text-right">Saisonnalité</th>
                <th className="py-2 px-3 text-right">Indice SAI</th>
              </tr>
            </thead>
            <tbody>
              {GLOBAL_SOLAR_BENCHMARKS.map((st, idx) => (
                <tr
                  key={st.id}
                  onClick={() => {
                    setIsCustom(false);
                    setSelectedStationId(st.id);
                  }}
                  className={`border-b border-slate-800/60 cursor-pointer transition-colors ${
                    selectedStationId === st.id && !isCustom
                      ? 'bg-amber-500/10 text-amber-200'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">
                    {st.name} <span className="text-slate-400 font-normal">({st.country})</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{st.climateZone}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                    {st.annualGhiKwhM2} kWh/m²
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {st.annualDniKwhM2} kWh/m²
                  </td>
                  <td className="py-2.5 px-3 text-right text-sky-300">
                    x {st.seasonalityRatio.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {st.solarAvailabilityIndex} / 100
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
