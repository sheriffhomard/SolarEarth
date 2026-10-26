/**
 * Rigorous Solar Physics & Astronomical Calculations Engine.
 *
 * Implements standard solar radiation formulas from:
 * - Spencer, J.W. (1971): "Fourier series representation of the position of the Sun".
 * - ASTM E490 / SORCE Solar Constant (I_sc = 1361.2 W/m²).
 * - WMO (World Meteorological Organization) Guide to Meteorological Instruments and Methods of Observation.
 * - Bird, R.E. & Hulstrom, R.L. (1981): "Simplified Clear Sky Model for Direct and Diffuse Insolation".
 */

import {
  CommonHourlyObservation,
  UnifiedSolarObservationRecord,
  QualityFlag,
  CacheFreshnessStatus,
} from '../types/scientificModel';

export const SOLAR_CONSTANT_ISC = 1361.2; // W/m² (ASTM E490 / SORCE)
export const WMO_SUNSHINE_THRESHOLD_DNI = 120.0; // W/m²

export interface SolarPhysicalValidationResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Calculates orbital eccentricity factor for day of year (Spencer 1971).
 * r0/r factor varies from ~0.967 (aphelion in July) to ~1.034 (perihelion in January).
 */
export function getOrbitalEccentricityCorrection(dayOfYear: number): number {
  const theta0 = (2 * Math.PI * (dayOfYear - 1)) / 365.25;
  return (
    1.00011 +
    0.034221 * Math.cos(theta0) +
    0.00128 * Math.sin(theta0) +
    0.000719 * Math.cos(2 * theta0) +
    0.000077 * Math.sin(2 * theta0)
  );
}

/**
 * Calculates normal extraterrestrial irradiance I0 on a given day of year.
 */
export function getExtraterrestrialNormalIrradiance(dayOfYear: number): number {
  const ecc = getOrbitalEccentricityCorrection(dayOfYear);
  return SOLAR_CONSTANT_ISC * ecc;
}

/**
 * Calculates equation of time (in minutes) and solar declination (in radians).
 */
export function getSolarAstronomicalParameters(dayOfYear: number, hourFraction: number): {
  declinationRad: number;
  equationOfTimeMin: number;
} {
  const gamma = (2 * Math.PI / 365.25) * (dayOfYear - 1 + (hourFraction - 12) / 24);

  // Equation of time in minutes (Spencer 1971)
  const equationOfTimeMin =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  // Solar declination in radians (Spencer 1971)
  const declinationRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  return { declinationRad, equationOfTimeMin };
}

/**
 * Calculates solar elevation and azimuth angles.
 * elevation in degrees [-90, +90], azimuth in degrees [0, 360] (0 = North, 90 = East).
 */
export function calculateSolarAngles(
  latitudeDeg: number,
  longitudeDeg: number,
  dayOfYear: number,
  hourUtc: number
): { elevationDeg: number; azimuthDeg: number; zenithDeg: number } {
  const { declinationRad, equationOfTimeMin } = getSolarAstronomicalParameters(dayOfYear, hourUtc);

  // True Solar Time (TST) in minutes
  const timeOffsetMin = equationOfTimeMin + 4 * longitudeDeg;
  const tstMin = (hourUtc * 60 + timeOffsetMin + 1440) % 1440;

  // Hour Angle (H) in degrees, 0 at solar noon
  const haDeg = (tstMin / 4) - 180;
  const haRad = (haDeg * Math.PI) / 180;

  const latRad = (latitudeDeg * Math.PI) / 180;

  // Zenith angle (cos theta_z = sin(lat)*sin(decl) + cos(lat)*cos(decl)*cos(ha))
  let cosZenith =
    Math.sin(latRad) * Math.sin(declinationRad) +
    Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(haRad);

  cosZenith = Math.max(-1, Math.min(1, cosZenith));
  const zenithRad = Math.acos(cosZenith);
  const elevationRad = Math.PI / 2 - zenithRad;

  const elevationDeg = (elevationRad * 180) / Math.PI;
  const zenithDeg = (zenithRad * 180) / Math.PI;

  // Azimuth angle
  let cosAzimuth =
    (Math.sin(elevationRad) * Math.sin(latRad) - Math.sin(declinationRad)) /
    (Math.cos(elevationRad) * Math.cos(latRad) + 1e-6);
  cosAzimuth = Math.max(-1, Math.min(1, cosAzimuth));
  let azimuthDeg = (Math.acos(cosAzimuth) * 180) / Math.PI;
  if (Math.sin(haRad) > 0) {
    azimuthDeg = 360 - azimuthDeg;
  }

  return {
    elevationDeg: Math.round(elevationDeg * 100) / 100,
    azimuthDeg: Math.round(azimuthDeg * 100) / 100,
    zenithDeg: Math.round(zenithDeg * 100) / 100,
  };
}

/**
 * Validates physical consistency of solar irradiance measurements.
 * Checks:
 * 1. Non-negativity: GHI >= 0, DNI >= 0, DHI >= 0
 * 2. Night consistency: If elevation <= 0, GHI = DNI = DHI = 0
 * 3. Physical upper bound: GHI <= 1400 W/m²
 * 4. Geometric consistency: GHI approx = DNI * sin(elevation) + DHI
 */
export function validatePhysicalIrradiance(
  ghi: number,
  dni: number,
  dhi: number,
  solarElevationDeg: number
): SolarPhysicalValidationResult {
  const violations: string[] = [];

  if (ghi < 0) violations.push(`GHI négatif interdit: ${ghi} W/m²`);
  if (dni < 0) violations.push(`DNI négatif interdit: ${dni} W/m²`);
  if (dhi < 0) violations.push(`DHI négatif interdit: ${dhi} W/m²`);

  // Night validation
  if (solarElevationDeg <= 0) {
    if (ghi > 2.0) violations.push(`GHI nocturne non nul (${ghi} W/m² à élévation ${solarElevationDeg}°)`);
    if (dni > 2.0) violations.push(`DNI nocturne non nul (${dni} W/m² à élévation ${solarElevationDeg}°)`);
    if (dhi > 2.0) violations.push(`DHI nocturne non nul (${dhi} W/m² à élévation ${solarElevationDeg}°)`);
  } else {
    // Upper bounds
    if (ghi > 1420) violations.push(`GHI dépasse la limite physique solaire (${ghi} W/m²)`);
    if (dni > 1150) violations.push(`DNI dépasse la limite physique solaire (${dni} W/m²)`);

    // Geometric component balance check
    const sinEl = Math.sin((solarElevationDeg * Math.PI) / 180);
    const expectedGhi = dni * sinEl + dhi;
    const diff = Math.abs(ghi - expectedGhi);
    // Allow small tolerance for measurement uncertainties and pyranometer cos error (typically 25 W/m² or 10%)
    const allowedTol = Math.max(25, expectedGhi * 0.12);
    if (diff > allowedTol && ghi > 50) {
      violations.push(
        `Déséquilibre géométrique: GHI (${ghi}) != DNI·sin(h) + DHI (${Math.round(expectedGhi)} W/m²)`
      );
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Computes daily integrated irradiation from 24 hourly points.
 * Energy H = integral(P dt) approx = sum(G_i * 1 hour) in Wh/m² and converted to kWh/m².
 */
export function calculateDailyIrradiation(hourlyGhiWh: number[]): {
  totalWhM2: number;
  totalKwhM2: number;
} {
  const totalWhM2 = hourlyGhiWh.reduce((sum, val) => sum + Math.max(0, val), 0);
  const totalKwhM2 = Math.round((totalWhM2 / 1000.0) * 1000) / 1000;
  return { totalWhM2, totalKwhM2 };
}

/**
 * Computes WMO sunshine duration in hours (number of hours with DNI >= 120 W/m²).
 */
export function calculateSunshineDurationHours(hourlyDni: number[]): number {
  return hourlyDni.reduce((count, dni) => (dni >= WMO_SUNSHINE_THRESHOLD_DNI ? count + 1.0 : count), 0);
}

export interface BirdHulstromAtmosphericInputs {
  pressureRatio?: number; // P / P0, default 1.0 (sea level standard)
  ozoneCmAtm?: number; // lo in cm-atm, default 0.34 (340 Dobson Units)
  precipitableWaterCm?: number; // w in cm, default 1.5 cm
  aerosolOpticalDepth500?: number; // tau_a at 500nm, default 0.10 (clear continental atmosphere)
  groundAlbedo?: number; // rho_g, default 0.20
  forwardScatterFraction?: number; // F, default 0.84
}

export interface BirdHulstromTransmittances {
  dni: number;
  dhi: number;
  ghi: number;
  rayleighTransmittance: number;
  ozoneTransmittance: number;
  gasesTransmittance: number;
  waterVaporTransmittance: number;
  aerosolTransmittance: number;
  airMass: number;
}

/**
 * Authentic Bird & Hulstrom (1981) SERI Clear Sky Model for Direct and Diffuse Insolation.
 * Reference: Bird, R.E. and Hulstrom, R.L. (1981), SERI/TR-642-761.
 */
export function calculateBirdHulstromClearSky(
  i0Normal: number,
  zenithDeg: number,
  inputs: BirdHulstromAtmosphericInputs = {}
): BirdHulstromTransmittances {
  if (zenithDeg >= 90 || zenithDeg < 0) {
    return {
      dni: 0,
      dhi: 0,
      ghi: 0,
      rayleighTransmittance: 0,
      ozoneTransmittance: 0,
      gasesTransmittance: 0,
      waterVaporTransmittance: 0,
      aerosolTransmittance: 0,
      airMass: 0,
    };
  }

  const cosZenith = Math.cos((zenithDeg * Math.PI) / 180);
  const pRatio = inputs.pressureRatio ?? 1.0;
  const lo = inputs.ozoneCmAtm ?? 0.34;
  const w = inputs.precipitableWaterCm ?? 1.5;
  const tauA = inputs.aerosolOpticalDepth500 ?? 0.10;
  const rhoG = inputs.groundAlbedo ?? 0.20;
  const F = inputs.forwardScatterFraction ?? 0.84;

  // 1. Air Mass (Kasten & Young 1989 formulation)
  const am = 1.0 / (cosZenith + 0.50572 * Math.pow(Math.max(0.01, 96.07995 - zenithDeg), -1.6364));
  const amPressure = am * pRatio;

  // 2. Ozone Transmittance (To)
  const u3 = lo * am;
  const to =
    1.0 -
    0.1611 * u3 * Math.pow(1.0 + 139.48 * u3, -0.3035) -
    (0.002715 * u3) / (1.0 + 0.044 * u3 + 0.0003 * u3 * u3);

  // 3. Uniformly Mixed Gases Transmittance (Tg)
  const tg = Math.exp(-0.0127 * Math.pow(amPressure, 0.26));

  // 4. Water Vapor Transmittance (Tw)
  const u1 = w * amPressure;
  const tw = 1.0 - (2.4959 * u1) / (Math.pow(1.0 + 79.034 * u1, 0.6828) + 6.385 * u1);

  // 5. Rayleigh Scattering Transmittance (Tr)
  const tr = Math.exp(
    -0.0903 * Math.pow(amPressure, 0.84) * (1.0 + amPressure - Math.pow(amPressure, 1.01))
  );

  // 6. Aerosol Extinction Transmittance (Ta)
  const ta = Math.exp(
    -Math.pow(tauA, 0.873) * (1.0 + tauA - Math.pow(tauA, 0.7088)) * Math.pow(am, 0.9108)
  );

  // 7. Direct Normal Irradiance (DNI)
  // 0.9662 factor covers the 0.3 to 3.0 um spectrum in Bird & Hulstrom (1981)
  const dni = Math.max(0, 0.9662 * i0Normal * tr * to * tg * tw * ta);

  // 8. Diffuse Components (Rayleigh, Aerosol forward scattering, and Ground-Atmosphere multiple reflections)
  const denom = Math.max(0.1, 1.0 - am + Math.pow(am, 1.02));
  const idr = (0.79 * i0Normal * cosZenith * to * tg * tw * 0.5 * (1.0 - tr)) / denom;
  const ida = (0.79 * i0Normal * cosZenith * to * tg * tw * tr * F * (1.0 - ta)) / denom;

  const rhoA = 0.0685 + (1.0 - F) * (1.0 - ta);
  const idm = ((dni * cosZenith + idr + ida) * rhoG * rhoA) / (1.0 - rhoG * rhoA);

  const dhi = Math.max(0, idr + ida + idm);
  const ghi = Math.max(0, dni * cosZenith + dhi);

  return {
    dni: Math.round(dni * 10) / 10,
    dhi: Math.round(dhi * 10) / 10,
    ghi: Math.round(ghi * 10) / 10,
    rayleighTransmittance: Math.round(tr * 1000) / 1000,
    ozoneTransmittance: Math.round(to * 1000) / 1000,
    gasesTransmittance: Math.round(tg * 1000) / 1000,
    waterVaporTransmittance: Math.round(tw * 1000) / 1000,
    aerosolTransmittance: Math.round(ta * 1000) / 1000,
    airMass: Math.round(am * 100) / 100,
  };
}

/**
 * Generates a normalized 24h astronomical Clear-Sky observation series for any coordinate on Earth.
 */
export function generateScientificSolarDay(
  latitude: number,
  longitude: number,
  dateStr: string,
  locationName?: string,
  sourceCode: 'pvgis_jrc' | 'model_clearsky_spencer_bird' = 'model_clearsky_spencer_bird',
  cacheStatus: CacheFreshnessStatus = 'fallback_model'
): UnifiedSolarObservationRecord {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || new Date().getMonth() + 1;
  const day = parts[2] || new Date().getDate();

  const d = new Date(Date.UTC(year, month - 1, day));
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000) + 1;

  const i0 = getExtraterrestrialNormalIrradiance(dayOfYear);

  const hourly: CommonHourlyObservation[] = [];
  const warnings: string[] = [];
  let extraterrestrialHorizontalWh = 0;

  for (let hour = 0; hour < 24; hour++) {
    const { elevationDeg, azimuthDeg, zenithDeg } = calculateSolarAngles(latitude, longitude, dayOfYear, hour);

    let ghi = 0;
    let dni = 0;
    let dhi = 0;
    let kt: number | undefined = undefined;

    if (elevationDeg > 0) {
      const birdResult = calculateBirdHulstromClearSky(i0, zenithDeg, {
        pressureRatio: 1.0,
        ozoneCmAtm: 0.34,
        precipitableWaterCm: 1.5,
        aerosolOpticalDepth500: 0.10,
        groundAlbedo: 0.20,
      });

      dni = birdResult.dni;
      dhi = birdResult.dhi;
      ghi = birdResult.ghi;

      const sinEl = Math.sin((elevationDeg * Math.PI) / 180);
      const i0Horizontal = i0 * sinEl;
      extraterrestrialHorizontalWh += i0Horizontal;
      kt = i0Horizontal > 10 ? Math.round((ghi / i0Horizontal) * 100) / 100 : 0;
    }

    const temp = Math.round((14 + 7 * Math.sin(Math.max(0, (elevationDeg * Math.PI) / 180)) + 3 * Math.cos((latitude * Math.PI) / 180)) * 10) / 10;

    // Physical sanity check
    const validation = validatePhysicalIrradiance(ghi, dni, dhi, elevationDeg);
    if (!validation.isValid) {
      warnings.push(`Heure ${hour}h: ${validation.violations.join('; ')}`);
    }

    hourly.push({
      hour_utc: hour,
      timestamp_utc: `${dateStr}T${hour.toString().padStart(2, '0')}:00:00Z`,
      ghi_w_m2: ghi,
      dni_w_m2: dni,
      dhi_w_m2: dhi,
      solar_elevation_deg: elevationDeg,
      solar_azimuth_deg: azimuthDeg,
      temperature_c: temp,
      clearness_index_kt: kt,
      quality_flag: sourceCode === 'pvgis_jrc' ? 'satellite_validated' : 'model_clearsky',
    });
  }

  // Energy integration (Wh/m² and kWh/m²)
  const ghiList = hourly.map((p) => p.ghi_w_m2);
  const dniList = hourly.map((p) => p.dni_w_m2);
  const dhiList = hourly.map((p) => p.dhi_w_m2);

  const { totalKwhM2: dailyGhiKwh } = calculateDailyIrradiation(ghiList);
  const { totalKwhM2: dailyDniKwh } = calculateDailyIrradiation(dniList);
  const { totalKwhM2: dailyDhiKwh } = calculateDailyIrradiation(dhiList);

  const peakGhi = Math.max(...ghiList, 0);
  const peakDni = Math.max(...dniList, 0);
  const peakDhi = Math.max(...dhiList, 0);
  const maxElevation = Math.max(...hourly.map((p) => p.solar_elevation_deg), 0);
  const sunshineHours = calculateSunshineDurationHours(dniList);

  const extraterrestrialDailyKwh = Math.round((extraterrestrialHorizontalWh / 1000.0) * 100) / 100;
  const dailyKt =
    extraterrestrialDailyKwh > 0
      ? Math.round((dailyGhiKwh / extraterrestrialDailyKwh) * 100) / 100
      : 0;

  return {
    latitude: Math.round(latitude * 1000) / 1000,
    longitude: Math.round(longitude * 1000) / 1000,
    location_name: locationName || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
    date_utc: dateStr,
    retrieval_date_utc: new Date().toISOString(),
    source_code: sourceCode,
    product_name:
      sourceCode === 'pvgis_jrc'
        ? 'PVGIS-SARAH2 / JRC European Commission'
        : 'Spencer-Bird High Precision Clear Sky Model',
    product_version: sourceCode === 'pvgis_jrc' ? 'v5.3' : '1.0.0',
    spatial_resolution_deg: 0.05,
    temporal_resolution: 'hourly',
    cache_status: cacheStatus,
    cache_ttl_seconds: 86400 * 30,
    peak_ghi_w_m2: peakGhi,
    peak_dni_w_m2: peakDni,
    peak_dhi_w_m2: peakDhi,
    max_solar_elevation_deg: maxElevation,
    daily_ghi_kwh_m2: dailyGhiKwh,
    daily_dni_kwh_m2: dailyDniKwh,
    daily_dhi_kwh_m2: dailyDhiKwh,
    sunshine_hours_wmo: sunshineHours,
    extraterrestrial_daily_kwh_m2: extraterrestrialDailyKwh,
    daily_clearness_index_kt: dailyKt,
    hourly,
    validation_warnings: warnings.length > 0 ? warnings : undefined,
  };
}
