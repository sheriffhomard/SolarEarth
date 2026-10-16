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
  hourly: HourlyRadiationPoint[];
}
