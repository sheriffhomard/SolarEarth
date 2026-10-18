export type ProviderState =
  | 'configured'
  | 'enabled'
  | 'disabled'
  | 'simulated'
  | 'available'
  | 'unavailable';

export interface SupportedOperations {
  current: boolean;
  hourly: boolean;
  daily: boolean;
  historical: boolean;
}

export interface ProviderStatus {
  code: string;
  name: string;
  state: ProviderState;
  base_url: string;
  target_version: string;
  is_active_in_v0_1: boolean;
  supported_operations: SupportedOperations;
  supported_parameters: string[];
  description: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database?: string;
  database_verified?: boolean;
  timestamp: string;
  components?: {
    client_persistence?: string;
    server_database_file?: string;
    solar_physics_engine?: string;
    pvgis_provider?: string;
    [key: string]: unknown;
  };
}

export interface InfoResponse {
  name: string;
  version: string;
  environment: string;
  description: string;
  database_type: string;
  providers: Record<string, ProviderStatus>;
  roadmap: string[];
}

export interface AtmosphericModelParameters {
  model_name: string;
  solar_constant_w_m2: number;
  orbital_eccentricity_correction: number;
  aerosol_optical_depth_500nm: number;
  ozone_column_cm_atm: number;
  precipitable_water_cm: number;
  site_elevation_m?: number;
  atmospheric_pressure_ratio?: number;
  validity_limits: string[];
}

export interface HourlyRadiationPoint {
  hour: number;
  time: string;
  ghi: number;
  dni: number;
  dhi: number;
  solar_elevation: number;
  solar_azimuth?: number;
  temperature?: number;
  ambient_temperature_proxy_c?: number;
  temperature_is_forecast?: boolean;
  temperature_note?: string;
  time_semantics?: 'hourly_integrated_mean' | 'instantaneous_sample';
  interval_duration_hours?: number;
  quality_flag?: string;
}

export interface ScientificIndicatorFormula {
  name: string;
  symbol: string;
  formula_text: string;
  unit: string;
  reference_standard: string;
  calculated_value: number | string;
  calculated_at_utc: string;
}

export interface ScientificProvenance {
  source_id: string;
  source_name: string;
  source_version: string;
  data_retrieval_date_utc: string;
  calculation_date_utc: string;
  spatial_resolution: string;
  temporal_resolution: string;
  solar_constant_w_m2: number;
  atmospheric_parameters?: AtmosphericModelParameters;
  integration_method: 'hourly_mean_integration' | 'trapezoidal_integration';
  time_semantics: 'hourly_integrated_mean' | 'instantaneous_sample';
  reference_benchmarks?: {
    station_name: string;
    latitude: number;
    longitude: number;
    expected_clear_sky_summer_solstice_kwh: string;
    expected_clear_sky_winter_solstice_kwh: string;
  }[];
  formulas: Record<string, ScientificIndicatorFormula>;
  quality_assessment: {
    status: 'measured' | 'satellite_derived' | 'model_clearsky' | 'estimated';
    missing_values_count: number;
    outliers_detected: number;
    closure_equation_verified: boolean;
  };
}

export interface HourlyRadiationResponse {
  location_name?: string;
  latitude: number;
  longitude: number;
  date: string;
  source: string;
  units: string;
  daily_irradiation_kwh: number;
  peak_ghi: number;
  peak_dni: number;
  sunshine_hours: number;
  cached?: boolean;
  cache_status?: 'fresh' | 'cached' | 'stale' | 'fallback_model';
  cache_timestamp_utc?: string;
  product_name?: string;
  product_version?: string;
  daily_clearness_index_kt?: number;
  extraterrestrial_daily_kwh_m2?: number;
  is_simulated?: boolean;
  warning?: string;
  timezone?: string;
  local_civil_hours_count?: number;
  provenance?: ScientificProvenance;
  hourly: HourlyRadiationPoint[];
}
