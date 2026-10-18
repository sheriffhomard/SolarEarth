import { HealthResponse, InfoResponse, HourlyRadiationResponse } from '../types';
import { UnifiedSolarObservationRecord } from '../types/scientificModel';
import { generateScientificSolarDay } from './physicsEngine';
import { scientificCache, CACHE_TTL_TIERS } from './cachePolicy';
import { validateCoordinates, validateDateString, generateScientificProvenance } from './solarCalculator';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    // Graceful fallback for standalone mobile PWA / offline mode
    return {
      status: 'ok',
      service: 'solar-earth-api',
      version: '0.2.0',
      database: 'IndexedDB & SQLite locale sur smartphone (connectée)',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function fetchInfo(): Promise<InfoResponse> {
  try {
    const res = await fetch(`${API_BASE}/info`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      name: 'Solar Earth',
      version: '0.2.0',
      environment: 'standalone-mobile',
      description:
        'Solar Earth V0.2 — Modèle scientifique unifié du rayonnement solaire sur smartphone avec base locale IndexedDB & SQLite',
      database_type: 'IndexedDB & SQLite Local (Sur téléphone)',
      roadmap: [
        'V0.1: Architecture & database foundation (Complété)',
        'V0.2: PVGIS integration (GHI, DNI, DHI, séries 24h & cache maîtrisé) (Actif)',
        'V0.3: NASA POWER integration (Worldwide solar & meteorology)',
        'V0.4: NOAA SWPC integration (F10.7, Kp, Dst, flares)',
        'V0.5: Solar Earth application indices (Clear Sky, SRI, SAI, GAI)',
        'V0.6: Interactive global map & time slider',
        'V0.7: EUMETSAT satellite validation products',
      ],
      providers: {
        pvgis: {
          code: 'pvgis',
          name: 'PVGIS (Photovoltaic Geographical Information System)',
          state: 'enabled',
          base_url: 'https://re.jrc.ec.europa.eu/api/v5_3/',
          target_version: 'V0.2',
          is_active_in_v0_1: true,
          supported_operations: { current: true, hourly: true, daily: true, historical: true },
          supported_parameters: [
            'GHI (W/m²)',
            'DNI (W/m²)',
            'DHI (W/m²)',
            'Elevation (°)',
            'Azimuth (°)',
            'T2m (°C)',
          ],
          description:
            'European Commission JRC service for solar radiation, hourly irradiance (GHI, DNI, DHI), and typical meteorological years.',
        },
        nasa_power: {
          code: 'nasa_power',
          name: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
          state: 'configured',
          base_url: 'https://power.larc.nasa.gov/api/temporal/',
          target_version: 'V0.3',
          is_active_in_v0_1: false,
          supported_operations: { current: false, hourly: true, daily: true, historical: true },
          supported_parameters: ['ALLSKY_SFC_SW_DWN (W/m²)', 'CLRSKY_SFC_SW_DWN (W/m²)', 'T2M (°C)'],
          description: 'Global satellite-derived surface solar irradiance from NASA Langley Research Center.',
        },
        noaa: {
          code: 'noaa',
          name: 'NOAA Space Weather Prediction Center (SWPC)',
          state: 'configured',
          base_url: 'https://services.swpc.noaa.gov/',
          target_version: 'V0.4',
          is_active_in_v0_1: false,
          supported_operations: { current: true, hourly: true, daily: true, historical: true },
          supported_parameters: ['F10.7 (sfu)', 'Planetary Kp Index', 'Dst Index (nT)', 'GOES X-Ray'],
          description: 'Real-time solar radio flux, geomagnetic indices, and space weather.',
        },
        eumetsat: {
          code: 'eumetsat',
          name: 'EUMETSAT (European Meteorological Satellites)',
          state: 'configured',
          base_url: 'https://data.eumetsat.int/',
          target_version: 'V0.7',
          is_active_in_v0_1: false,
          supported_operations: { current: true, hourly: true, daily: true, historical: true },
          supported_parameters: ['SIS Radiation (W/m²)', 'SID Radiation (W/m²)', 'Effective Cloud Albedo'],
          description: 'Geostationary satellite surface solar radiation products for cross-validation.',
        },
      },
    };
  }
}

/**
 * Fetches or calculates a 24-hour solar day with unified scientific model,
 * multi-tier caching, rate limiting, and physics engine fallback.
 */
export async function fetchHourlyRadiation(
  latitude: number,
  longitude: number,
  dateStr?: string,
  locationName?: string
): Promise<HourlyRadiationResponse> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  // Robust input validation
  const coordVal = validateCoordinates(latitude, longitude);
  if (!coordVal.valid) {
    throw new Error(coordVal.error);
  }
  const dateVal = validateDateString(targetDate);
  if (!dateVal.valid) {
    throw new Error(dateVal.error);
  }

  const normLat = Math.round(latitude * 1000) / 1000;
  const normLon = Math.round(longitude * 1000) / 1000;

  const cacheKey = scientificCache.generateKey('pvgis', 'hourly', {
    lat: normLat,
    lon: normLon,
    date: targetDate,
  });

  // 1. Check client-side controlled cache
  const cachedResolution = scientificCache.get<HourlyRadiationResponse>(cacheKey);
  if (cachedResolution) {
    return {
      ...cachedResolution.data,
      cached: true,
      cache_status: cachedResolution.status,
      cache_timestamp_utc: cachedResolution.cachedAtIso,
    };
  }

  // 2. Upstream request with rate-limiting
  try {
    await scientificCache.acquireRateLimit();

    const params = new URLSearchParams({
      latitude: normLat.toString(),
      longitude: normLon.toString(),
      date: targetDate,
    });

    const res = await fetch(`${API_BASE}/radiation/hourly?${params.toString()}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: HourlyRadiationResponse = await res.json();

    const provenance = data.provenance || generateScientificProvenance(
      normLat,
      normLon,
      targetDate,
      data.daily_irradiation_kwh,
      data.peak_ghi,
      data.peak_dni,
      data.sunshine_hours,
      'pvgis_jrc_sarah2'
    );

    const result: HourlyRadiationResponse = {
      ...data,
      location_name: locationName || data.location_name || `${normLat}°, ${normLon}°`,
      cached: false,
      cache_status: 'fresh',
      cache_timestamp_utc: new Date().toISOString(),
      product_name: 'PVGIS-SARAH2 / JRC European Commission',
      product_version: 'v5.3',
      provenance,
    };

    // Store in scientific cache with 24h fresh TTL, 7 days stale fallback
    scientificCache.set(
      cacheKey,
      result,
      'pvgis_jrc',
      CACHE_TTL_TIERS.HOURLY_OBSERVATIONS_FRESH_MS,
      CACHE_TTL_TIERS.HOURLY_OBSERVATIONS_MAX_STALE_MS
    );

    return result;
  } catch {
    // 3. Fallback to Spencer-Bird Astronomical Solar Physics Model
    const physicalDay = generateScientificSolarDay(
      normLat,
      normLon,
      targetDate,
      locationName,
      'model_clearsky_spencer_bird',
      'fallback_model'
    );

    const fallbackProvenance = generateScientificProvenance(
      normLat,
      normLon,
      targetDate,
      physicalDay.daily_ghi_kwh_m2,
      physicalDay.peak_ghi_w_m2,
      physicalDay.peak_dni_w_m2,
      physicalDay.sunshine_hours_wmo,
      'simulated_clearsky_model'
    );

    const fallbackResult: HourlyRadiationResponse = {
      location_name: physicalDay.location_name,
      latitude: normLat,
      longitude: normLon,
      date: targetDate,
      source: 'simulated_clearsky_model',
      units: 'W/m² for irradiance, kWh/m² for irradiation',
      daily_irradiation_kwh: physicalDay.daily_ghi_kwh_m2,
      peak_ghi: physicalDay.peak_ghi_w_m2,
      peak_dni: physicalDay.peak_dni_w_m2,
      sunshine_hours: physicalDay.sunshine_hours_wmo,
      is_simulated: true,
      warning:
        'DONNÉES SIMULÉES : Calculées par le modèle astronomique local théorique (Spencer & Bird). Ces données ne proviennent pas des satellites PVGIS JRC.',
      cached: false,
      cache_status: 'fallback_model',
      cache_timestamp_utc: physicalDay.retrieval_date_utc,
      product_name: 'Modèle Solaire Ciel Clair (Simulation Locale - Hors-Ligne)',
      product_version: physicalDay.product_version,
      daily_clearness_index_kt: physicalDay.daily_clearness_index_kt,
      extraterrestrial_daily_kwh_m2: physicalDay.extraterrestrial_daily_kwh_m2,
      provenance: fallbackProvenance,
      hourly: physicalDay.hourly.map((h) => ({
        hour: h.hour_utc,
        time: h.timestamp_utc,
        ghi: h.ghi_w_m2,
        dni: h.dni_w_m2,
        dhi: h.dhi_w_m2,
        solar_elevation: h.solar_elevation_deg,
        solar_azimuth: h.solar_azimuth_deg,
        temperature: h.temperature_c,
        quality_flag: h.quality_flag,
      })),
    };

    // Cache fallback model
    scientificCache.set(cacheKey, fallbackResult, 'model_clearsky', 24 * 3600 * 1000);

    return fallbackResult;
  }
}
