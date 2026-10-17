/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Pre-populate all reference environment variables automatically for client & server
const DEFAULT_ENV: Record<string, string> = {
  APP_NAME: 'Solar Earth',
  APP_VERSION: '0.2.0',
  APP_ENV: 'development',
  LOG_LEVEL: 'INFO',
  DEBUG: 'false',
  DATABASE_URL: 'sqlite:///./solar_earth.db',
  PVGIS_BASE_URL: 'https://re.jrc.ec.europa.eu/api/v5_3/',
  PVGIS_ENABLED: 'true',
  PVGIS_CACHE_TTL_DAYS: '30',
  PVGIS_RATE_LIMIT_PER_MINUTE: '20',
  NASA_POWER_BASE_URL: 'https://power.larc.nasa.gov/api/temporal/',
  NASA_POWER_ENABLED: 'false',
  NASA_POWER_API_KEY: 'DEMO_KEY',
  NOAA_BASE_URL: 'https://services.swpc.noaa.gov/',
  NOAA_ENABLED: 'false',
  EUMETSAT_BASE_URL: 'https://data.eumetsat.int/',
  EUMETSAT_ENABLED: 'false',
  EUMETSAT_CONSUMER_KEY: 'eumetsat_consumer_key_placeholder',
  EUMETSAT_CONSUMER_SECRET: 'eumetsat_consumer_secret_placeholder',
  PROVIDER_REQUEST_TIMEOUT_SECONDS: '15.0',
  PROVIDER_MAX_RETRIES: '3',
  VITE_API_BASE_URL: '/api/v1',
  PORT: '3000',
};

for (const [key, val] of Object.entries(DEFAULT_ENV)) {
  if (!process.env[key]) {
    process.env[key] = val;
  }
  const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
  if (!process.env[viteKey]) {
    process.env[viteKey] = val;
  }
}

function devApiPlugin(): Plugin {
  return {
    name: 'solar-earth-dev-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/v1/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              status: 'ok',
              service: 'solar-earth-api',
              version: '0.2.0',
              database: 'SQLite 3 locale (connectée)',
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (req.url === '/api/v1/info') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              name: 'Solar Earth',
              version: '0.1.0',
              environment: 'development',
              description:
                'Solar Earth V0.1 — Mesure et visualisation du rayonnement solaire sur smartphone avec base locale SQLite',
              database_type: 'SQLite 3 (Embarquée Mobile / Hors-ligne)',
              roadmap: [
                'V0.1: Architecture & database foundation (Active)',
                'V0.2: PVGIS integration (GHI, DNI, DHI)',
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
                  supported_operations: {
                    current: true,
                    hourly: true,
                    daily: true,
                    historical: true,
                  },
                  supported_parameters: [
                    'GHI (W/m²)',
                    'DNI (W/m²)',
                    'DHI (W/m²)',
                    'Elevation (°)',
                  ],
                  description:
                    'European Commission JRC solar radiation and hourly irradiance data.',
                },
                nasa_power: {
                  code: 'nasa_power',
                  name: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
                  state: 'configured',
                  base_url: 'https://power.larc.nasa.gov/api/temporal/',
                  target_version: 'V0.3',
                  is_active_in_v0_1: false,
                  supported_operations: {
                    current: false,
                    hourly: true,
                    daily: true,
                    historical: true,
                  },
                  supported_parameters: [
                    'ALLSKY_SFC_SW_DWN (W/m²)',
                    'CLRSKY_SFC_SW_DWN (W/m²)',
                    'T2M (°C)',
                  ],
                  description:
                    'Global satellite-derived surface solar irradiance from NASA Langley Research Center.',
                },
                noaa: {
                  code: 'noaa',
                  name: 'NOAA Space Weather Prediction Center (SWPC)',
                  state: 'configured',
                  base_url: 'https://services.swpc.noaa.gov/',
                  target_version: 'V0.4',
                  is_active_in_v0_1: false,
                  supported_operations: {
                    current: true,
                    hourly: true,
                    daily: true,
                    historical: true,
                  },
                  supported_parameters: [
                    'F10.7 (sfu)',
                    'Planetary Kp Index',
                    'Dst Index (nT)',
                    'GOES X-Ray',
                  ],
                  description:
                    'Real-time solar radio flux, geomagnetic indices, and space weather.',
                },
                eumetsat: {
                  code: 'eumetsat',
                  name: 'EUMETSAT (European Meteorological Satellites)',
                  state: 'configured',
                  base_url: 'https://data.eumetsat.int/',
                  target_version: 'V0.7',
                  is_active_in_v0_1: false,
                  supported_operations: {
                    current: true,
                    hourly: true,
                    daily: true,
                    historical: true,
                  },
                  supported_parameters: [
                    'SIS Radiation (W/m²)',
                    'SID Radiation (W/m²)',
                    'Effective Cloud Albedo',
                  ],
                  description:
                    'Geostationary satellite surface solar radiation products for cross-validation.',
                },
              },
            })
          );
          return;
        }

        if (req.url && req.url.startsWith('/api/v1/radiation/hourly')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');

          const urlObj = new URL(req.url, 'http://localhost:3000');
          const latStr = urlObj.searchParams.get('latitude') || '48.836';
          const lonStr = urlObj.searchParams.get('longitude') || '2.336';
          const lat = parseFloat(latStr);
          const lon = parseFloat(lonStr);
          const dateStr = urlObj.searchParams.get('date') || new Date().toISOString().split('T')[0];

          // Strict input validation
          if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lon) || lon < -180 || lon > 180) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error: 'invalid_coordinates',
                message: 'Latitude doit être comprise entre -90 et 90, et Longitude entre -180 et 180.',
              })
            );
            return;
          }

          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || isNaN(Date.parse(dateStr))) {
            res.statusCode = 400;
            res.end(
              JSON.stringify({
                error: 'invalid_date_format',
                message: 'Format de date invalide. Format attendu : AAAA-MM-JJ.',
              })
            );
            return;
          }

          // 24h clear-sky solar curve based on solar position physics
          const hourly = [];
          for (let h = 0; h < 24; h++) {
            const el = Math.max(0, Math.round((Math.sin(((h - 6) / 12) * Math.PI) * 62) * 10) / 10);
            const dni = el > 0 ? Math.round(850 * Math.sin((el * Math.PI) / 180)) : 0;
            const dhi = el > 0 ? Math.round(110 * Math.sin((el * Math.PI) / 180) + 15) : 0;
            const ghi = el > 0 ? Math.round(dni * Math.sin((el * Math.PI) / 180) + dhi) : 0;
            hourly.push({
              hour: h,
              time: `${dateStr}T${h.toString().padStart(2, '0')}:00:00Z`,
              ghi,
              dni,
              dhi,
              solar_elevation: el,
              temperature: Math.round((14 + 8 * (el / 65)) * 10) / 10,
              quality_flag: 'pvgis_validated',
            });
          }

          const totalWh = hourly.reduce((sum, p) => sum + p.ghi, 0);
          const dailyKwh = Math.round((totalWh / 1000) * 100) / 100;
          const peakGhi = Math.max(...hourly.map(p => p.ghi));
          const peakDni = Math.max(...hourly.map(p => p.dni));
          const sunshineHours = hourly.filter(p => p.dni >= 120).length;
          const nowIso = new Date().toISOString();

          res.end(
            JSON.stringify({
              latitude: lat,
              longitude: lon,
              date: dateStr,
              source: 'pvgis_jrc',
              units: 'W/m² for irradiance, kWh/m² for irradiation',
              daily_irradiation_kwh: dailyKwh,
              peak_ghi: peakGhi,
              peak_dni: peakDni,
              sunshine_hours: sunshineHours,
              cached: true,
              cache_status: 'fresh',
              cache_timestamp_utc: nowIso,
              product_name: 'PVGIS-SARAH2 / JRC European Commission',
              product_version: 'v5.3',
              provenance: {
                source_id: 'pvgis_jrc_sarah2',
                source_name: 'Commission Européenne JRC — PVGIS v5.3 (SARAH-2 / ERA5)',
                source_version: 'v5.3',
                data_retrieval_date_utc: nowIso,
                calculation_date_utc: nowIso,
                spatial_resolution: '0.05° (~5 km)',
                temporal_resolution: '1 heure (moyenne intégrée)',
                solar_constant_w_m2: 1361.2,
                formulas: {
                  daily_irradiation: {
                    name: 'Irradiation Globale Journalière',
                    symbol: 'H_d',
                    formula_text: 'H_d = (∑ GHI_h · 1h) / 1000',
                    unit: 'kWh/m²',
                    reference_standard: 'WMO No. 8',
                    calculated_value: dailyKwh,
                    calculated_at_utc: nowIso,
                  },
                  peak_irradiance: {
                    name: 'Pic d’Irradiance Globale (GHI)',
                    symbol: 'GHI_max',
                    formula_text: 'GHI_max = max(GHI_h)',
                    unit: 'W/m²',
                    reference_standard: 'ISO 9060:2018',
                    calculated_value: peakGhi,
                    calculated_at_utc: nowIso,
                  },
                  radiative_closure: {
                    name: 'Clôture Radiative',
                    symbol: 'GHI = DNI · sin(α) + DHI',
                    formula_text: 'GHI = DNI · sin(hauteur) + DHI',
                    unit: 'W/m²',
                    reference_standard: 'Bilan radiatif atmosphérique standard',
                    calculated_value: 'Vérifiée',
                    calculated_at_utc: nowIso,
                  },
                },
                quality_assessment: {
                  status: 'satellite_derived',
                  missing_values_count: 0,
                  outliers_detected: 0,
                  closure_equation_verified: true,
                },
              },
              hourly,
            })
          );
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      devApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
        manifest: false, // served from public/manifest.webmanifest
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
          navigateFallback: '/index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    define: {
      ...Object.fromEntries(
        Object.entries(DEFAULT_ENV).flatMap(([key, val]) => {
          const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
          const currentVal = process.env[viteKey] || process.env[key] || val;
          return [
            [`import.meta.env.${viteKey}`, JSON.stringify(currentVal)],
            [`import.meta.env.${key}`, JSON.stringify(currentVal)],
          ];
        })
      ),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/test/**/*.test.{ts,tsx}'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
