import React, { useState, useEffect, useId } from 'react';
import {
  Globe2,
  Sun,
  Layers,
  MapPin,
  Clock,
  Play,
  Pause,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  WORLD_PRESETS,
  WorldPresetLocation,
  calculateSubsolarPoint,
  calculateTerminatorPath,
  estimateInstantaneousRadiation,
} from '../../services/solarWorldMapEngine';
import { generateScientificSolarDay } from '../../services/physicsEngine';

export type MapRadiationLayer = 'ghi' | 'dni' | 'dhi';

export const SolarWorldMap: React.FC = () => {
  const [selectedHourUtc, setSelectedHourUtc] = useState<number>(12);
  const [activeLayer, setActiveLayer] = useState<MapRadiationLayer>('ghi');
  const [selectedContinent, setSelectedContinent] = useState<string>('Tous');
  const [selectedLocation, setSelectedLocation] = useState<WorldPresetLocation>(WORLD_PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [comparisonLocation, setComparisonLocation] = useState<WorldPresetLocation | null>(WORLD_PRESETS[4]); // Dakar
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [dateStr, setDateStr] = useState<string>('2026-06-21'); // Summer solstice default

  // Stable IDs for SVG gradient and mask definitions
  const sunGlowGradientId = useId();
  const nightShadowGradientId = useId();
  const nightMaskId = useId();

  // Day of year calculation
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 6;
  const day = parts[2] || 21;
  const d = new Date(Date.UTC(year, month - 1, day));
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1;

  // Animation loop for time slider
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHourUtc((prev) => (prev + 1) % 24);
      }, 900);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Subsolar point & terminator
  const subsolar = calculateSubsolarPoint(dayOfYear, selectedHourUtc);
  const terminatorPoints = calculateTerminatorPath(dayOfYear, selectedHourUtc);

  // Convert lat/lon to SVG equirectangular coordinates (width 800, height 400)
  // X: lon from -180 to +180 -> 0 to 800
  // Y: lat from +90 to -90 -> 0 to 400
  const lonToX = (lon: number) => ((lon + 180) / 360) * 800;
  const latToY = (lat: number) => ((90 - lat) / 180) * 400;

  // Build SVG path for day/night terminator polygon
  const isNorthernSummer = subsolar.latitudeDeg >= 0;
  // If northern summer, north pole is lit, south pole is dark
  const terminatorPathD = (() => {
    if (terminatorPoints.length === 0) return '';
    let p = `M 0,${latToY(terminatorPoints[0].latitudeDeg)}`;
    for (const pt of terminatorPoints) {
      p += ` L ${lonToX(pt.longitudeDeg)},${latToY(pt.latitudeDeg)}`;
    }
    // Close polygon around the dark pole
    if (isNorthernSummer) {
      p += ` L 800,400 L 0,400 Z`;
    } else {
      p += ` L 800,0 L 0,0 Z`;
    }
    return p;
  })();

  // Instantaneous radiation at selected location
  const instantPrimary = estimateInstantaneousRadiation(
    selectedLocation.latitude,
    selectedLocation.longitude,
    dayOfYear,
    selectedHourUtc
  );

  const instantComp = comparisonLocation
    ? estimateInstantaneousRadiation(
        comparisonLocation.latitude,
        comparisonLocation.longitude,
        dayOfYear,
        selectedHourUtc
      )
    : null;

  // Full day calculation for comparison
  const fullDayPrimary = generateScientificSolarDay(
    selectedLocation.latitude,
    selectedLocation.longitude,
    dateStr,
    selectedLocation.name
  );

  const fullDayComp = comparisonLocation
    ? generateScientificSolarDay(
        comparisonLocation.latitude,
        comparisonLocation.longitude,
        dateStr,
        comparisonLocation.name
      )
    : null;

  const filteredPresets =
    selectedContinent === 'Tous'
      ? WORLD_PRESETS
      : WORLD_PRESETS.filter((p) => p.continent === selectedContinent);

  const continents = ['Tous', 'Europe', 'Afrique', 'Amériques', 'Asie', 'Océanie'];

  return (
    <div className="space-y-6">
      {/* Control Bar: Time Slider, Layer Switcher, Date */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Time Slider & Play Button */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-mono"
              title={isPlaying ? 'Mettre en pause' : 'Lancer le défilement diurne'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Rejouer 24h'}</span>
            </button>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Heure UTC : <strong className="text-amber-300">{selectedHourUtc.toString().padStart(2, '0')}:00</strong>
                </span>
                <span className="text-slate-400 text-[11px]">
                  Point subsolaire : Lat {subsolar.latitudeDeg >= 0 ? '+' : ''}{subsolar.latitudeDeg}° / Lon {subsolar.longitudeDeg >= 0 ? '+' : ''}{subsolar.longitudeDeg}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={selectedHourUtc}
                onChange={(e) => setSelectedHourUtc(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* Layer Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Couche :
            </span>
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveLayer('ghi')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeLayer === 'ghi'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GHI (Global)
              </button>
              <button
                onClick={() => setActiveLayer('dni')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeLayer === 'dni'
                    ? 'bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DNI (Direct)
              </button>
              <button
                onClick={() => setActiveLayer('dhi')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeLayer === 'dhi'
                    ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                DHI (Diffus)
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Date :
            </span>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Continent Filter & Compare Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Continent :</span>
            {continents.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedContinent(c)}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-mono ${
                  selectedContinent === c
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              showComparison
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Comparateur 2 Lieux {showComparison ? 'Activé' : ''}</span>
          </button>
        </div>
      </div>

      {/* Interactive World Map SVG Canvas */}
      <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto aspect-[2/1] select-none block"
          style={{ background: 'linear-gradient(180deg, #020617 0%, #080e21 100%)' }}
        >
          <defs>
            {/* Radial glow for subsolar point */}
            <radialGradient id={sunGlowGradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            {/* Night shadow mask */}
            <linearGradient id={nightShadowGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#020617" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.85" />
            </linearGradient>

            <mask id={nightMaskId}>
              <rect x="0" y="0" width="800" height="400" fill="white" />
              <path d={terminatorPathD} fill="black" />
            </mask>
          </defs>

          {/* Coordinate Grid: Equator, Tropics, Meridians */}
          <g stroke="#1e293b" strokeWidth="0.75" strokeDasharray="3 3">
            {/* Equator */}
            <line x1="0" y1="200" x2="800" y2="200" stroke="#334155" strokeWidth="1" strokeDasharray="none" />
            {/* Tropic of Cancer (+23.5°) */}
            <line x1="0" y1={latToY(23.44)} x2="800" y2={latToY(23.44)} />
            {/* Tropic of Capricorn (-23.5°) */}
            <line x1="0" y1={latToY(-23.44)} x2="800" y2={latToY(-23.44)} />
            {/* Arctic (+66.5°) & Antarctic (-66.5°) Circles */}
            <line x1="0" y1={latToY(66.5)} x2="800" y2={latToY(66.5)} />
            <line x1="0" y1={latToY(-66.5)} x2="800" y2={latToY(-66.5)} />
            {/* Prime Meridian (0°) */}
            <line x1="400" y1="0" x2="400" y2="400" stroke="#334155" strokeWidth="1" strokeDasharray="none" />
            <line x1="200" y1="0" x2="200" y2="400" />
            <line x1="600" y1="0" x2="600" y2="400" />
          </g>

          {/* Continents Simplified Outlines (SVG polygons for reference) */}
          <g fill="#0f172a" stroke="#1e293b" strokeWidth="1">
            {/* Europe */}
            <path d="M 380,80 L 460,70 L 480,120 L 430,140 L 390,135 L 375,100 Z" />
            {/* Africa */}
            <path d="M 380,140 L 480,140 L 490,210 L 460,300 L 420,310 L 370,220 L 370,170 Z" />
            {/* Asia */}
            <path d="M 480,70 L 680,60 L 720,120 L 650,220 L 550,200 L 480,120 Z" />
            {/* North America */}
            <path d="M 120,60 L 260,60 L 240,160 L 190,180 L 140,120 Z" />
            {/* South America */}
            <path d="M 210,190 L 280,210 L 260,320 L 220,330 L 190,240 Z" />
            {/* Australia */}
            <path d="M 640,260 L 730,260 L 730,320 L 640,310 Z" />
          </g>

          {/* Subsolar Radiation Heat Glow Zone */}
          <circle
            cx={lonToX(subsolar.longitudeDeg)}
            cy={latToY(subsolar.latitudeDeg)}
            r="160"
            fill={`url(#${sunGlowGradientId})`}
          />

          {/* Day / Night Terminator Darkness Zone */}
          <path d={terminatorPathD} fill="#020617" fillOpacity="0.72" />
          <path
            d={terminatorPoints.reduce(
              (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${lonToX(pt.longitudeDeg)},${latToY(pt.latitudeDeg)}`,
              ''
            )}
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.85"
          />

          {/* Subsolar Sun Icon Marker */}
          <g transform={`translate(${lonToX(subsolar.longitudeDeg)}, ${latToY(subsolar.latitudeDeg)})`}>
            <circle r="9" fill="#f59e0b" className="animate-pulse" />
            <circle r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
            <Sun className="w-4 h-4 -translate-x-2 -translate-y-2 text-slate-950" />
          </g>

          {/* Preset Location Markers */}
          {filteredPresets.map((loc) => {
            const isSelected = selectedLocation.id === loc.id;
            const isComp = comparisonLocation?.id === loc.id;
            const rad = estimateInstantaneousRadiation(loc.latitude, loc.longitude, dayOfYear, selectedHourUtc);

            return (
              <g
                key={loc.id}
                transform={`translate(${lonToX(loc.longitude)}, ${latToY(loc.latitude)})`}
                className="cursor-pointer group"
                onClick={() => {
                  if (showComparison) {
                    setComparisonLocation(loc);
                  } else {
                    setSelectedLocation(loc);
                  }
                }}
              >
                {/* Ping ring for selected */}
                {isSelected && (
                  <circle r="10" fill="none" stroke="#38bdf8" strokeWidth="2" className="animate-ping opacity-60" />
                )}
                {isComp && (
                  <circle r="10" fill="none" stroke="#f97316" strokeWidth="2" className="animate-ping opacity-60" />
                )}

                {/* Marker circle */}
                <circle
                  r={isSelected || isComp ? 6 : 4}
                  fill={
                    isSelected
                      ? '#38bdf8'
                      : isComp
                      ? '#f97316'
                      : rad.isDaylight
                      ? '#facc15'
                      : '#64748b'
                  }
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Label text */}
                <text
                  x="8"
                  y="3"
                  fontSize="9"
                  fontFamily="monospace"
                  fill={isSelected ? '#38bdf8' : isComp ? '#f97316' : '#cbd5e1'}
                  fontWeight={isSelected || isComp ? 'bold' : 'normal'}
                  className="pointer-events-none drop-shadow"
                >
                  {loc.name} ({rad.isDaylight ? `${rad[activeLayer === 'ghi' ? 'ghiWm2' : activeLayer === 'dni' ? 'dniWm2' : 'dhiWm2']} W` : '0 W'})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 backdrop-blur-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span>Point Subsolaire (Zénith 90°)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
            <span>Lieu Principal : {selectedLocation.name}</span>
          </div>
          {showComparison && comparisonLocation && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
              <span>Comparaison : {comparisonLocation.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-slate-400">
            <span>Zone sombre : Nuit astronomique (Terminator)</span>
          </div>
        </div>

        {/* Radiation Color Scale */}
        <div className="absolute top-3 right-3 bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 backdrop-blur-sm">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
            Échelle {activeLayer.toUpperCase()} (W/m²)
          </div>
          <div className="flex items-center gap-1.5">
            <span>0</span>
            <div className="w-24 h-2 rounded bg-gradient-to-r from-slate-900 via-amber-600 to-amber-300" />
            <span>1100</span>
          </div>
        </div>
      </div>

      {/* Selected Location Details Card / Dual Comparison Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Station */}
        <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>STATION PRINCIPALE · {selectedLocation.continent.toUpperCase()}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">{selectedLocation.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {selectedLocation.country} · Lat {selectedLocation.latitude}° / Lon {selectedLocation.longitude}°
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-mono font-bold text-sky-300">
                {instantPrimary.isDaylight ? `${instantPrimary.ghiWm2} W/m²` : '0 W/m²'}
              </span>
              <div className="text-[11px] font-mono text-slate-400">
                {instantPrimary.isDaylight ? `Élévation : ${instantPrimary.elevationDeg}°` : 'Nuit'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase">GHI Journalier</div>
              <div className="text-sm font-bold text-amber-300">{fullDayPrimary.daily_ghi_kwh_m2} kWh/m²</div>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase">Pic Zénithal</div>
              <div className="text-sm font-bold text-slate-200">{fullDayPrimary.peak_ghi_w_m2} W/m²</div>
            </div>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
              <div className="text-[10px] text-slate-400 uppercase">Ensoleillement</div>
              <div className="text-sm font-bold text-emerald-300">{fullDayPrimary.sunshine_hours_wmo} h WMO</div>
            </div>
          </div>
        </div>

        {/* Comparison Station (if active) */}
        {showComparison && comparisonLocation ? (
          <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-orange-400 mb-0.5">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>STATION DE COMPARAISON</span>
                </div>
                <h3 className="text-xl font-bold text-slate-100">{comparisonLocation.name}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {comparisonLocation.country} · Lat {comparisonLocation.latitude}° / Lon {comparisonLocation.longitude}°
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-mono font-bold text-orange-300">
                  {instantComp?.isDaylight ? `${instantComp.ghiWm2} W/m²` : '0 W/m²'}
                </span>
                <div className="text-[11px] font-mono text-slate-400">
                  {instantComp?.isDaylight ? `Élévation : ${instantComp.elevationDeg}°` : 'Nuit'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center font-mono">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">GHI Journalier</div>
                <div className="text-sm font-bold text-amber-300">{fullDayComp?.daily_ghi_kwh_m2} kWh/m²</div>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Pic Zénithal</div>
                <div className="text-sm font-bold text-slate-200">{fullDayComp?.peak_ghi_w_m2} W/m²</div>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400 uppercase">Ensoleillement</div>
                <div className="text-sm font-bold text-emerald-300">{fullDayComp?.sunshine_hours_wmo} h WMO</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-5 flex flex-col justify-center items-center text-center text-slate-400 space-y-2">
            <Globe2 className="w-8 h-8 text-slate-600" />
            <div className="text-sm font-semibold text-slate-300">Mode Comparateur Géographique</div>
            <p className="text-xs max-w-sm">
              Activez le bouton &quot;Comparateur 2 Lieux&quot; pour afficher les courbes de rayonnement et l&apos;énergie reçue en parallèle sur deux régions du globe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
