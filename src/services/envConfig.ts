/**
 * Automatic Environment Variables Manager for Solar Earth.
 * Automatically injects all reference defaults so the application is immediately operational
 * without requiring any manual environment configuration.
 */

export interface EnvVariableSpec {
  key: string;
  value: string;
  defaultValue: string;
  description: string;
  category: 'App' | 'Database' | 'PVGIS' | 'Providers' | 'Cache';
  isReference: boolean;
}

export const APP_ENV_CONFIG = {
  // Application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Solar Earth',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.2.0',
  APP_ENV: import.meta.env.VITE_APP_ENV || 'production',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  API_V1_PREFIX: import.meta.env.VITE_API_V1_PREFIX || '/api/v1',
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',

  // Database (Local SQLite 3 & IndexedDB - No Docker / No Postgres)
  DATABASE_URL: import.meta.env.VITE_DATABASE_URL || 'sqlite:///./solar_earth.db',
  DATABASE_TYPE: 'SQLite 3 & IndexedDB (Sur smartphone / Hors-ligne)',

  // PVGIS JRC (European Commission)
  PVGIS_BASE_URL: import.meta.env.VITE_PVGIS_BASE_URL || 'https://re.jrc.ec.europa.eu/api/v5_3/',
  PVGIS_ENABLED: import.meta.env.VITE_PVGIS_ENABLED !== 'false',
  PVGIS_CACHE_TTL_DAYS: parseInt(import.meta.env.VITE_PVGIS_CACHE_TTL_DAYS || '30', 10),
  PVGIS_RATE_LIMIT_PER_MINUTE: parseInt(import.meta.env.VITE_PVGIS_RATE_LIMIT_PER_MINUTE || '20', 10),

  // Other providers
  NASA_POWER_BASE_URL: import.meta.env.VITE_NASA_POWER_BASE_URL || 'https://power.larc.nasa.gov/api/temporal/',
  NASA_POWER_ENABLED: import.meta.env.VITE_NASA_POWER_ENABLED === 'true',
  NASA_POWER_API_KEY: import.meta.env.VITE_NASA_POWER_API_KEY || 'DEMO_KEY',

  NOAA_BASE_URL: import.meta.env.VITE_NOAA_BASE_URL || 'https://services.swpc.noaa.gov/',
  NOAA_ENABLED: import.meta.env.VITE_NOAA_ENABLED === 'true',

  EUMETSAT_BASE_URL: import.meta.env.VITE_EUMETSAT_BASE_URL || 'https://data.eumetsat.int/',
  EUMETSAT_ENABLED: import.meta.env.VITE_EUMETSAT_ENABLED === 'true',

  // HTTP Policies
  PROVIDER_REQUEST_TIMEOUT_SECONDS: parseFloat(import.meta.env.VITE_PROVIDER_REQUEST_TIMEOUT_SECONDS || '15.0'),
  PROVIDER_MAX_RETRIES: parseInt(import.meta.env.VITE_PROVIDER_MAX_RETRIES || '3', 10),
};

export function getAllEnvVariables(): EnvVariableSpec[] {
  return [
    {
      key: 'DATABASE_URL',
      value: APP_ENV_CONFIG.DATABASE_URL,
      defaultValue: 'sqlite:///./solar_earth.db',
      description: 'Emplacement de la base SQLite locale (aucun Docker ni cloud requis)',
      category: 'Database',
      isReference: true,
    },
    {
      key: 'PVGIS_BASE_URL',
      value: APP_ENV_CONFIG.PVGIS_BASE_URL,
      defaultValue: 'https://re.jrc.ec.europa.eu/api/v5_3/',
      description: 'Point d’accès API JRC de la Commission Européenne',
      category: 'PVGIS',
      isReference: true,
    },
    {
      key: 'PVGIS_ENABLED',
      value: String(APP_ENV_CONFIG.PVGIS_ENABLED),
      defaultValue: 'true',
      description: 'Activation du service PVGIS (V0.2 Actif)',
      category: 'PVGIS',
      isReference: true,
    },
    {
      key: 'PVGIS_CACHE_TTL_DAYS',
      value: `${APP_ENV_CONFIG.PVGIS_CACHE_TTL_DAYS}`,
      defaultValue: '30',
      description: 'Durée de rétention du cache local des séries d’irradiance (jours)',
      category: 'Cache',
      isReference: true,
    },
    {
      key: 'PVGIS_RATE_LIMIT_PER_MINUTE',
      value: `${APP_ENV_CONFIG.PVGIS_RATE_LIMIT_PER_MINUTE}`,
      defaultValue: '20',
      description: 'Quota de requêtes par minute pour respecter les serveurs JRC',
      category: 'Cache',
      isReference: true,
    },
    {
      key: 'VITE_API_BASE_URL',
      value: APP_ENV_CONFIG.VITE_API_BASE_URL,
      defaultValue: '/api/v1',
      description: 'Préfixe des requêtes API côté client frontend',
      category: 'App',
      isReference: true,
    },
    {
      key: 'APP_NAME',
      value: APP_ENV_CONFIG.APP_NAME,
      defaultValue: 'Solar Earth',
      description: 'Nom de l’application',
      category: 'App',
      isReference: true,
    },
    {
      key: 'APP_VERSION',
      value: APP_ENV_CONFIG.APP_VERSION,
      defaultValue: '0.2.0',
      description: 'Version du système Solar Earth',
      category: 'App',
      isReference: true,
    },
    {
      key: 'NASA_POWER_BASE_URL',
      value: APP_ENV_CONFIG.NASA_POWER_BASE_URL,
      defaultValue: 'https://power.larc.nasa.gov/api/temporal/',
      description: 'API NASA Langley Surface Meteorology (V0.3)',
      category: 'Providers',
      isReference: true,
    },
    {
      key: 'NOAA_BASE_URL',
      value: APP_ENV_CONFIG.NOAA_BASE_URL,
      defaultValue: 'https://services.swpc.noaa.gov/',
      description: 'API Météo spatiale SWPC (V0.4)',
      category: 'Providers',
      isReference: true,
    },
    {
      key: 'EUMETSAT_BASE_URL',
      value: APP_ENV_CONFIG.EUMETSAT_BASE_URL,
      defaultValue: 'https://data.eumetsat.int/',
      description: 'API Satellites géostationnaires européens (V0.7)',
      category: 'Providers',
      isReference: true,
    },
    {
      key: 'PROVIDER_REQUEST_TIMEOUT_SECONDS',
      value: `${APP_ENV_CONFIG.PROVIDER_REQUEST_TIMEOUT_SECONDS}`,
      defaultValue: '15.0',
      description: 'Délai d’expiration maximal pour les requêtes HTTP externes (secondes)',
      category: 'Cache',
      isReference: true,
    },
    {
      key: 'PROVIDER_MAX_RETRIES',
      value: `${APP_ENV_CONFIG.PROVIDER_MAX_RETRIES}`,
      defaultValue: '3',
      description: 'Nombre maximal de tentatives en cas d’échec transitoire',
      category: 'Cache',
      isReference: true,
    },
    {
      key: 'NASA_POWER_ENABLED',
      value: String(APP_ENV_CONFIG.NASA_POWER_ENABLED),
      defaultValue: 'false',
      description: 'Activation du fournisseur NASA POWER (Prévu V0.3)',
      category: 'Providers',
      isReference: true,
    },
    {
      key: 'NOAA_ENABLED',
      value: String(APP_ENV_CONFIG.NOAA_ENABLED),
      defaultValue: 'false',
      description: 'Activation du fournisseur NOAA SWPC Météo Spatiale (Prévu V0.4)',
      category: 'Providers',
      isReference: true,
    },
    {
      key: 'EUMETSAT_ENABLED',
      value: String(APP_ENV_CONFIG.EUMETSAT_ENABLED),
      defaultValue: 'false',
      description: 'Activation des satellites EUMETSAT (Prévu V0.7)',
      category: 'Providers',
      isReference: true,
    },
    {
      key: 'APP_ENV',
      value: APP_ENV_CONFIG.APP_ENV,
      defaultValue: 'production',
      description: 'Mode d’exécution de l’environnement',
      category: 'App',
      isReference: true,
    },
  ];
}
