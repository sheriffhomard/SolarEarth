import React from 'react';
import { Activity, Flame, Radio, Compass } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
          <span>HÉLIOPHYSIQUE & MÉTÉOROLOGIE SPATIALE</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>NOAA SWPC</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Solar & Geomagnetic Activity</h1>
        <p className="text-xs text-slate-400 mt-1">
          Activité solaire, émissions radioélectriques (F10.7) et perturbation géomagnétique (Kp / Dst).
        </p>
      </div>

      <div className="relative border border-slate-800 rounded-2xl bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Activity className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">
          Solar Activity & Geomagnetic Activity — Coming soon
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          Le module d'activité solaire et géomagnétique sera opérationnel en <strong>V0.4</strong>{' '}
          avec l'intégration du Space Weather Prediction Center (NOAA SWPC). Il fournira en direct
          les flux radioélectriques, les indices de tempête et les éruptions coronales.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full text-left font-mono text-xs text-slate-400">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              Flux F10.7
            </div>
            <p className="text-[11px] text-slate-400">Émission à 2800 MHz (sfu)</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              Indices Kp & Dst
            </div>
            <p className="text-[11px] text-slate-400">Agitation du champ magnétique (nT)</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Flares X-Ray
            </div>
            <p className="text-[11px] text-slate-400">Classification C, M, X (GOES)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
