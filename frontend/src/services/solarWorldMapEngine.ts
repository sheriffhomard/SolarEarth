/**
 * Solar World Map Engine — Subsolar Point, Day/Night Terminator, and Planetary Radiation Grid.
 */

import { getSolarAstronomicalParameters } from './physicsEngine';

export interface WorldPresetLocation {
  id: string;
  name: string;
  country: string;
  continent: 'Europe' | 'Afrique' | 'Amériques' | 'Asie' | 'Océanie';
  latitude: number;
  longitude: number;
}

export const WORLD_PRESETS: WorldPresetLocation[] = [
  { id: 'carpentras', name: 'Carpentras', country: 'France', continent: 'Europe', latitude: 44.053, longitude: 5.048 },
  { id: 'marseille', name: 'Marseille', country: 'France', continent: 'Europe', latitude: 43.296, longitude: 5.369 },
  { id: 'paris', name: 'Paris', country: 'France', continent: 'Europe', latitude: 48.856, longitude: 2.352 },
  { id: 'madrid', name: 'Madrid', country: 'Espagne', continent: 'Europe', latitude: 40.416, longitude: -3.703 },
  { id: 'dakar', name: 'Dakar', country: 'Sénégal', continent: 'Afrique', latitude: 14.716, longitude: -17.467 },
  { id: 'cairo', name: 'Le Caire / Assouan', country: 'Égypte', continent: 'Afrique', latitude: 24.088, longitude: 32.899 },
  { id: 'atacama', name: 'San Pedro d’Atacama', country: 'Chili', continent: 'Amériques', latitude: -22.911, longitude: -68.201 },
  { id: 'mojave', name: 'Désert des Mojaves', country: 'États-Unis', continent: 'Amériques', latitude: 35.011, longitude: -115.473 },
  { id: 'tokyo', name: 'Tokyo', country: 'Japon', continent: 'Asie', latitude: 35.676, longitude: 139.650 },
  { id: 'sydney', name: 'Sydney', country: 'Australie', continent: 'Océanie', latitude: -33.868, longitude: 151.209 },
  { id: 'tromso', name: 'Tromsø (Cercle Arctique)', country: 'Norvège', continent: 'Europe', latitude: 69.649, longitude: 18.955 },
];

/**
 * Calculates subsolar point (latitude, longitude) where Sun is at exact zenith (90° elevation).
 */
export function calculateSubsolarPoint(
  dayOfYear: number,
  hourUtc: number
): { latitudeDeg: number; longitudeDeg: number; declinationRad: number } {
  const { declinationRad, equationOfTimeMin } = getSolarAstronomicalParameters(dayOfYear, hourUtc);
  const latitudeDeg = (declinationRad * 180) / Math.PI;

  // Subsolar longitude: when True Solar Time is 12:00 at longitude lambda:
  // lambda = - (hourUtc - 12 + equationOfTimeMin / 60) * 15°
  let longitudeDeg = -((hourUtc - 12) + equationOfTimeMin / 60) * 15;
  while (longitudeDeg > 180) longitudeDeg -= 360;
  while (longitudeDeg < -180) longitudeDeg += 360;

  return {
    latitudeDeg: Math.round(latitudeDeg * 100) / 100,
    longitudeDeg: Math.round(longitudeDeg * 100) / 100,
    declinationRad,
  };
}

/**
 * Calculates Day/Night solar terminator path (latitude for every longitude from -180° to +180°).
 * At the terminator, solar elevation is 0° (zenith = 90°).
 * cos(zenith) = sin(lat)*sin(decl) + cos(lat)*cos(decl)*cos(HA) = 0
 * => tan(lat) = - cos(HA) / tan(decl)
 */
export function calculateTerminatorPath(
  dayOfYear: number,
  hourUtc: number
): Array<{ longitudeDeg: number; latitudeDeg: number }> {
  const { latitudeDeg: subsolarLat, longitudeDeg: subsolarLon, declinationRad } = calculateSubsolarPoint(dayOfYear, hourUtc);
  const tanDecl = Math.tan(declinationRad);

  const points: Array<{ longitudeDeg: number; latitudeDeg: number }> = [];

  for (let lon = -180; lon <= 180; lon += 5) {
    if (Math.abs(tanDecl) < 1e-4) {
      // Equinox: terminator is vertical line at subsolarLon +/- 90°
      points.push({ longitudeDeg: lon, latitudeDeg: lon > subsolarLon ? 89 : -89 });
      continue;
    }

    // Hour angle at this longitude relative to subsolar longitude
    const haDeg = lon - subsolarLon;
    const haRad = (haDeg * Math.PI) / 180;

    const tanLat = -Math.cos(haRad) / tanDecl;
    let latDeg = (Math.atan(tanLat) * 180) / Math.PI;
    latDeg = Math.max(-88, Math.min(88, latDeg));

    points.push({ longitudeDeg: lon, latitudeDeg: Math.round(latDeg * 10) / 10 });
  }

  return points;
}

/**
 * Computes estimated instantaneous GHI, DNI, DHI at any point on Earth for a specific UTC hour.
 */
export function estimateInstantaneousRadiation(
  latitudeDeg: number,
  longitudeDeg: number,
  dayOfYear: number,
  hourUtc: number
): { ghiWm2: number; dniWm2: number; dhiWm2: number; elevationDeg: number; isDaylight: boolean } {
  const { declinationRad, equationOfTimeMin } = getSolarAstronomicalParameters(dayOfYear, hourUtc);

  const timeOffsetMin = equationOfTimeMin + 4 * longitudeDeg;
  const tstMin = (hourUtc * 60 + timeOffsetMin + 1440) % 1440;
  const haDeg = (tstMin / 4) - 180;
  const haRad = (haDeg * Math.PI) / 180;
  const latRad = (latitudeDeg * Math.PI) / 180;

  const sinElevation =
    Math.sin(latRad) * Math.sin(declinationRad) +
    Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(haRad);

  if (sinElevation <= 0) {
    return { ghiWm2: 0, dniWm2: 0, dhiWm2: 0, elevationDeg: -Math.round(Math.asin(-sinElevation) * (180 / Math.PI)), isDaylight: false };
  }

  const elevationRad = Math.asin(Math.min(1, sinElevation));
  const elevationDeg = Math.round((elevationRad * 180 / Math.PI) * 10) / 10;

  // Clear-sky approximation
  const airMass = 1.0 / (sinElevation + 0.05);
  const dni = Math.max(0, Math.min(1050, Math.round(1361.2 * Math.exp(-0.165 * airMass))));
  const dhi = Math.max(0, Math.min(300, Math.round(1361.2 * sinElevation * (0.08 + 0.03 * sinElevation))));
  const ghi = Math.max(0, Math.round(dni * sinElevation + dhi));

  return {
    ghiWm2: ghi,
    dniWm2: dni,
    dhiWm2: dhi,
    elevationDeg,
    isDaylight: true,
  };
}
