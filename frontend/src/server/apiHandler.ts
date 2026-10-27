/**
 * Unified Server API Handler for Solar Earth.
 * Shared across Vite dev server, Vite preview server, production Express server, and unit tests.
 * Enforces strict scientific provenance, calendar bounds, and non-falsified health status.
 */

import fs from 'fs';
import path from 'path';
import {
  probePvgisStatus,
  queryPvgisSeries,
  PVGIS_MIN_YEAR,
  PVGIS_MAX_YEAR,
  PvgisProbeResult,
  FetchFunction,
} from '../services/pvgisService';
import {
  isStrictNumericCoordinate,
  validateDateString,
} from '../services/solarCalculator';

export interface HandleApiRequestOptions {
  rootDir?: string;
  fetcher?: FetchFunction;
}

export async function handleApiRequest(
  url: string,
  options: HandleApiRequestOptions = {}
): Promise<{ statusCode: number; headers: Record<string, string>; body: string } | null> {
  const rootDir = options.rootDir || process.cwd();
  const fetcher = options.fetcher || fetch;
  const urlObj = new URL(url, 'http://localhost:3000');
  const pathname = urlObj.pathname;

  // 1. /api/v1/health
  if (pathname === '/api/v1/health') {
    const dbPath = path.resolve(rootDir, 'solar_earth.db');
    let directoryWritable = false;
    let databaseExists = false;
    let databaseOpenable = false;
    let databaseReadable = false;

    try {
      fs.accessSync(rootDir, fs.constants.W_OK);
      directoryWritable = true;
    } catch {
      directoryWritable = false;
    }

    databaseExists = fs.existsSync(dbPath);

    if (databaseExists) {
      try {
        const fd = fs.openSync(dbPath, 'r');
        databaseOpenable = true;
        const buffer = Buffer.alloc(16);
        const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);
        if (bytesRead >= 16 && buffer.toString('utf8', 0, 15) === 'SQLite format 3') {
          databaseReadable = true;
        }
      } catch {
        databaseOpenable = false;
        databaseReadable = false;
      }
    }

    const databaseVerified = databaseExists && databaseOpenable && databaseReadable;
    const probe: PvgisProbeResult = await probePvgisStatus(fetcher, 2500);

    const overallStatus = directoryWritable && probe.is_functional ? 'ok' : 'degraded';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        status: overallStatus,
        service: 'solar-earth-api',
        version: '0.2.0',
        timestamp: new Date().toISOString(),
        architecture: {
          client_pwa_runtime: 'Navigateur Smartphone (IndexedDB SolarEarth_MobileDB)',
          server_dev_runtime: 'Station de calcul locale (Node.js / Python FastAPI)',
        },
        storage: {
          client_browser_storage: {
            type: 'indexeddb',
            name: 'SolarEarth_MobileDB',
            execution: 'client_in_browser',
            description: 'Stockage opérationnel sur smartphone / PWA',
          },
          server_sqlite: {
            directory_writable: directoryWritable,
            database_exists: databaseExists,
            database_openable: databaseOpenable,
            database_readable: databaseReadable,
            database_verified: databaseVerified,
            file_path: 'solar_earth.db',
            description: databaseVerified
              ? 'Fichier SQLite 3 local vérifié, accessible et en-tête valide'
              : databaseExists
              ? 'Fichier SQLite 3 présent mais non ouvrable ou corrompu'
              : 'Fichier SQLite 3 absent (répertoire accessible en écriture)',
          },
        },
        database: {
          backend: 'sqlite_backend_optional',
          directory_writable: directoryWritable,
          database_exists: databaseExists,
          database_openable: databaseOpenable,
          database_readable: databaseReadable,
          database_verified: databaseVerified,
        },
        database_verified: databaseVerified,
        pvgis: {
          functional_status: probe.status,
          is_available: probe.is_functional,
          operational: probe.is_functional,
          http_code: probe.http_code,
          latency_ms: probe.latency_ms,
        },
        pvgis_provider: {
          status: probe.status,
          operational: probe.is_functional,
          latency_ms: probe.latency_ms,
          last_checked_utc: probe.last_checked_utc,
          supported_years_range: probe.supported_years_range,
          detail: probe.detail,
        },
        components: {
          storage_subsystem: databaseVerified ? 'sqlite3_local_file' : 'browser_indexeddb_local',
          solar_physics_engine: 'Spencer (1971) & Bird & Hulstrom (1981) SERI Model (Opérationnel)',
          pvgis_provider: probe.is_functional
            ? `available (API JRC PVGIS v5.3 opérationnelle, ${probe.latency_ms}ms)`
            : `unavailable (${probe.status}: ${probe.detail} — repli local actif)`,
        },
      }),
    };
  }

  // 2. /api/v1/info
  if (pathname === '/api/v1/info') {
    const probe = await probePvgisStatus(fetcher, 2500);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({
        name: 'Solar Earth',
        version: '0.2.0',
        environment: 'development',
        description:
          'Solar Earth V0.2 — Modèle scientifique unifié du rayonnement solaire sur smartphone avec base locale IndexedDB & SQLite',
        database_type: 'IndexedDB & SQLite Local (Sur smartphone, zéro port réseau)',
        roadmap: [
          'V0.1: Architecture & database foundation (Complété)',
          'V0.2: PVGIS integration (GHI, DNI, DHI, séries 24h & cache maîtrisé) (Actif)',
          'V0.3: NASA POWER integration (Worldwide solar & meteorology) (En cours)',
          'V0.4: NOAA SWPC integration (F10.7, Kp, Dst, flares) (Prévu)',
          'V0.5: Solar Earth application indices (Clear Sky, SRI, SAI, GAI) (Prévu)',
          'V0.6: Interactive global map & time slider (Prévu)',
          'V0.7: EUMETSAT satellite validation products (Prévu)',
        ],
        providers: {
          pvgis: {
            code: 'pvgis',
            name: 'PVGIS (Photovoltaic Geographical Information System)',
            state: probe.is_functional ? 'available' : 'unavailable',
            available: probe.is_functional,
            operational_status: probe.status,
            base_url: 'https://re.jrc.ec.europa.eu/api/v5_3/',
            target_version: 'V0.2',
            is_active_in_v0_1: true,
            supported_years_range: [PVGIS_MIN_YEAR, PVGIS_MAX_YEAR],
            diagnostics: {
              probe_status: probe.status,
              is_functional: probe.is_functional,
              http_code: probe.http_code,
              latency_ms: probe.latency_ms,
              detail: probe.detail,
              last_checked_utc: probe.last_checked_utc,
            },
            supported_operations: {
              current: false,
              hourly: true,
              daily: true,
              historical: true,
            },
            supported_parameters: [
              'GHI (Global Horizontal Irradiance, W/m²)',
              'DNI (Direct Normal Irradiance, W/m²)',
              'DHI (Diffuse Horizontal Irradiance, W/m²)',
              'Solar Elevation (°)',
              'Solar Azimuth (°)',
              '2m Air Temperature (°C) from ERA5 reanalysis',
            ],
            description:
              'European Commission JRC service for solar radiation, hourly irradiance (GHI, DNI, DHI), and typical meteorological years.',
          },
          nasa_power: {
            code: 'nasa_power',
            name: 'NASA POWER (Prediction of Worldwide Energy Resources)',
            state: 'unavailable',
            base_url: 'https://power.larc.nasa.gov/api/',
            target_version: 'V0.3',
            is_active_in_v0_1: false,
            supported_operations: { current: false, hourly: true, daily: true, historical: true },
            supported_parameters: ['ALLSKY_SFC_SW_DWN', 'CLRSKY_SFC_SW_DWN', 'T2M', 'RH2M'],
            description: 'Couverture mondiale multi-décennale NASA pour validation croisée (V0.3).',
          },
          noaa_swpc: {
            code: 'noaa_swpc',
            name: 'NOAA Space Weather Prediction Center (Météo spatiale & Activité solaire)',
            state: 'unavailable',
            base_url: 'https://services.swpc.noaa.gov/',
            target_version: 'V0.4',
            is_active_in_v0_1: false,
            supported_operations: { current: true, hourly: true, daily: true, historical: true },
            supported_parameters: ['F10.7 Solar Flux', 'Planetary K-index (Kp)', 'Dst Index', 'Solar Flares'],
            description:
              'Météo spatiale et géomagnétisme (ne constitue pas une mesure directe du GHI de surface). Prévu en source d’activité solaire (V0.4).',
          },
          eumetsat: {
            code: 'eumetsat',
            name: 'EUMETSAT (European Meteorological Satellites)',
            state: 'unavailable',
            base_url: 'https://data.eumetsat.int/',
            target_version: 'V0.7',
            is_active_in_v0_1: false,
            supported_operations: { current: true, hourly: true, daily: true, historical: true },
            supported_parameters: ['SIS Radiation (W/m²)', 'SID Radiation (W/m²)', 'Effective Cloud Albedo'],
            description: 'Données satellitaires géostationnaires européennes pour inter-comparaison (V0.7).',
          },
        },
      }),
    };
  }

  // 3. /api/v1/radiation/hourly
  if (pathname === '/api/v1/radiation/hourly') {
    const latStr = urlObj.searchParams.get('latitude') || urlObj.searchParams.get('lat') || '48.836';
    const lonStr = urlObj.searchParams.get('longitude') || urlObj.searchParams.get('lon') || '2.336';

    // Strict numeric coordinate validation (rejects trailing letters like "48.8abc", empty, NaN)
    if (!isStrictNumericCoordinate(latStr) || !isStrictNumericCoordinate(lonStr)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'invalid_coordinates',
          message:
            'Coordonnées invalides : doivent être des valeurs numériques décimales strictes (ex: 48.8566). Caractères alphabétiques ou formats non numériques rejetés.',
        }),
      };
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'invalid_coordinates',
          message: 'Latitude doit être comprise entre -90.0 et 90.0, et Longitude entre -180.0 et 180.0 (WGS84).',
        }),
      };
    }

    const dateStr = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const dateValidation = validateDateString(dateStr);
    if (!dateValidation.valid) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'invalid_date_format',
          message: dateValidation.error || 'Format de date invalide. Format attendu : AAAA-MM-JJ.',
        }),
      };
    }

    const data = await queryPvgisSeries(lat, lon, dateStr, fetcher, 3500);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify(data),
    };
  }

  return null;
}
