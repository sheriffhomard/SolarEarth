import React, { useState } from 'react';
import {
  Sun,
  Zap,
  Sliders,
  TrendingUp,
  ShieldCheck,
  Compass,
  Layers,
  ArrowRightLeft,
  Leaf,
  Info,
} from 'lucide-react';
import {
  PvSystemParameters,
  PvCellTechnology,
  PV_TECHNOLOGY_DEFAULTS,
  simulatePvDailyPerformance,
  generatePvScenarioComparisons,
} from '../../services/pvSimulatorEngine';
import { generateScientificSolarDay } from '../../services/physicsEngine';

export const PvSimulatorView: React.FC = () => {
  // Base location (Provence/Carpentras standard or custom)
  const [latitude, setLatitude] = useState<number>(44.053);
  const [longitude, setLongitude] = useState<number>(5.048);
  const [dateStr, setDateStr] = useState<string>('2026-06-21');

  // PV System parameters
  const [capacityKwp, setCapacityKwp] = useState<number>(6.0);
  const [tiltDeg, setTiltDeg] = useState<number>(35);
  const [azimuthDeg, setAzimuthDeg] = useState<number>(180); // 180 = South
  const [technology, setTechnology] = useState<PvCellTechnology>('monocrystalline');
  const [systemLossPercent, setSystemLossPercent] = useState<number>(14);
  const [inverterEffPercent, setInverterEffPercent] = useState<number>(97.5);
  const [shadingLossPercent, setShadingLossPercent] = useState<number>(0);
  const [groundAlbedo, setGroundAlbedo] = useState<number>(0.20);

  // Generate underlying solar day
  const solarDay = generateScientificSolarDay(latitude, longitude, dateStr, 'Provence Solaire');

  // Format hourly observations for PV engine
  const hourlyObs = solarDay.hourly.map((h) => ({
    hourUtc: h.hour_utc,
    solarElevationDeg: h.solar_elevation_deg,
    solarAzimuthDeg: h.solar_azimuth_deg ?? 180,
    ghiWm2: h.ghi_w_m2,
    dniWm2: h.dni_w_m2,
    dhiWm2: h.dhi_w_m2,
    temperatureC: h.temperature_c,
  }));

  const techDefaults = PV_TECHNOLOGY_DEFAULTS[technology];

  const params: PvSystemParameters = {
    installedCapacityKwp: capacityKwp,
    panelEfficiencyPercent: techDefaults.efficiencyPercent,
    tiltDeg,
    azimuthDeg,
    technology,
    noctDegC: techDefaults.noct,
    tempCoefficientPercentPerC: techDefaults.tempCoeff,
    systemLossPercent,
    inverterEfficiencyPercent: inverterEffPercent,
    groundAlbedo,
    shadingLossPercent,
  };

  const simulation = simulatePvDailyPerformance(hourlyObs, params);
  const scenarios = generatePvScenarioComparisons(hourlyObs, params);

  // Max scale for chart
  const maxAcPower = Math.max(...simulation.hourly.map((h) => h.acPowerW), 100);

  return (
    <div className="space-y-6">
      {/* Configuration Header & Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>SIMULATEUR DE PRODUCTION PHOTOVOLTAÏQUE</span>
              <span className="text-slate-600">·</span>
              <span>MODÈLE TRANSPOSITION & NOCT</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Dimensionnement & Rendement PV</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Calcul de l&apos;irradiance sur plan incliné (POA), échauffement des cellules selon la température
              ambiante, pertes thermiques (γ), onduleur et comparaison multi-configurations.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Date :</span>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200"
            />
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Capacity */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Puissance Crête
              </span>
              <strong className="text-amber-300">{capacityKwp} kWp</strong>
            </div>
            <input
              type="range"
              min="1.0"
              max="36.0"
              step="0.5"
              value={capacityKwp}
              onChange={(e) => setCapacityKwp(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <div className="text-[10px] text-slate-400">Surface estimée : ~{simulation.estimatedAreaM2} m²</div>
          </div>

          {/* Tilt */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                Inclinaison (β)
              </span>
              <strong className="text-sky-300">{tiltDeg}°</strong>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={tiltDeg}
              onChange={(e) => setTiltDeg(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <div className="text-[10px] text-slate-400">0° = Horizontal, 90° = Façade</div>
          </div>

          {/* Azimuth */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Azimut (γ)
              </span>
              <strong className="text-emerald-300">
                {azimuthDeg}° {azimuthDeg === 180 ? '(Sud)' : azimuthDeg === 90 ? '(Est)' : azimuthDeg === 270 ? '(Ouest)' : ''}
              </strong>
            </div>
            <input
              type="range"
              min="90"
              max="270"
              step="5"
              value={azimuthDeg}
              onChange={(e) => setAzimuthDeg(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <div className="text-[10px] text-slate-400">90° Est · 180° Plein Sud · 270° Ouest</div>
          </div>

          {/* Cell Technology */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                Technologie Cellule
              </span>
            </div>
            <select
              value={technology}
              onChange={(e) => setTechnology(e.target.value as PvCellTechnology)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="monocrystalline">Monocristallin (21.5% · -0.36%/°C)</option>
              <option value="polycrystalline">Polycristallin (17.5% · -0.40%/°C)</option>
              <option value="thin_film_cdte">Couches Minces CdTe (18% · -0.25%/°C)</option>
            </select>
            <div className="text-[10px] text-slate-400">NOCT: {techDefaults.noct}°C · STC: 1000 W/m²</div>
          </div>
        </div>

        {/* Advanced Loss & Shading Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-400">Pertes Câblage & Système (BOS) :</span>
            <span className="text-slate-200 font-bold">{systemLossPercent}%</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-400">Rendement Onduleur AC :</span>
            <span className="text-slate-200 font-bold">{inverterEffPercent}%</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded border border-slate-800">
            <span className="text-slate-400">Albédo du sol (ρ) :</span>
            <span className="text-slate-200 font-bold">{groundAlbedo} (Standard)</span>
          </div>
        </div>
      </div>

      {/* KPI Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Production Jour</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{simulation.dailyTotalAcKwh} kWh</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{simulation.equivalentPeakHoursH} h équiv. crête</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Puissance Pic AC</div>
          <div className="text-xl font-bold text-slate-100 mt-1">{(simulation.peakAcPowerW / 1000).toFixed(2)} kW</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{simulation.peakAcPowerW} W instantané</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Performance Ratio</div>
          <div className="text-xl font-bold text-sky-400 mt-1">{(simulation.averagePerformanceRatio * 100).toFixed(1)} %</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Norme IEC 61724</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Productible Annuel</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{simulation.annualEstimatedKwh.toLocaleString()} kWh</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{simulation.specificAnnualYieldKwhKwp} kWh/kWp/an</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Surface Panneaux</div>
          <div className="text-xl font-bold text-purple-400 mt-1">{simulation.estimatedAreaM2} m²</div>
          <div className="text-[10px] text-slate-400 mt-0.5">~{Math.round(simulation.estimatedAreaM2 / 1.8)} panneaux</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">CO₂ Évité (Jour)</div>
          <div className="text-xl font-bold text-teal-400 mt-1">{simulation.co2SavedDailyKg} kg</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Réseau électrique</div>
        </div>
      </div>

      {/* Hourly Power Output Curve vs Plane-of-Array Irradiance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">Profil Horaire de Puissance Électrique AC & Échauffement Cellule</h3>
            <p className="text-xs text-slate-400 font-mono">
              Puissance injectée sur réseau (W) et température de fonctionnement T_cell (°C) au cours des 24h
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
              Puissance AC (W)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
              T_cell (°C)
            </span>
          </div>
        </div>

        {/* Custom SVG Bar Chart */}
        <div className="relative pt-4">
          <svg viewBox="0 0 720 220" className="w-full h-48 select-none">
            {/* Grid Lines */}
            <line x1="40" y1="20" x2="710" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="70" x2="710" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="120" x2="710" y2="120" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="170" x2="710" y2="170" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="190" x2="710" y2="190" stroke="#334155" />

            {/* Y Axis Labels */}
            <text x="35" y="24" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              {Math.round(maxAcPower)} W
            </text>
            <text x="35" y="105" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              {Math.round(maxAcPower / 2)} W
            </text>
            <text x="35" y="190" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              0 W
            </text>

            {/* Bars for AC Power */}
            {simulation.hourly.map((h, i) => {
              const barHeight = maxAcPower > 0 ? (h.acPowerW / maxAcPower) * 160 : 0;
              const x = 50 + i * 27;
              const y = 190 - barHeight;

              return (
                <g key={h.hourUtc} className="group">
                  <rect
                    x={x}
                    y={y}
                    width="18"
                    height={Math.max(1, barHeight)}
                    fill={h.acPowerW > 0 ? '#f59e0b' : '#1e293b'}
                    rx="2"
                    className="transition-all hover:opacity-80"
                  />
                  {/* Hour text */}
                  <text
                    x={x + 9}
                    y="205"
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {h.hourUtc}h
                  </text>

                  {/* Cell Temp Dot on top */}
                  {h.acPowerW > 0 && (
                    <circle
                      cx={x + 9}
                      cy={Math.max(25, 190 - (h.cellTemperatureC / 65) * 160)}
                      r="3"
                      fill="#f43f5e"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Multi-Configuration Benchmark Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Comparateur de Configurations & Orientations</h3>
            <p className="text-xs text-slate-400 font-mono">
              Impact de l&apos;inclinaison et de l&apos;orientation sur le productible avec la même puissance ({capacityKwp} kWp)
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">Normalisé STC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {scenarios.map((sc, idx) => (
            <div
              key={sc.name}
              className={`p-4 rounded-xl border ${
                idx === 0
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-slate-900 border-slate-800'
              } space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{sc.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{sc.description}</p>
                </div>
                {sc.gainVsBaselinePercent !== 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      sc.gainVsBaselinePercent > 0
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {sc.gainVsBaselinePercent > 0 ? '+' : ''}{sc.gainVsBaselinePercent}%
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400">Prod. Jour</div>
                  <div className="text-base font-bold text-amber-300">{sc.dailyAcKwh} kWh</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Pic AC</div>
                  <div className="text-base font-bold text-slate-200">{(sc.peakAcPowerW / 1000).toFixed(1)} kW</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Rendement Spéc.</div>
                  <div className="text-xs font-semibold text-sky-300">{sc.specificDailyYieldH} h</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">PR Est.</div>
                  <div className="text-xs font-semibold text-emerald-300">{(sc.performanceRatio * 100).toFixed(0)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
