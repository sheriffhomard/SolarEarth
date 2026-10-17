import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { HourlyRadiationResponse } from '../../types';
import { fetchNasaPowerDaily, compareSolarSources, SourceComparisonResult } from '../../services/nasaPowerService';

interface SourceComparisonPanelProps {
  pvgisData: HourlyRadiationResponse;
}

export const SourceComparisonPanel: React.FC<SourceComparisonPanelProps> = ({ pvgisData }) => {
  const [comparison, setComparison] = useState<SourceComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'hourly' | 'notes'>('metrics');

  const runComparison = async () => {
    setLoading(true);
    try {
      const nasaData = await fetchNasaPowerDaily(
        pvgisData.latitude,
        pvgisData.longitude,
        pvgisData.date
      );
      const result = compareSolarSources(
        pvgisData,
        nasaData,
        pvgisData.location_name || 'Station',
        pvgisData.latitude,
        pvgisData.longitude,
        pvgisData.date
      );
      setComparison(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [pvgisData.latitude, pvgisData.longitude, pvgisData.date, pvgisData.daily_irradiation_kwh]);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-0.5">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>V0.3 COMPARAISON DES SOURCES SCIENTIFIQUES</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Comparatif Multi-Sources : PVGIS JRC vs NASA POWER
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Écarts méthodologiques, différences de résolution spatiale (0.05° vs 0.5°) et analyse d'incertitude
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'metrics' ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Écarts
            </button>
            <button
              onClick={() => setActiveTab('hourly')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'hourly' ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Heure par Heure
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === 'notes' ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Explications
            </button>
          </div>

          <button
            onClick={runComparison}
            disabled={loading}
            aria-label="Recalculer la comparaison multi-sources"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading || !comparison ? (
        <div className="py-8 text-center text-xs font-mono text-slate-500 animate-pulse">
          Calcul comparatif en cours entre PVGIS et NASA POWER...
        </div>
      ) : (
        <>
          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PVGIS Card */}
            <div className="p-4 bg-slate-950/60 border border-amber-900/40 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  PVGIS JRC (Commission Européenne)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Maille fine (0.05° ~ 5 km)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Irradiation Journalière :</span>
                  <div className="text-lg font-bold text-slate-100">
                    {comparison.pvgis.daily_irradiation_kwh_m2}{' '}
                    <span className="text-xs font-normal text-slate-400">kWh/m²</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Pic d'Irradiance :</span>
                  <div className="text-lg font-bold text-amber-300">
                    {comparison.pvgis.peak_ghi_w_m2}{' '}
                    <span className="text-xs font-normal text-slate-400">W/m²</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                Méthode : <strong className="text-slate-300">{comparison.pvgis.method}</strong>
              </div>
            </div>

            {/* NASA POWER Card */}
            <div className="p-4 bg-slate-950/60 border border-sky-900/40 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  NASA POWER (Langley Research Center)
                </span>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2 py-0.5 rounded">
                  Maille large (0.5° ~ 50 km)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500">Irradiation Journalière :</span>
                  <div className="text-lg font-bold text-slate-100">
                    {comparison.nasa_power.daily_irradiation_kwh_m2}{' '}
                    <span className="text-xs font-normal text-slate-400">kWh/m²</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Pic d'Irradiance :</span>
                  <div className="text-lg font-bold text-sky-300">
                    {comparison.nasa_power.peak_ghi_w_m2}{' '}
                    <span className="text-xs font-normal text-slate-400">W/m²</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                Méthode : <strong className="text-slate-300">{comparison.nasa_power.method}</strong>
              </div>
            </div>
          </div>

          {/* Tab Content: Metrics */}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Écart Absolu d'Énergie</span>
                <div className="mt-1 text-xl font-mono font-bold text-slate-200">
                  {comparison.delta_daily_kwh_m2 > 0 ? `+${comparison.delta_daily_kwh_m2}` : comparison.delta_daily_kwh_m2}{' '}
                  <span className="text-xs font-normal text-slate-400">kWh/m²</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Différence journalière brute</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Biais Relatif Inter-Sources</span>
                <div className="mt-1 text-xl font-mono font-bold text-slate-200">
                  {comparison.relative_difference_percent > 0 ? `+${comparison.relative_difference_percent}` : comparison.relative_difference_percent}%
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Fourchette acceptable: ±10%</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Erreur Absolue Moyenne (MAE)</span>
                <div className="mt-1 text-xl font-mono font-bold text-slate-200">
                  {comparison.mean_absolute_error_w_m2}{' '}
                  <span className="text-xs font-normal text-slate-400">W/m²</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Écart moyen heure par heure</div>
              </div>
            </div>
          )}

          {/* Tab Content: Hourly Comparison Table */}
          {activeTab === 'hourly' && (
            <div className="border border-slate-800 rounded-lg overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-2 px-3">Heure UTC</th>
                    <th className="py-2 px-3 text-amber-400">PVGIS GHI (W/m²)</th>
                    <th className="py-2 px-3 text-sky-400">NASA POWER GHI (W/m²)</th>
                    <th className="py-2 px-3 text-right">Écart Δ (W/m²)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {comparison.hourly_comparison.map((h) => (
                    <tr key={h.hour} className={h.pvgis_ghi === 0 && h.nasa_ghi === 0 ? 'opacity-40' : ''}>
                      <td className="py-1.5 px-3">{h.hour.toString().padStart(2, '0')}:00</td>
                      <td className="py-1.5 px-3 text-amber-300 font-semibold">{h.pvgis_ghi}</td>
                      <td className="py-1.5 px-3 text-sky-300 font-semibold">{h.nasa_ghi}</td>
                      <td className={`py-1.5 px-3 text-right font-bold ${
                        Math.abs(h.diff_w_m2) < 25 ? 'text-slate-400' : h.diff_w_m2 > 0 ? 'text-sky-400' : 'text-amber-400'
                      }`}>
                        {h.diff_w_m2 > 0 ? `+${h.diff_w_m2}` : h.diff_w_m2}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab Content: Scientific Notes & Methodological Limits */}
          {activeTab === 'notes' && (
            <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg space-y-2 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Règles d'interprétation scientifique des écarts :</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                {comparison.scientific_notes.map((note, idx) => (
                  <li key={idx}>
                    <span className="text-slate-300">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
