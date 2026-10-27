/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { handleApiRequest } from './src/server/apiHandler';

// Whitelist of strictly public frontend variables.
const PUBLIC_FRONTEND_ENV: Record<string, string> = {
  VITE_APP_NAME: 'Solar Earth',
  VITE_APP_VERSION: '0.2.0',
  VITE_API_BASE_URL: '/api/v1',
  VITE_PVGIS_BASE_URL: 'https://re.jrc.ec.europa.eu/api/v5_3/',
  VITE_PVGIS_ENABLED: 'true',
  VITE_PVGIS_CACHE_TTL_DAYS: '30',
  VITE_PVGIS_RATE_LIMIT_PER_MINUTE: '20',
};

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
        manifest: false,
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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
