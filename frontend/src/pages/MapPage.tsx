import React from 'react';
import { Globe2, Layers, MapPin, Compass } from 'lucide-react';

export const MapPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
          <span>MODULE GÉOSPATIAL</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>SRID 4326 (WGS84)</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">World Map — Carte Mondiale</h1>
        <p className="text-xs text-slate-400 mt-1">
          Visualisation planétaire du rayonnement solaire et de la trajectoire diurne.
        </p>
      </div>

      <div className="relative border border-slate-800 rounded-2xl bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center min-h-[420px]">
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center rounded-full bg-sky-950/40 border border-sky-500/20 text-sky-400">
          <Globe2 className="w-14 h-14" />
          <div className="absolute inset-0 rounded-full border border-sky-500/30 animate-ping opacity-25" />
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-2">
          World Map — Coming soon
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          La cartographie interactive mondiale sera déployée en <strong>V0.6</strong>. Elle s'appuiera
          sur les calculs géométriques PostGIS (EPSG:4326) et intégrera les couches d'irradiance
          (GHI, DNI, DHI) couplées à un curseur temporel horaire (time slider).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full text-left font-mono text-xs text-slate-400">
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              Time Slider
            </div>
            <p className="text-[11px] text-slate-400">Simulation de 00:00 à 23:59 UTC</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              Isolignes GHI
            </div>
            <p className="text-[11px] text-slate-400">Interpolation du rayonnement au sol</p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-2 text-slate-200 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Stations Solaires
            </div>
            <p className="text-[11px] text-slate-400">Index spatial PostGIS</p>
          </div>
        </div>
      </div>
    </div>
  );
};
