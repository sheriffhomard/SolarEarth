import React, { useState } from 'react';
import {
  Compass,
  Sun,
  Clock,
  Calendar,
  Sparkles,
  Info,
  Maximize2,
  ChevronRight,
} from 'lucide-react';
import {
  calculateSolarAngles,
  getSolarAstronomicalParameters,
} from '../../services/physicsEngine';

export const SolarTrajectoryView: React.FC = () => {
  const [latitude, setLatitude] = useState<number>(44.053); // Carpentras
  const [longitude, setLongitude] = useState<number>(5.048);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [mode, setMode] = useState<'today' | 'solstices_equinox'>('solstices_equinox');
  const [dateStr, setDateStr] = useState<string>('2026-06-21');

  // Convert dateStr to dayOfYear
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 6;
  const day = parts[2] || 21;
  const d = new Date(Date.UTC(year, month - 1, day));
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1;

  // Key reference days of year:
  // Summer Solstice: Day 172 (June 21)
  // Winter Solstice: Day 355 (Dec 21)
  // Equinox: Day 80 (March 21)
  const daysToSimulate =
    mode === 'today'
      ? [{ label: 'Date sélectionnée', dayOfYear, color: '#f59e0b', strokeWidth: 2.5 }]
      : [
          { label: 'Solstice d’été (21 Juin)', dayOfYear: 172, color: '#f59e0b', strokeWidth: 2.5 },
          { label: 'Équinoxes (21 Mars / Sept)', dayOfYear: 80, color: '#38bdf8', strokeWidth: 2 },
          { label: 'Solstice d’hiver (21 Déc)', dayOfYear: 355, color: '#a855f7', strokeWidth: 2 },
        ];

  // Helper to convert polar (elevation, azimuth) to Cartesian (x, y) on a 360x360 SVG
  // Radius R = (90 - elevation) / 90 * maxRadius
  // Center is (180, 180), maxRadius is 150
  // Azimuth: 0° is North (top, y-), 90° East (right, x+), 180° South (bottom, y+), 270° West (left, x-)
  const polarToSvg = (elevationDeg: number, azimuthDeg: number, maxRadius = 145) => {
    const clampedEl = Math.max(0, elevationDeg);
    const r = ((90 - clampedEl) / 90) * maxRadius;
    const azRad = ((azimuthDeg - 90) * Math.PI) / 180;
    const x = 180 + r * Math.cos(azRad);
    const y = 180 + r * Math.sin(azRad);
    return { x, y, r };
  };

  // Trajectory paths for each day
  const trajectories = daysToSimulate.map((simDay) => {
    const points: Array<{ hour: number; elevation: number; azimuth: number; x: number; y: number }> = [];
    let sunriseHour: number | null = null;
    let sunsetHour: number | null = null;
    let maxElevation = -90;
    let solarNoonHour = 12;

    for (let h = 0; h <= 24; h += 0.25) {
      const { elevationDeg, azimuthDeg } = calculateSolarAngles(latitude, longitude, simDay.dayOfYear, h);
      if (elevationDeg > 0) {
        if (sunriseHour === null) sunriseHour = h;
        sunsetHour = h;
        if (elevationDeg > maxElevation) {
          maxElevation = elevationDeg;
          solarNoonHour = h;
        }
        const { x, y } = polarToSvg(elevationDeg, azimuthDeg);
        points.push({ hour: h, elevation: elevationDeg, azimuth: azimuthDeg, x, y });
      }
    }

    const pathD = points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');

    const dayLengthHours = sunriseHour !== null && sunsetHour !== null ? sunsetHour - sunriseHour : 0;

    return {
      ...simDay,
      points,
      pathD,
      sunriseHour: sunriseHour ?? 0,
      sunsetHour: sunsetHour ?? 0,
      maxElevation: Math.max(0, maxElevation),
      solarNoonHour,
      dayLengthHours,
    };
  });

  // Current selected hour position
  const currentAngles = calculateSolarAngles(latitude, longitude, dayOfYear, selectedHour);
  const currentPos = polarToSvg(currentAngles.elevationDeg, currentAngles.azimuthDeg);
  const { declinationRad, equationOfTimeMin } = getSolarAstronomicalParameters(dayOfYear, selectedHour);
  const declinationDeg = Math.round(((declinationRad * 180) / Math.PI) * 100) / 100;

  const primaryTrajectory = trajectories[0];

  return (
    <div className="space-y-6">
      {/* Header & Mode Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>DIAGRAMME SOLAIRE POLAIRE</span>
              <span className="text-slate-600">·</span>
              <span>PROJECTION ZÉNITHALE HAUTEUR-AZIMUT</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Simulateur de Trajectoire Solaire</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Déplacement apparent du Soleil dans la voûte céleste locale. Comparaison des solstices d&apos;été et
              d&apos;hiver avec les équinoxes pour analyser la variabilité saisonnière.
            </p>
          </div>

          {/* Mode Toggles */}
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs font-mono">
            <button
              onClick={() => setMode('solstices_equinox')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mode === 'solstices_equinox'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solstices & Équinoxes
            </button>
            <button
              onClick={() => setMode('today')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                mode === 'today'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Date Spécifique
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Latitude :</span>
            <input
              type="number"
              step="0.1"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Longitude :</span>
            <input
              type="number"
              step="0.1"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Date :</span>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-slate-400">Heure :</span>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
            />
            <span className="font-bold text-amber-300 w-12 text-right">{selectedHour}:00</span>
          </div>
        </div>
      </div>

      {/* Main Polar Diagram & Ephemeris Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Polar SVG Diagram (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center relative shadow-2xl">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>Projection Polaire Éléments Solaires</span>
            <span>Centre = Zénith (90°)</span>
          </div>

          <svg viewBox="0 0 360 360" className="w-full max-w-[420px] aspect-square select-none">
            {/* Concentric Elevation Circles */}
            <circle cx="180" cy="180" r="145" fill="#030712" stroke="#334155" strokeWidth="1.5" />
            <circle cx="180" cy="180" r="96.6" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="180" cy="180" r="48.3" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="180" cy="180" r="4" fill="#64748b" />

            {/* Elevation Labels */}
            <text x="180" y="30" fontSize="8" fill="#475569" textAnchor="middle" fontFamily="monospace">60°</text>
            <text x="180" y="78" fontSize="8" fill="#475569" textAnchor="middle" fontFamily="monospace">30°</text>
            <text x="180" y="176" fontSize="8" fill="#64748b" textAnchor="middle" fontFamily="monospace">90° (Zénith)</text>

            {/* Radial Azimuth Crosshairs */}
            <line x1="35" y1="180" x2="325" y2="180" stroke="#1e293b" strokeWidth="1" />
            <line x1="180" y1="35" x2="180" y2="325" stroke="#1e293b" strokeWidth="1" />

            {/* Cardinal Direction Labels */}
            <text x="180" y="24" fontSize="11" fill="#cbd5e1" fontWeight="bold" textAnchor="middle" fontFamily="monospace">N (0°)</text>
            <text x="336" y="184" fontSize="11" fill="#cbd5e1" fontWeight="bold" textAnchor="middle" fontFamily="monospace">E (90°)</text>
            <text x="180" y="344" fontSize="11" fill="#f59e0b" fontWeight="bold" textAnchor="middle" fontFamily="monospace">S (180°)</text>
            <text x="24" y="184" fontSize="11" fill="#cbd5e1" fontWeight="bold" textAnchor="middle" fontFamily="monospace">O (270°)</text>

            {/* Sun-path trajectory curves */}
            {trajectories.map((traj) => (
              <g key={traj.label}>
                <path
                  d={traj.pathD}
                  fill="none"
                  stroke={traj.color}
                  strokeWidth={traj.strokeWidth}
                  strokeLinecap="round"
                  opacity={mode === 'solstices_equinox' ? 0.9 : 1}
                />
                {/* Hourly hour markers on trajectory */}
                {traj.points
                  .filter((p) => p.hour % 2 === 0)
                  .map((p) => (
                    <g key={p.hour}>
                      <circle cx={p.x} cy={p.y} r="2.5" fill={traj.color} />
                      <text
                        x={p.x + 5}
                        y={p.y + 3}
                        fontSize="7"
                        fill={traj.color}
                        fontFamily="monospace"
                        opacity="0.8"
                      >
                        {p.hour}h
                      </text>
                    </g>
                  ))}
              </g>
            ))}

            {/* Current Sun Position Token */}
            {currentAngles.elevationDeg > 0 && (
              <g transform={`translate(${currentPos.x}, ${currentPos.y})`}>
                <circle r="8" fill="#f59e0b" className="animate-pulse" />
                <circle r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                <Sun className="w-4 h-4 -translate-x-2 -translate-y-2 text-slate-950" />
              </g>
            )}
          </svg>

          {/* Current Solar Position Badge */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
            <span>
              Heure : <strong className="text-amber-300">{selectedHour}:00</strong>
            </span>
            <span>·</span>
            <span>
              Hauteur (α) :{' '}
              <strong className={currentAngles.elevationDeg > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                {currentAngles.elevationDeg}°
              </strong>
            </span>
            <span>·</span>
            <span>
              Azimut (ψ) : <strong className="text-sky-400">{currentAngles.azimuthDeg}°</strong>
            </span>
          </div>
        </div>

        {/* Astronomical Ephemeris & Seasonal Analysis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>ÉPHÉMÉRIDES ASTRONOMIQUES LOCALES</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Lever du Soleil</div>
                <div className="text-base font-bold text-amber-300 mt-0.5">
                  {Math.floor(primaryTrajectory.sunriseHour)}h
                  {Math.round((primaryTrajectory.sunriseHour % 1) * 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400">Azimut ~{calculateSolarAngles(latitude, longitude, dayOfYear, primaryTrajectory.sunriseHour).azimuthDeg}°</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Coucher du Soleil</div>
                <div className="text-base font-bold text-orange-300 mt-0.5">
                  {Math.floor(primaryTrajectory.sunsetHour)}h
                  {Math.round((primaryTrajectory.sunsetHour % 1) * 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400">Azimut ~{calculateSolarAngles(latitude, longitude, dayOfYear, primaryTrajectory.sunsetHour).azimuthDeg}°</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Midi Solaire Vrai</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">
                  {Math.floor(primaryTrajectory.solarNoonHour)}h
                  {Math.round((primaryTrajectory.solarNoonHour % 1) * 60).toString().padStart(2, '0')}
                </div>
                <div className="text-[10px] text-slate-400">Culmination {primaryTrajectory.maxElevation.toFixed(1)}°</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Durée du Jour</div>
                <div className="text-base font-bold text-emerald-300 mt-0.5">
                  {Math.floor(primaryTrajectory.dayLengthHours)}h
                  {Math.round((primaryTrajectory.dayLengthHours % 1) * 60).toString().padStart(2, '0')} min
                </div>
                <div className="text-[10px] text-slate-400">Jour solaire utile</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Déclinaison Solaire (δ) :</span>
                <strong>{declinationDeg > 0 ? '+' : ''}{declinationDeg}°</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">Équation du Temps (EoT) :</span>
                <strong>{equationOfTimeMin.toFixed(1)} min</strong>
              </div>
            </div>
          </div>

          {/* Solstices & Equinoxes Comparative Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
            <h4 className="font-bold text-slate-200">Repères Saisonniers de Référence</h4>
            <div className="space-y-2">
              {trajectories.map((t) => (
                <div key={t.label} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-slate-300 font-semibold">{t.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-200 font-bold">{t.maxElevation.toFixed(0)}° max</div>
                    <div className="text-[10px] text-slate-400">{t.dayLengthHours.toFixed(1)}h jour</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
