/**
 * Unified Scientific Data Model for Solar Earth.
 * Standardizes solar radiation observations across all data providers
 * (PVGIS JRC, NASA POWER, NOAA SWPC, and Local Spencer-Bird Clear Sky Engine).
 */

export type SolarVariableCode =
  | 'ghi'              // Global Horizontal Irradiance
  | 'dni'              // Direct Normal Irradiance
  | 'dhi'              // Diffuse Horizontal Irradiance
  | 'gti'              // Global Tilted Irradiance
  | 'solar_elevation'  // Sun elevation angle above horizon
  | 'solar_azimuth'    // Sun azimuth angle
  | 'temperature_2m'   // Ambient air temperature at 2m
  | 'clearness_index'  // Clearness index Kt = GHI / G0
  | 'f10_7'            // Solar radio flux 10.7cm
  | 'kp_index';        // Planetary geomagnetic index

export type PhysicalUnit =
  | 'W/m²'          // Irradiance (Instantaneous power density)
  | 'Wh/m²'         // Irradiation (Integrated energy)
  | 'kWh/m²'        // Daily / Monthly energy
  | '°'             // Angular degrees
  | '°C'            // Temperature Celsius
  | 'sfu'           // Solar Flux Units (10^-22 W/m²/Hz)
  | 'dimensionless';// Ratio (Kt)

export type IntegrationPeriod =
  | 'instantaneous'
  | 'PT15M'  // 15 minutes
  | 'PT1H'   // 1 hour
  | 'P1D'    // 1 day
  | 'P1M'    // 1 month
  | 'P1Y';   // 1 year

export type QualityFlag =
  | 'measured'            // Ground pyranometer / pyrheliometer measurement
  | 'satellite_validated' // Satellite retrieval cross-validated (PVGIS-SARAH / CMSAF)
  | 'model_clearsky'      // High-precision Spencer-Bird Clear-Sky model
  | 'estimated'           // Empirical interpolation
  | 'missing';            // Missing or degraded data

export type ProviderSourceCode =
  | 'pvgis_jrc'
  | 'nasa_power'
  | 'noaa_swpc'
  | 'eumetsat_sarah'
  | 'model_clearsky_spencer_bird';

export type CacheFreshnessStatus =
  | 'fresh'          // Live from provider within freshness window
  | 'cached'         // Valid cached response from IndexedDB / local cache
  | 'stale'          // Expired cache served offline as fallback
  | 'fallback_model' // Offline astronomical calculation
  | 'bypass';        // Direct computation bypass

/**
 * Normalized observation point for a single physical variable.
 */
export interface NormalizedObservationPoint {
  variable: SolarVariableCode;
  value: number;
  unit: PhysicalUnit;
  timestamp_utc: string; // ISO 8601 UTC
  integration_period: IntegrationPeriod;
  quality_flag: QualityFlag;
  uncertainty_percent?: number;
}

/**
 * Common scientific hourly solar observation bundle.
 */
export interface CommonHourlyObservation {
  hour_utc: number; // 0 to 23
  timestamp_utc: string; // ISO 8601
  ghi_w_m2: number;
  dni_w_m2: number;
  dhi_w_m2: number;
  solar_elevation_deg: number;
  solar_azimuth_deg?: number;
  temperature_c?: number;
  ambient_temperature_proxy_c?: number;
  clearness_index_kt?: number;
  quality_flag: QualityFlag;
}

/**
 * Unified daily observation record with full scientific metadata and provenance.
 */
export interface UnifiedSolarObservationRecord {
  // Geographic anchor
  latitude: number;
  longitude: number;
  elevation_m?: number;
  location_name: string;

  // Temporal anchor
  date_utc: string; // YYYY-MM-DD
  retrieval_date_utc: string; // Timestamp when data was retrieved / calculated

  // Provenance & Scientific Lineage
  source_code: ProviderSourceCode;
  product_name: string;
  product_version: string;
  spatial_resolution_deg: number;
  temporal_resolution: 'hourly' | 'daily';

  // Cache & Freshness Lifecycle
  cache_status: CacheFreshnessStatus;
  cache_timestamp_utc?: string;
  cache_ttl_seconds: number;

  // Physical Summary Metrics (Strictly checked for dimensional correctness)
  // Irradiance (Flux instantané maximal en W/m²)
  peak_ghi_w_m2: number;
  peak_dni_w_m2: number;
  peak_dhi_w_m2: number;
  max_solar_elevation_deg: number;

  // Irradiation (Énergie cumulée journalière)
  daily_ghi_kwh_m2: number;
  daily_dni_kwh_m2: number;
  daily_dhi_kwh_m2: number;

  // Astronomical & Atmospheric Indices
  sunshine_hours_wmo: number; // WMO threshold: DNI >= 120 W/m²
  extraterrestrial_daily_kwh_m2: number; // H0 extraterrestre horizontal
  daily_clearness_index_kt: number; // KT = GHI / H0

  // 24 Hourly Discrete Points
  hourly: CommonHourlyObservation[];

  // Validation Warnings
  validation_warnings?: string[];
}
