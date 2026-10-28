/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function isValidCalendarDate(dateStr: string): { valid: boolean; error?: string } {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { valid: false, error: 'Format de date invalide. Format attendu : AAAA-MM-JJ.' };
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1980 || year > 2060) {
    return { valid: false, error: `L’année ${year} est hors limites astronomiques acceptées [1980, 2060].` };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: `Le mois ${month} est invalide (doit être entre 01 et 12).` };
  }
  const daysInMonths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const maxDays = daysInMonths[month - 1];
  if (day < 1 || day > maxDays) {
    if (month === 2 && day === 29 && !isLeapYear(year)) {
      return { valid: false, error: `L’année ${year} n'est pas bissextile (février ne compte que 28 jours).` };
    }
    return { valid: false, error: `Le jour ${day} n'existe pas dans le mois ${month.toString().padStart(2, '0')}/${year} (maximum: ${maxDays} jours).` };
  }
  return { valid: true };
}

// Whitelist of strictly public frontend variables.
// NO server secrets (database credentials, private keys) are ever exposed to the client bundle.
const PUBLIC_FRONTEND_ENV: Record<string, string> = {
  VITE_APP_NAME: 'Solar Earth',
  VITE_APP_VERSION: '0.3.0',
  VITE_API_BASE_URL: '/api/v1',
  VITE_PVGIS_BASE_URL: 'https://re.jrc.ec.europa.eu/api/v5_3/',
  VITE_PVGIS_ENABLED: 'true',
  VITE_PVGIS_CACHE_TTL_DAYS: '30',
  VITE_PVGIS_RATE_LIMIT_PER_MINUTE: '20',
};

// Internal server defaults (kept server-side, not exposed to browser bundle)
const SERVER_INTERNAL_ENV: Record<string, string> = {
  APP_NAME: 'Solar Earth',
  APP_VERSION: '0.3.0',
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

import { handleApiRequest } from './src/server/apiHandler';

function apiPlugin(): Plugin {
  const handler = async (req: any, res: any, next: any) => {
    if (req.url && req.url.startsWith('/api/v1/')) {
      try {
        const rootDir = import.meta.dirname || process.cwd();
        const apiRes = await handleApiRequest(req.url, { rootDir });
        if (apiRes) {
          res.statusCode = apiRes.statusCode;
          for (const [key, val] of Object.entries(apiRes.headers)) {
            res.setHeader(key, val);
          }
          res.end(apiRes.body);
          return;
        }
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'internal_server_error', message: err.message }));
        return;
      }
    }
    next();
  };

  return {
    name: 'solar-earth-api-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      apiPlugin(),
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
