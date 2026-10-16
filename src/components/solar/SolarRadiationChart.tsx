import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  MapPin,
  Calendar,
  Layers,
  Database,
  Crosshair,
  RefreshCw,
  Info,
} from 'lucide-react';
import { HourlyRadiationResponse } from '../../types';
import { fetchHourlyRadiation } from '../../services/api';

interface PresetStation {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

const PRESET_STATIONS: PresetStation[] = [
  { name: 'Observatoire de Paris', lat: 48.836, lon: 2.336, country: 'France' },
  { name: 'Carpentras (Provence)', lat: 44.053, lon: 5.048, country: 'France' },
  { name: 'Plataforma Solar Almería', lat: 37.091, lon: -2.358, country: 'Espagne' },
  { name: 'Royal Observatory Greenwich', lat: 51.477, lon: 0.0, country: 'Royaume-Uni' },
  { name: 'Mauna Loa Observatory', lat: 19.536, lon: -155.576, country: 'États-Unis' },
];

export const SolarRadiationChart: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<PresetStation>(PRESET_STATIONS[0]);
  const [customLat, setCustomLat] = useState<string>(PRESET_STATIONS[0].lat.toString());
  const [customLon, setCustomLon] = useState<string>(PRESET_STATIONS[0].lon.toString());
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Today's date by default (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [radiationData, setRadiationData] = useState<HourlyRadiationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Visibility toggles
  const [showGhi, setShowGhi] = useState<boolean>(true);
  const [showDni, setShowDni] = useState<boolean>(true);
  const [showDhi, setShowDhi] = useState<boolean>(true);

  // Load radiation series
  const loadData = async (lat: number, lon: number, dateStr: string, name?: string) => {
    setLoading(true);
    try {
      const data = await fetchHourlyRadiation(lat, lon, dateStr, name);
      setRadiationData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const lat = isCustomMode ? parseFloat(customLat) || 48.836 : selectedStation.lat;
    const lon = isCustomMode ? parseFloat(customLon) || 2.336 : selectedStation.lon;
    const name = isCustomMode ? 'Coordonnées manuelles' : selectedStation.name;
    loadData(lat, lon, selectedDate, name);
  }, [selectedStation, isCustomMode, selectedDate]);

  const handleStationChange = (station: PresetStation) => {
    setIsCustomMode(false);
    setSelectedStation(station);
    setCustomLat(station.lat.toString());
    setCustomLon(station.lon.toString());
  };

  const handleApplyCustom = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setIsCustomMode(true);
      loadData(lat, lon, selectedDate, `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
    }
  };

  const handleGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(3));
          const lon = parseFloat(pos.coords.longitude.toFixed(3));
          setCustomLat(lat.toString());
          setCustomLon(lon.toString());
          setIsCustomMode(true);
          loadData(lat, lon, selectedDate, 'Position locale');
        },
        () => {
          alert('Impossible d’accéder à la géolocalisation de votre appareil.');
        }
      );
    }
  };

  // SVG dimensions & scale math
  const width = 860;
  const height = 340;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 45;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxIrradiance = useMemo(() => {
    if (!radiationData || !radiationData.hourly.length) return 1000;
    const maxVal = Math.max(
      ...radiationData.hourly.flatMap((p) => [p.ghi, p.dni, p.dhi])
    );
    return Math.max(800, Math.ceil(maxVal / 100) * 100);
  }, [radiationData]);

  // Points to SVG coordinates
  const getX = (hourIndex: number) => paddingLeft + (hourIndex / 23) * chartW;
  const getY = (val: number) => paddingTop + chartH - (Math.max(0, val) / maxIrradiance) * chartH;

  // Path generators
  const ghiPath = useMemo(() => {
    if (!radiationData) return '';
    return radiationData.hourly.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.ghi);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [radiationData, maxIrradiance]);

  const ghiAreaPath = useMemo(() => {
    if (!radiationData) return '';
    const line = ghiPath;
    const xLast = getX(23);
    const xFirst = getX(0);
    const yBottom = paddingTop + chartH;
    return `${line} L ${xLast} ${yBottom} L ${xFirst} ${yBottom} Z`;
  }, [ghiPath]);

  const dniPath = useMemo(() => {
    if (!radiationData) return '';
    return radiationData.hourly.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.dni);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [radiationData, maxIrradiance]);

  const dhiPath = useMemo(() => {
    if (!radiationData) return '';
    return radiationData.hourly.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(p.dhi);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [radiationData, maxIrradiance]);

  // Current hovered data point
  const hoveredPoint = hoverIndex !== null && radiationData?.hourly ? radiationData.hourly[hoverIndex] : null;

  // Max elevation
  const maxElevation = useMemo(() => {
    if (!radiationData) return 0;
    return Math.max(...radiationData.hourly.map((p) => p.solar_elevation), 0);
  }, [radiationData]);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Header with Title and Mode indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
            <Sun className="w-3.5 h-3.5" />
            <span>MODULE PVGIS JRC · VERSION V0.2 ACTIVE</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Tracé Horaire du Rayonnement Solaire (24h)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Décomposition physique en composantes Directe (DNI), Diffuse (DHI) et Globale (GHI)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            PVGIS Actif
          </span>
          <button
            onClick={() => {
              const lat = isCustomMode ? parseFloat(customLat) || 48.836 : selectedStation.lat;
              const lon = isCustomMode ? parseFloat(customLon) || 2.336 : selectedStation.lon;
              loadData(lat, lon, selectedDate);
            }}
            disabled={loading}
            aria-label="Actualiser les données de rayonnement solaire"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Bar: Location Presets, Coordinates, Date */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Preset stations */}
        <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Station :
          </span>
          {PRESET_STATIONS.map((station) => {
            const isSelected = !isCustomMode && selectedStation.name === station.name;
            return (
              <button
                key={station.name}
                onClick={() => handleStationChange(station)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/40 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {station.name}
              </button>
            );
          })}
        </div>

        {/* Date Selector and Astronomical Presets */}
        <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate('2026-06-21')}
              className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded border border-slate-800"
              title="Solstice d'été (Ensoleillement maximum)"
            >
              Été
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-22')}
              className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded border border-slate-800"
              title="Équinoxe d'automne (12h de jour)"
            >
              Équinoxe
            </button>
            <button
              onClick={() => setSelectedDate('2026-12-21')}
              className="px-2 py-1 text-[11px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded border border-slate-800"
              title="Solstice d'hiver (Jour le plus court)"
            >
              Hiver
            </button>
          </div>
        </div>
      </div>

      {/* Manual coordinates bar */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs font-mono text-slate-400">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">Coordonnées GPS :</span>
        <div className="flex items-center gap-1">
          <label htmlFor="input-lat" className="text-slate-500 text-[11px]">Lat</label>
          <input
            id="input-lat"
            type="number"
            step="0.01"
            value={customLat}
            onChange={(e) => setCustomLat(e.target.value)}
            className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs text-center focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <label htmlFor="input-lon" className="text-slate-500 text-[11px]">Lon</label>
          <input
            id="input-lon"
            type="number"
            step="0.01"
            value={customLon}
            onChange={(e) => setCustomLon(e.target.value)}
            className="w-20 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs text-center focus:border-amber-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleApplyCustom}
          className="px-2.5 py-0.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
        >
          Calculer
        </button>
        <button
          onClick={handleGeolocation}
          className="px-2.5 py-0.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/80 border border-amber-800/40 rounded transition-colors flex items-center gap-1"
        >
          <Crosshair className="w-3 h-3" />
          Ma position
        </button>
      </div>

      {/* KPI Ribbon: High-precision metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Irradiation Journalière
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-slate-100 tabular-nums">
            {radiationData?.daily_irradiation_kwh ?? '—'}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">kWh/m²</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Énergie cumulée / jour</div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90">
            Pic d'Irradiance (GHI)
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-amber-300 tabular-nums">
            {radiationData?.peak_ghi ?? '—'}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">W/m²</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Flux instantané max</div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400/90">
            Pic Direct Normal (DNI)
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-orange-300 tabular-nums">
            {radiationData?.peak_dni ?? '—'}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">W/m²</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Rayonnement direct pur</div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          <div className="text-[11px] font-mono uppercase tracking-wider text-sky-400">
            Hauteur Solaire Max
          </div>
          <div className="mt-1 text-2xl font-mono font-bold text-sky-300 tabular-nums">
            {maxElevation.toFixed(1)}
            <span className="text-xs font-mono text-slate-400 ml-1.5 font-normal">°</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Élévation au midi solaire</div>
        </div>
      </div>

      {/* Interactive SVG Chart Viewport */}
      <div className="relative border border-slate-800 rounded-xl bg-slate-950 p-3 overflow-hidden">
        {/* Layer Visibility Checkboxes */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-2 text-xs font-mono">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGhi(!showGhi)}
              className={`flex items-center gap-1.5 transition-opacity ${
                showGhi ? 'opacity-100 font-semibold text-amber-400' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-3 h-1 bg-amber-400 rounded-full" />
              <span>GHI (Global)</span>
            </button>

            <button
              onClick={() => setShowDni(!showDni)}
              className={`flex items-center gap-1.5 transition-opacity ${
                showDni ? 'opacity-100 font-semibold text-orange-400' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-3 h-1 bg-orange-400 rounded-full" />
              <span>DNI (Direct)</span>
            </button>

            <button
              onClick={() => setShowDhi(!showDhi)}
              className={`flex items-center gap-1.5 transition-opacity ${
                showDhi ? 'opacity-100 font-semibold text-sky-400' : 'opacity-40 text-slate-500'
              }`}
            >
              <span className="w-3 h-1 bg-sky-400 rounded-full" />
              <span>DHI (Diffus)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Unités physiques : <strong>W/m²</strong> (ordonnée) · Heures UTC (abscisse)
          </div>
        </div>

        {/* SVG Curve */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none"
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="ghiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                <stop offset="90%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines horizontal */}
            {[0, 200, 400, 600, 800, 1000].map((level) => {
              if (level > maxIrradiance) return null;
              const y = getY(level);
              return (
                <g key={level}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray={level === 0 ? undefined : '3 3'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {level}
                  </text>
                </g>
              );
            })}

            {/* Vertical grid lines (every 3 hours) */}
            {[0, 3, 6, 9, 12, 15, 18, 21, 23].map((hour) => {
              const x = getX(hour);
              return (
                <g key={hour}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <text
                    x={x}
                    y={paddingTop + chartH + 18}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </text>
                </g>
              );
            })}

            {/* GHI area fill */}
            {showGhi && ghiAreaPath && (
              <path d={ghiAreaPath} fill="url(#ghiGradient)" />
            )}

            {/* GHI curve line */}
            {showGhi && ghiPath && (
              <path
                d={ghiPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* DNI curve line */}
            {showDni && dniPath && (
              <path
                d={dniPath}
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                strokeDasharray="4 2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* DHI curve line */}
            {showDhi && dhiPath && (
              <path
                d={dhiPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive hover line & points */}
            {hoverIndex !== null && hoveredPoint && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={paddingTop}
                  x2={getX(hoverIndex)}
                  y2={paddingTop + chartH}
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {showGhi && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hoveredPoint.ghi)}
                    r="4"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                {showDni && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hoveredPoint.dni)}
                    r="4"
                    fill="#f97316"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
                {showDhi && (
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(hoveredPoint.dhi)}
                    r="4"
                    fill="#38bdf8"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )}

            {/* Invisible interactive hover columns */}
            {radiationData?.hourly.map((_, i) => {
              const xLeft = i === 0 ? paddingLeft : getX(i) - chartW / 46;
              const colW = chartW / 23;
              return (
                <rect
                  key={i}
                  x={xLeft}
                  y={paddingTop}
                  width={colW}
                  height={chartH}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(i)}
                  onTouchStart={() => setHoverIndex(i)}
                />
              );
            })}
          </svg>
        </div>

        {/* Hover Floating HUD Tooltip */}
        {hoveredPoint && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-700/80 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-200 animate-in fade-in duration-100">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">
                {hoveredPoint.hour.toString().padStart(2, '0')}:00 UTC
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">
                Hauteur solaire : <strong className="text-slate-100">{hoveredPoint.solar_elevation}°</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                GHI: <strong className="text-amber-300 tabular-nums">{hoveredPoint.ghi} W/m²</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                DNI: <strong className="text-orange-300 tabular-nums">{hoveredPoint.dni} W/m²</strong>
              </span>

              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                DHI: <strong className="text-sky-300 tabular-nums">{hoveredPoint.dhi} W/m²</strong>
              </span>

              {hoveredPoint.temperature !== undefined && (
                <span className="text-slate-400">
                  T°: <strong className="text-slate-200">{hoveredPoint.temperature}°C</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scientific Notes & Data Provenance */}
      <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Source : <strong className="text-slate-300 font-normal">{radiationData?.source === 'pvgis_jrc' ? 'API PVGIS v5.3 (Commission Européenne JRC)' : 'Modèle Ciel Clair PVGIS / Bird'}</strong>
          </span>
          <span className="text-slate-700">·</span>
          <span>
            Cache HTTP : <strong className="text-slate-300 font-normal">{radiationData?.cached ? 'Actif (Local)' : 'Calculé'}</strong>
          </span>
        </div>

        <div className="text-slate-500">
          Formule fondamentale : GHI = DNI · sin(hauteur solaire) + DHI
        </div>
      </div>
    </div>
  );
};
