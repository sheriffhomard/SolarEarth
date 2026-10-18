export type ProviderState = 'configured' | 'enabled' | 'disabled';

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
  timestamp: string;
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

export interface HourlyRadiationPoint {
  hour: number;
  time: string;
  ghi: number;
  dni: number;
  dhi: number;
  solar_elevation: number;
  solar_azimuth?: number;
  temperature?: number;
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
  provenance?: ScientificProvenance;
  hourly: HourlyRadiationPoint[];
}
