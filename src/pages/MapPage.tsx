import React from 'react';
import { SolarWorldMap } from '../components/solar/SolarWorldMap';

export const MapPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
          <span>MODULE GÉOSPATIAL MONDIAL</span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span>SRID 4326 (WGS84)</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-100">World Map — Carte Mondiale du Rayonnement Solaire</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Visualisation planétaire du rayonnement direct (DNI), diffus (DHI) et global (GHI).
          Défilement diurne sur 24h avec ombre de nuit astronomique (terminator) et comparaison géographique de deux lieux.
        </p>
      </div>

      <SolarWorldMap />
    </div>
  );
};
