import React, { useState } from 'react';
import {
  Sun,
  Clock,
  Compass,
  TrendingUp,
  Award,
  Calendar,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { generateScientificSolarDay } from '../../services/physicsEngine';
import { WORLD_PRESETS } from '../../services/solarWorldMapEngine';

export const SolarObservatoryView: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('carpentras');
  const [dateStr, setDateStr] = useState<string>('2026-06-21');
  const [activeCurve, setActiveCurve] = useState<'all' | 'ghi' | 'dni' | 'dhi'>('all');

  const preset = WORLD_PRESETS.find((p) => p.id === selectedPresetId) || WORLD_PRESETS[0];

  const solarRecord = generateScientificSolarDay(
    preset.latitude,
    preset.longitude,
    dateStr,
    preset.name
  );

  // Peak observation point
  const peakPoint = solarRecord.hourly.reduce(
    (max, pt) => (pt.ghi_w_m2 > max.ghi_w_m2 ? pt : max),
    solarRecord.hourly[0]
  );

  // Sunrise, sunset and day length
  const daylightHours = solarRecord.hourly.filter((h) => h.solar_elevation_deg > 0);
  const sunriseHour = daylightHours.length > 0 ? daylightHours[0].hour_utc : 0;
  const sunsetHour = daylightHours.length > 0 ? daylightHours[daylightHours.length - 1].hour_utc : 0;
  const dayLengthHours = daylightHours.length;

  // Max value for scaling chart
  const maxIrradiance = Math.max(solarRecord.peak_ghi_w_m2, solarRecord.peak_dni_w_m2, 100);

  // Cumulative energy curve (kWh/m²)
  let runningWh = 0;
  const cumulativePoints = solarRecord.hourly.map((h) => {
    runningWh += h.ghi_w_m2;
    return {
      hour: h.hour_utc,
      cumulKwh: Math.round((runningWh / 1000) * 100) / 100,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Sun className="w-3.5 h-3.5" />
              <span>OBSERVATOIRE SOLAIRE QUOTIDIEN</span>
              <span className="text-slate-600">·</span>
              <span>CYCLE SOLAIRE COMPLET SUR 24H</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Observatoire & Cycle Journalier</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Suivi heure par heure du flux solaire incident, décomposition directe / diffuse, heures astronomiques
              du lever et coucher du Soleil, hauteur zénithale et ensoleillement utile (OMM).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Site selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Station :</span>
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
              >
                {WORLD_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Date :</span>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Curve toggles */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Affichage Courbes :</span>
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
              <button
                onClick={() => setActiveCurve('all')}
                className={`px-2.5 py-1 rounded ${
                  activeCurve === 'all'
                    ? 'bg-slate-800 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Toutes (GHI + DNI + DHI)
              </button>
              <button
                onClick={() => setActiveCurve('ghi')}
                className={`px-2.5 py-1 rounded ${
                  activeCurve === 'ghi'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GHI Global
              </button>
              <button
                onClick={() => setActiveCurve('dni')}
                className={`px-2.5 py-1 rounded ${
                  activeCurve === 'dni'
                    ? 'bg-orange-500/20 text-orange-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DNI Direct
              </button>
              <button
                onClick={() => setActiveCurve('dhi')}
                className={`px-2.5 py-1 rounded ${
                  activeCurve === 'dhi'
                    ? 'bg-sky-500/20 text-sky-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DHI Diffus
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>{solarRecord.product_name} ({solarRecord.product_version})</span>
          </div>
        </div>
      </div>

      {/* Main Ephemeris & Solar Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Lever / Coucher</div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {sunriseHour}h00 · {sunsetHour}h00
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{dayLengthHours}h de lumière</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Midi Solaire</div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {peakPoint.hour_utc}h00 UTC
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Hauteur {solarRecord.max_solar_elevation_deg}°</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pic GHI Instantané</div>
          <div className="text-lg font-bold text-amber-300 mt-1">
            {solarRecord.peak_ghi_w_m2} W/m²
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">DNI max {solarRecord.peak_dni_w_m2} W/m²</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Énergie Cumulée (GHI)</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {solarRecord.daily_ghi_kwh_m2} kWh/m²
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Extraterrestre {solarRecord.extraterrestrial_daily_kwh_m2} kWh</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Ensoleillement OMM</div>
          <div className="text-lg font-bold text-sky-400 mt-1">
            {solarRecord.sunshine_hours_wmo} h
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">DNI &ge; 120 W/m²</div>
        </div>

        <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Indice de Clarté (Kt)</div>
          <div className="text-lg font-bold text-purple-400 mt-1">
            {solarRecord.daily_clearness_index_kt}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Transmittance globale</div>
        </div>
      </div>

      {/* 24h Hourly Radiation Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Évolution Diurne du Rayonnement Solaire (24 Heures)
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Flux solaire incident en W/m² au sol sur surface horizontale
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            {(activeCurve === 'all' || activeCurve === 'ghi') && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                GHI (Global)
              </span>
            )}
            {(activeCurve === 'all' || activeCurve === 'dni') && (
              <span className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />
                DNI (Direct)
              </span>
            )}
            {(activeCurve === 'all' || activeCurve === 'dhi') && (
              <span className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block" />
                DHI (Diffus)
              </span>
            )}
          </div>
        </div>

        {/* SVG Multi-Curve Chart */}
        <div className="relative pt-4">
          <svg viewBox="0 0 720 220" className="w-full h-56 select-none">
            {/* Grid Lines */}
            <line x1="40" y1="20" x2="710" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="65" x2="710" y2="65" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="110" x2="710" y2="110" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="155" x2="710" y2="155" stroke="#1e293b" strokeDasharray="3 3" />
            <line x1="40" y1="190" x2="710" y2="190" stroke="#334155" />

            {/* Y axis labels */}
            <text x="35" y="24" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              {Math.round(maxIrradiance)} W
            </text>
            <text x="35" y="110" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              {Math.round(maxIrradiance / 2)} W
            </text>
            <text x="35" y="190" fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">
              0
            </text>

            {/* Area under GHI */}
            {(activeCurve === 'all' || activeCurve === 'ghi') && (
              <path
                d={solarRecord.hourly.reduce(
                  (acc, h, i) => {
                    const x = 50 + i * 27;
                    const y = 190 - (h.ghi_w_m2 / maxIrradiance) * 170;
                    return `${acc} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                  },
                  ''
                ) + ` L ${50 + 23 * 27},190 L 50,190 Z`}
                fill="#f59e0b"
                fillOpacity="0.15"
              />
            )}

            {/* GHI Line */}
            {(activeCurve === 'all' || activeCurve === 'ghi') && (
              <path
                d={solarRecord.hourly.reduce((acc, h, i) => {
                  const x = 50 + i * 27;
                  const y = 190 - (h.ghi_w_m2 / maxIrradiance) * 170;
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }, '')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* DNI Line */}
            {(activeCurve === 'all' || activeCurve === 'dni') && (
              <path
                d={solarRecord.hourly.reduce((acc, h, i) => {
                  const x = 50 + i * 27;
                  const y = 190 - (h.dni_w_m2 / maxIrradiance) * 170;
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }, '')}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            )}

            {/* DHI Line */}
            {(activeCurve === 'all' || activeCurve === 'dhi') && (
              <path
                d={solarRecord.hourly.reduce((acc, h, i) => {
                  const x = 50 + i * 27;
                  const y = 190 - (h.dhi_w_m2 / maxIrradiance) * 170;
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x},${y}`;
                }, '')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}

            {/* Hour ticks and dots */}
            {solarRecord.hourly.map((h, i) => {
              const x = 50 + i * 27;
              const yGhi = 190 - (h.ghi_w_m2 / maxIrradiance) * 170;

              return (
                <g key={h.hour_utc} className="group">
                  {h.ghi_w_m2 > 0 && (
                    <circle cx={x} cy={yGhi} r="3" fill="#f59e0b" className="transition-all hover:r-5" />
                  )}
                  <text
                    x={x}
                    y="205"
                    fontSize="9"
                    fill="#94a3b8"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {h.hour_utc}h
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Hourly Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
        <h4 className="font-bold text-slate-100">Tableau des Données Horaires & Angles Solaires</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Heure UTC</th>
                <th className="py-2 px-3">GHI (W/m²)</th>
                <th className="py-2 px-3">DNI (W/m²)</th>
                <th className="py-2 px-3">DHI (W/m²)</th>
                <th className="py-2 px-3">Élévation (α)</th>
                <th className="py-2 px-3">Azimut (ψ)</th>
                <th className="py-2 px-3">Énergie Cumulée</th>
              </tr>
            </thead>
            <tbody>
              {solarRecord.hourly.map((h, idx) => (
                <tr key={h.hour_utc} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-slate-200">{h.hour_utc}h00</td>
                  <td className="py-2 px-3 font-bold text-amber-300">{h.ghi_w_m2}</td>
                  <td className="py-2 px-3 text-orange-300">{h.dni_w_m2}</td>
                  <td className="py-2 px-3 text-sky-300">{h.dhi_w_m2}</td>
                  <td className="py-2 px-3 text-slate-300">{h.solar_elevation_deg}°</td>
                  <td className="py-2 px-3 text-slate-400">{h.solar_azimuth_deg}°</td>
                  <td className="py-2 px-3 text-emerald-400 font-semibold">{cumulativePoints[idx].cumulKwh} kWh/m²</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
