import { HealthResponse, InfoResponse, HourlyRadiationResponse } from '../types';
import { calculateClientSolar24h } from './solarCalculator';

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
      database: 'SQLite 3 locale (connectée)',
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
      description: 'Solar Earth V0.2 — Mesure et visualisation du rayonnement solaire sur smartphone avec intégration PVGIS et base locale SQLite',
      database_type: 'SQLite 3 (Embarquée Mobile / Hors-ligne)',
      roadmap: [
        'V0.1: Architecture & database foundation (Complété)',
        'V0.2: PVGIS integration (GHI, DNI, DHI, séries 24h & cache) (Actif)',
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
          supported_parameters: ['GHI (W/m²)', 'DNI (W/m²)', 'DHI (W/m²)', 'Elevation (°)', 'Azimuth (°)', 'T2m (°C)'],
          description: 'European Commission JRC service for solar radiation, hourly irradiance (GHI, DNI, DHI), and typical meteorological years.',
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

export async function fetchHourlyRadiation(
  latitude: number,
  longitude: number,
  dateStr?: string,
  locationName?: string
): Promise<HourlyRadiationResponse> {
  const targetDate = dateStr || new Date().toISOString().split('T')[0];

  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      date: targetDate,
    });
    const res = await fetch(`${API_BASE}/radiation/hourly?${params.toString()}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (locationName && !data.location_name) {
      data.location_name = locationName;
    }
    return data;
  } catch {
    // Offline / Standalone mobile PWA calculation using solar physics engine
    return calculateClientSolar24h(latitude, longitude, targetDate, locationName);
  }
}
