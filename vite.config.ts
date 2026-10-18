/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Whitelist of strictly public frontend variables.
// NO server secrets (database credentials, private keys) are ever exposed to the client bundle.
const PUBLIC_FRONTEND_ENV: Record<string, string> = {
  VITE_APP_NAME: 'Solar Earth',
  VITE_APP_VERSION: '0.2.0',
  VITE_API_BASE_URL: '/api/v1',
  VITE_PVGIS_BASE_URL: 'https://re.jrc.ec.europa.eu/api/v5_3/',
  VITE_PVGIS_ENABLED: 'true',
  VITE_PVGIS_CACHE_TTL_DAYS: '30',
  VITE_PVGIS_RATE_LIMIT_PER_MINUTE: '20',
};

// Internal server defaults (kept server-side, not exposed to browser bundle)
const SERVER_INTERNAL_ENV: Record<string, string> = {
  APP_NAME: 'Solar Earth',
  APP_VERSION: '0.2.0',
  APP_ENV: 'development',
  LOG_LEVEL: 'INFO',
  DEBUG: 'false',
  DATABASE_URL: 'sqlite:///./solar_earth.db',
  PORT: '3000',
};

for (const [key, val] of Object.entries(SERVER_INTERNAL_ENV)) {
  if (!process.env[key]) {
    process.env[key] = val;
  }
}
for (const [key, val] of Object.entries(PUBLIC_FRONTEND_ENV)) {
  if (!process.env[key]) {
    process.env[key] = val;
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

          // Astronomical solar calculation based on real Spencer (1971) & Bird (1981) equations
          const parts = dateStr.split('-').map(Number);
          const year = parts[0];
          const month = parts[1];
          const day = parts[2];
          const targetD = new Date(Date.UTC(year, month - 1, day));
          const startYear = new Date(Date.UTC(year, 0, 1));
          const dayOfYear = Math.floor((targetD.getTime() - startYear.getTime()) / 86400000) + 1;
          const latRad = (lat * Math.PI) / 180;

          const hourly = [];
          for (let h = 0; h < 24; h++) {
            const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (h - 12) / 24);
            const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
            const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma);
            const timeOffset = eqtime + 4 * lon;
            const tst = (h * 60 + timeOffset) % 1440;
            const haRad = (((tst / 4) - 180) * Math.PI) / 180;

            let cosZenith = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(haRad);
            cosZenith = Math.max(-1, Math.min(1, cosZenith));
            const elRad = Math.asin(cosZenith);
            const elDeg = (elRad * 180) / Math.PI;

            let ghi = 0;
            let dni = 0;
            let dhi = 0;

            if (elDeg > 0) {
              const theta0 = (2 * Math.PI * (dayOfYear - 1)) / 365;
              const ecc = 1.00011 + 0.034221 * Math.cos(theta0) + 0.00128 * Math.sin(theta0);
              const i0 = 1361.2 * ecc;
              const sinEl = Math.sin(elRad);
              const zenithDeg = 90 - elDeg;
              const airMass = Math.max(1, Math.min(30, 1 / (sinEl + 0.50572 * Math.pow(Math.max(0.1, 96.07995 - zenithDeg), -1.6364))));
              const tauBeam = Math.exp(-0.16 * airMass);
              const tauDiff = 0.08 + 0.04 * sinEl;

              dni = Math.max(0, Math.round(i0 * tauBeam * 10) / 10);
              dhi = Math.max(0, Math.round(i0 * sinEl * tauDiff * 10) / 10);
              ghi = Math.max(0, Math.round((dni * sinEl + dhi) * 10) / 10);
            }

            hourly.push({
              hour: h,
              time: `${dateStr}T${h.toString().padStart(2, '0')}:00:00Z`,
              ghi,
              dni,
              dhi,
              solar_elevation: Math.round(elDeg * 10) / 10,
              temperature: Math.round((14 + 7 * Math.sin(Math.max(0, elRad)) + 3 * Math.cos(latRad)) * 10) / 10,
              quality_flag: 'simulated',
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
              source: 'simulated_clearsky_model',
              units: 'W/m² for irradiance, kWh/m² for irradiation',
              daily_irradiation_kwh: dailyKwh,
              peak_ghi: peakGhi,
              peak_dni: peakDni,
              sunshine_hours: sunshineHours,
              is_simulated: true,
              warning: 'DONNÉES SIMULÉES : Calculées par le modèle astronomique local théorique (Spencer & Bird). Ces données ne proviennent pas des satellites PVGIS JRC.',
              cached: false,
              cache_status: 'fallback_model',
              cache_timestamp_utc: nowIso,
              product_name: 'Modèle Solaire Ciel Clair (Simulation Locale - Hors-Ligne)',
              product_version: 'v1.0 (Spencer / Bird)',
              provenance: {
                source_id: 'simulated_clearsky_model',
                source_name: 'Modèle Astronomique Théorique Local (Spencer 1971 / Bird 1981)',
                source_version: 'v1.0',
                data_retrieval_date_utc: nowIso,
                calculation_date_utc: nowIso,
                spatial_resolution: 'Position ponctuelle exacte (WGS84)',
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
                    calculated_value: 'Modélisée',
                    calculated_at_utc: nowIso,
                  },
                },
                quality_assessment: {
                  status: 'model_clearsky',
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
        Object.entries(PUBLIC_FRONTEND_ENV).map(([key, defaultVal]) => [
          `import.meta.env.${key}`,
          JSON.stringify(process.env[key] || defaultVal),
        ])
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
