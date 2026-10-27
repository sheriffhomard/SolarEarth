import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  probePvgisStatus,
  queryPvgisSeries,
  validatePvgisHourlyPayload,
  PVGIS_MIN_YEAR,
  PVGIS_MAX_YEAR,
  PVGIS_PRODUCTS,
  isYearInPvgisArchive,
} from '../services/pvgisService';
import { handleApiRequest } from '../server/apiHandler';

describe('PVGIS Service and Health Probe Audit', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. probePvgisStatus() Availability & HTTP Status Distinction', () => {
    it('returns "available" when upstream PVGIS returns 200 with valid schema', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: [{ time: '20200615:1200', 'Gb(i)': 450, 'Gd(i)': 150 }] } }),
      } as any);

      const status = await probePvgisStatus(2000);
      expect(status.status).toBe('available');
      expect(status.is_available).toBe(true);
      expect(status.http_code).toBe(200);
    });

    it('rejects HTTP 400 as functional availability, tagging it as "invalid_request"', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        text: async () => '{"message":"Bad parameters"}',
      } as any);

      const status = await probePvgisStatus(2000);
      expect(status.status).toBe('invalid_request');
      expect(status.is_available).toBe(false);
      expect(status.http_code).toBe(400);
    });

    it('rejects HTTP 404 as functional availability, tagging it as "invalid_request"', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => 'text/html' },
        text: async () => 'Endpoint Not Found',
      } as any);

      const status = await probePvgisStatus(2000);
      expect(status.status).toBe('invalid_request');
      expect(status.is_available).toBe(false);
      expect(status.http_code).toBe(404);
    });

    it('identifies HTTP 500/503 as "unavailable"', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: { get: () => 'text/plain' },
        text: async () => 'Service Temporarily Unavailable',
      } as any);

      const status = await probePvgisStatus(2000);
      expect(status.status).toBe('unavailable');
      expect(status.is_available).toBe(false);
      expect(status.http_code).toBe(503);
    });

    it('handles timeout (AbortError) properly as "timeout" and cleans up timer', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      globalThis.fetch = vi.fn().mockRejectedValue(
        Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      );

      const status = await probePvgisStatus(500);
      expect(status.status).toBe('timeout');
      expect(status.is_available).toBe(false);
      expect(status.error_detail).toContain('délai');
      // Verifies finally block guaranteed timer cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('handles network failure (TypeError/DNS) as "unreachable" and cleans up timer', async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const status = await probePvgisStatus(1000);
      expect(status.status).toBe('unreachable');
      expect(status.is_available).toBe(false);
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('2. Date Boundaries and Prohibition of Silent Year Substitution', () => {
    it('defines PVGIS archive limits covering SARAH-3 and ERA5 (2005 to 2023)', () => {
      expect(PVGIS_MIN_YEAR).toBe(2005);
      expect(PVGIS_MAX_YEAR).toBe(2023);
      expect(isYearInPvgisArchive(2020, 'PVGIS-SARAH3')).toBe(true);
      expect(isYearInPvgisArchive(2023, 'PVGIS-SARAH3')).toBe(true);
      expect(isYearInPvgisArchive(2024, 'PVGIS-SARAH3')).toBe(false);
      expect(isYearInPvgisArchive(2004, 'PVGIS-SARAH3')).toBe(false);
      // SARAH-2 ends in 2020
      expect(isYearInPvgisArchive(2020, 'PVGIS-SARAH2')).toBe(true);
      expect(isYearInPvgisArchive(2021, 'PVGIS-SARAH2')).toBe(false);
    });

    it('refuses to query PVGIS for future years (e.g. 2026) and falls back explicitly without date spoofing', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await queryPvgisSeries(43.6, 1.44, '2026-06-21');

      // Upstream PVGIS must NOT be called with year 2020 or any clamped year
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.fallback_applied).toBe(true);
      expect(result.data_type).toBe('simulated_clearsky');
      expect(result.requested_date).toBe('2026-06-21');
      expect(result.actual_data_period).toBeNull();
      expect(result.fallback_reason).toContain('hors archive satellitaire PVGIS');
      expect(result.provenance?.limits_and_disclaimers?.length).toBeGreaterThan(0);
      expect(result.hourly.length).toBe(24);
      expect(result.hourly[12].time).toContain('2026-06-21');
    });

    it('refuses to query PVGIS for pre-archive years (e.g. 1998) and falls back explicitly without spoofing', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await queryPvgisSeries(48.85, 2.35, '1998-07-12');

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.fallback_applied).toBe(true);
      expect(result.data_type).toBe('simulated_clearsky');
      expect(result.requested_date).toBe('1998-07-12');
      expect(result.actual_data_period).toBeNull();
      expect(result.fallback_reason).toContain('hors archive satellitaire PVGIS');
    });

    it('queries PVGIS for supported archive years with exact requested year and raddatabase', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i >= 6 && i <= 18 ? 400 : 0,
        'Gd(i)': i >= 6 && i <= 18 ? 120 : 0,
        'Gr(i)': 0,
        H_sun: i >= 6 && i <= 18 ? 45.0 : -10.0,
        T2m: 22.5,
      }));

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          inputs: {
            meteo_data: {
              radiation_db: 'PVGIS-SARAH3',
              meteo_db: 'ERA5',
              year_min: 2005,
              year_max: 2023,
            },
          },
          outputs: {
            hourly: sampleHourly,
          },
        }),
      } as any);
      globalThis.fetch = fetchMock;

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15', fetchMock, 4000, 'PVGIS-SARAH3');

      // Verify URL sent to PVGIS has exact requested parameters
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('startyear=2020');
      expect(url).toContain('endyear=2020');
      expect(url).toContain('raddatabase=PVGIS-SARAH3');
      expect(url).toContain('angle=0');
      expect(url).toContain('aspect=0');

      expect(result.fallback_applied).toBe(false);
      expect(result.data_type).toBe('historical_satellite');
      expect(result.requested_date).toBe('2020-06-15');
      expect(result.actual_data_period?.start).toContain('2020-06-15');
      expect(result.provenance?.source_id).toBe('pvgis_jrc_sarah3');
      expect(result.provenance?.temperature_source).toBe('era5_reanalysis');
      expect(result.hourly.length).toBe(24);
      expect(result.hourly[12].temperature_source).toBe('era5_reanalysis');
      expect(result.hourly[12].quality_flag).toBe('satellite_retrieval');
    });
  });

  describe('3. Dynamic Metadata Mapping from PVGIS Response', () => {
    it('accurately identifies ERA5 reanalysis when PVGIS response indicates PVGIS-ERA5', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20180615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i >= 6 && i <= 18 ? 350 : 0,
        'Gd(i)': i >= 6 && i <= 18 ? 100 : 0,
        'Gr(i)': 0,
        H_sun: i >= 6 && i <= 18 ? 40.0 : -10.0,
        T2m: 19.0,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          inputs: {
            meteo_data: {
              radiation_db: 'PVGIS-ERA5',
              meteo_db: 'ERA5',
              year_min: 2005,
              year_max: 2023,
            },
          },
          outputs: {
            hourly: sampleHourly,
          },
        }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2018-06-15', globalThis.fetch, 4000, 'PVGIS-ERA5');

      expect(result.fallback_applied).toBe(false);
      expect(result.data_type).toBe('reanalysis');
      expect(result.provenance?.source_id).toBe('pvgis_ecmwf_era5');
      expect(result.provenance?.spatial_resolution).toContain('28 km');
      expect(result.product_name).toBe('PVGIS-ERA5');
    });

    it('accurately maps SARAH-2 when PVGIS response indicates PVGIS-SARAH2', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20150615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i >= 6 && i <= 18 ? 380 : 0,
        'Gd(i)': i >= 6 && i <= 18 ? 110 : 0,
        'Gr(i)': 0,
        H_sun: i >= 6 && i <= 18 ? 42.0 : -10.0,
        T2m: 21.0,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          inputs: {
            meteo_data: {
              radiation_db: 'PVGIS-SARAH2',
              meteo_db: 'ERA5',
              year_min: 2005,
              year_max: 2020,
            },
          },
          outputs: {
            hourly: sampleHourly,
          },
        }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2015-06-15', globalThis.fetch, 4000, 'PVGIS-SARAH2');

      expect(result.fallback_applied).toBe(false);
      expect(result.provenance?.source_id).toBe('pvgis_jrc_sarah2');
      expect(result.provenance?.spatial_resolution).toContain('5 km');
      expect(result.product_name).toBe('PVGIS-SARAH2');
    });
  });

  describe('4. Hourly Payload Validation & Prohibition of Artificial Zero Replacement', () => {
    it('detects missing Gb(i) values and rejects payload without replacing with 0', () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 12 ? null : 200, // Missing hour 12
        'Gd(i)': 80,
        H_sun: 30,
      }));

      const rawJson = { outputs: { hourly: sampleHourly } };
      const validation = validatePvgisHourlyPayload(rawJson, '2020-06-15', 1361.2);

      expect(validation.valid).toBe(false);
      expect(validation.missingValuesCount).toBe(1);
      expect(validation.reason).toContain('Rejet de la mise à zéro artificielle');
    });

    it('detects non-finite values (NaN / Infinity) and rejects payload', () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 10 ? NaN : 200,
        'Gd(i)': 80,
        H_sun: 30,
      }));

      const rawJson = { outputs: { hourly: sampleHourly } };
      const validation = validatePvgisHourlyPayload(rawJson, '2020-06-15', 1361.2);

      expect(validation.valid).toBe(false);
      expect(validation.outliersDetected).toBeGreaterThanOrEqual(1);
    });

    it('detects physically impossible irradiance values (Gb < -0.5 or Gb > I0) and rejects payload', () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 14 ? 1800 : 200, // 1800 W/m² exceeds extraterrestrial constant
        'Gd(i)': 80,
        H_sun: 30,
      }));

      const rawJson = { outputs: { hourly: sampleHourly } };
      const validation = validatePvgisHourlyPayload(rawJson, '2020-06-15', 1361.2);

      expect(validation.valid).toBe(false);
      expect(validation.outliersDetected).toBeGreaterThanOrEqual(1);
    });

    it('triggers explicit fallback when payload validation fails without date spoofing', async () => {
      const corruptHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 12 ? undefined : 200,
        'Gd(i)': 80,
        H_sun: 30,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: corruptHourly } }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');

      expect(result.fallback_applied).toBe(true);
      expect(result.data_type).toBe('simulated_clearsky');
      expect(result.requested_date).toBe('2020-06-15');
      expect(result.fallback_reason).toContain('Données PVGIS rejetées après validation');
    });
  });

  describe('5. Field Semantics, Irradiance Physics and Sunrise/Sunset Edge Cases', () => {
    it('correctly calculates GHI as Gb(i) + Gd(i) and derives DNI as Gb(i) / sin(H_sun)', async () => {
      const elevationDeg = 30.0; // sin(30) = 0.5
      const gb_i = 350; // beam horizontal
      const gd_i = 100; // diffuse horizontal

      const sampleHourly = [
        {
          time: '20200615:1200',
          'Gb(i)': gb_i,
          'Gd(i)': gd_i,
          'Gr(i)': 0,
          H_sun: elevationDeg,
          T2m: 25.0,
        },
      ];

      for (let h = 0; h < 24; h++) {
        if (h !== 12) {
          sampleHourly.push({
            time: `20200615:${String(h).padStart(2, '0')}00`,
            'Gb(i)': 0,
            'Gd(i)': 0,
            'Gr(i)': 0,
            H_sun: -5,
            T2m: 15.0,
          });
        }
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          outputs: { hourly: sampleHourly },
        }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');
      const noon = result.hourly.find((p) => p.hour === 12);
      expect(noon).toBeDefined();

      // GHI = 350 + 100 = 450
      expect(noon!.ghi).toBe(450);
      expect(noon!.dhi).toBe(100);

      // DNI = 350 / sin(30°) = 350 / 0.5 = 700
      expect(noon!.dni).toBeCloseTo(700, 0);

      // Night hour check
      const midnight = result.hourly.find((p) => p.hour === 0);
      expect(midnight!.ghi).toBe(0);
      expect(midnight!.dni).toBe(0);
      expect(midnight!.dhi).toBe(0);
    });

    it('caps DNI at extraterrestrial irradiance I0 for grazing angles at sunrise/sunset (0 < H_sun <= 1°)', async () => {
      const grazingHour = {
        time: '20200615:0600',
        'Gb(i)': 25, // beam horizontal at low sun
        'Gd(i)': 15,
        'Gr(i)': 0,
        H_sun: 0.5, // grazing elevation: sin(0.5°) = 0.00872 -> 25 / 0.00872 = 2867 > I0 (~1323)
        T2m: 14.0,
      };

      const sampleHourly = [grazingHour];
      for (let h = 0; h < 24; h++) {
        if (h !== 6) {
          sampleHourly.push({
            time: `20200615:${String(h).padStart(2, '0')}00`,
            'Gb(i)': 0,
            'Gd(i)': 0,
            'Gr(i)': 0,
            H_sun: -10,
            T2m: 12.0,
          });
        }
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          outputs: { hourly: sampleHourly },
        }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');
      const sunrise = result.hourly.find((p) => p.hour === 6);
      expect(sunrise).toBeDefined();

      // DNI must NOT blow up towards infinity; capped at I0 (~1323 W/m² for day 167)
      expect(sunrise!.dni).toBeLessThanOrEqual(1361.2);
      expect(sunrise!.dni).toBeGreaterThan(0);
      expect(sunrise!.ghi).toBe(40); // 25 + 15
      expect(sunrise!.dhi).toBe(15);
    });

    it('enforces radiative closure on hourly integrated simulation within composite quadrature bounds', async () => {
      const result = await queryPvgisSeries(43.6, 1.44, '2026-06-21'); // simulated clearsky
      for (const p of result.hourly) {
        if (p.solar_elevation > 3.0) {
          const sinH = Math.sin((p.solar_elevation * Math.PI) / 180);
          const computedGhi = p.dni * sinH + p.dhi;
          // Across a 60-min interval, composite quadrature covariance between DNI(t) and sin(alpha(t))
          // is bounded within 6 W/m²
          expect(Math.abs(computedGhi - p.ghi)).toBeLessThan(6.0);
        } else if (p.solar_elevation < -2.0) {
          expect(p.ghi).toBe(0);
          expect(p.dni).toBe(0);
          expect(p.dhi).toBe(0);
        }
      }
    });
  });

  describe('6. API Handler Health & Info Consistency', () => {
    it('/api/v1/health returns detailed database checks and true pvgis availability', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: [{ time: '20200615:1200' }] } }),
      } as any);

      const res = await handleApiRequest('/api/v1/health', { rootDir: process.cwd() });
      expect(res).not.toBeNull();
      expect(res!.statusCode).toBe(200);

      const body = JSON.parse(res!.body);
      expect(body.status).toBe('ok');
      expect(body.database).toBeDefined();
      expect(body.database.backend).toBe('sqlite_backend_optional');
      expect(typeof body.database.directory_writable).toBe('boolean');
      expect(body.pvgis).toBeDefined();
      expect(body.pvgis.functional_status).toBe('available');
    });

    it('/api/v1/info does not advertise PVGIS as available when probe fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        headers: { get: () => 'text/plain' },
        text: async () => 'Service Unavailable',
      } as any);

      const res = await handleApiRequest('/api/v1/info', { rootDir: process.cwd() });
      expect(res).not.toBeNull();

      const body = JSON.parse(res!.body);
      expect(body.providers.pvgis.available).toBe(false);
      expect(body.providers.pvgis.operational_status).toBe('unavailable');
    });

    it('/api/v1/radiation/hourly rejects invalid dates and returns 400', async () => {
      const res = await handleApiRequest('/api/v1/radiation/hourly?date=invalid-date', { rootDir: process.cwd() });
      expect(res).not.toBeNull();
      expect(res!.statusCode).toBe(400);
      const body = JSON.parse(res!.body);
      expect(body.error).toBe('invalid_date_format');
    });

    it('/api/v1/radiation/hourly transparently indicates simulated fallback for 2026', async () => {
      const res = await handleApiRequest('/api/v1/radiation/hourly?lat=43.6&lon=1.44&date=2026-06-21', { rootDir: process.cwd() });
      expect(res).not.toBeNull();
      expect(res!.statusCode).toBe(200);
      const body = JSON.parse(res!.body);
      expect(body.data_type).toBe('simulated_clearsky');
      expect(body.fallback_applied).toBe(true);
      expect(body.requested_date).toBe('2026-06-21');
      expect(body.actual_data_period).toBeNull();
    });
  });
});
