import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  probePvgisStatus,
  queryPvgisSeries,
  validatePvgisHourlyPayload,
  calculateAtmosphericRefractionDeg,
  PVGIS_MIN_YEAR,
  PVGIS_MAX_YEAR,
  PVGIS_PRODUCTS,
  isYearInPvgisArchive,
} from '../services/pvgisService';
import { handleApiRequest } from '../server/apiHandler';
import serverApp from '../../server';

describe('PVGIS Service, Health Probe & Server Integration Audit', () => {
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
      expect(isYearInPvgisArchive(2020, 'PVGIS-SARAH2')).toBe(true);
      expect(isYearInPvgisArchive(2021, 'PVGIS-SARAH2')).toBe(false);
    });

    it('refuses to query PVGIS for future years (e.g. 2026) and falls back explicitly without date spoofing', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;

      const result = await queryPvgisSeries(43.6, 1.44, '2026-06-21');

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
  });

  describe('3. PVGIS Timestamps Preservation (No Silent Minute Reset)', () => {
    it('preserves source minutes (e.g. 10 min for SARAH satellites) and converts to ISO UTC without zeroing minutes', async () => {
      // SARAH satellite images are acquired at nominal minutes past the hour (e.g. 10 min)
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}10`,
        'Gb(i)': i >= 6 && i <= 18 ? 420 : 0,
        'Gd(i)': i >= 6 && i <= 18 ? 110 : 0,
        'Gr(i)': 0,
        H_sun: i >= 6 && i <= 18 ? 48.0 : -8.0,
        T2m: 21.5,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
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

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');
      expect(result.fallback_applied).toBe(false);

      const noon = result.hourly.find((p) => p.hour === 12);
      expect(noon).toBeDefined();

      // Crucial verification: source timestamp preserved, minutes are NOT forced to 00:00!
      expect(noon!.source_time_raw).toBe('20200615:1210');
      expect(noon!.time).toBe('2020-06-15T12:10:00Z');
      expect(noon!.time_convention).toContain('UTC nominal observation/scan timestamp');

      // Verify start and end of actual data period
      expect(result.actual_data_period?.start).toBe('2020-06-15T00:10:00Z');
      expect(result.actual_data_period?.end).toBe('2020-06-15T23:10:00Z');
    });

    it('rejects malformed timestamp formats in validatePvgisHourlyPayload without silent fallback masking', () => {
      const corruptHourly = Array.from({ length: 24 }, (_, i) => ({
        time: i === 5 ? '20200615-0500' : `20200615:${String(i).padStart(2, '0')}00`, // Dash instead of colon
        'Gb(i)': 0,
        'Gd(i)': 0,
        H_sun: -10,
      }));

      const validation = validatePvgisHourlyPayload({ outputs: { hourly: corruptHourly } }, '2020-06-15', 1361.2);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Format d\'horodatage PVGIS non conforme');
    });
  });

  describe('4. Low Solar Elevations & DNI Physics near Horizon (0°, 0.5°, 1°, 2°)', () => {
    it('applies atmospheric refraction formula accurately across solar elevations', () => {
      // At horizon (h = 0°), Saemundsson refraction gives ~ 29 arcminutes (0.483°)
      const ref0 = calculateAtmosphericRefractionDeg(0.0);
      expect(ref0).toBeGreaterThan(0.45);
      expect(ref0).toBeLessThan(0.65);

      // At h = 0.5°, refraction is ~ 0.49°
      const refHalf = calculateAtmosphericRefractionDeg(0.5);
      expect(refHalf).toBeGreaterThan(0.40);
      expect(refHalf).toBeLessThan(0.55);

      // At h = 2.0°, refraction is ~ 0.3°
      const ref2 = calculateAtmosphericRefractionDeg(2.0);
      expect(ref2).toBeGreaterThan(0.25);
      expect(ref2).toBeLessThan(0.35);

      // Refraction decreases monotonically with elevation
      expect(ref0).toBeGreaterThan(refHalf);
      expect(refHalf).toBeGreaterThan(ref2);
    });

    it('sets GHI=0, DNI=0, DHI=0 for negative solar elevation (night) with method "night_zero"', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 0 ? 5 : 0, // Residual instrument noise at night
        'Gd(i)': i === 0 ? 3 : 0,
        'Gr(i)': 0,
        H_sun: -5.0, // Night
        T2m: 14.0,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: sampleHourly } }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');
      const midnight = result.hourly[0];
      expect(midnight.solar_elevation).toBe(-5.0);
      expect(midnight.ghi).toBe(0);
      expect(midnight.dni).toBe(0);
      expect(midnight.dhi).toBe(0);
      expect(midnight.dni_derivation_method).toBe('night_zero');
    });

    it('handles grazing angles around 0.5° with atmospheric refraction and caps DNI to I0', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 6 ? 30 : 0,
        'Gd(i)': i === 6 ? 20 : 0,
        'Gr(i)': 0,
        H_sun: i === 6 ? 0.5 : -10.0, // 0.5° grazing elevation
        T2m: 16.0,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: sampleHourly } }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');
      const sunrise = result.hourly[6];

      expect(sunrise.solar_elevation).toBe(0.5);
      expect(sunrise.apparent_solar_elevation_deg).toBeGreaterThan(0.9);
      expect(sunrise.dni_derivation_method).toBe('refraction_corrected_grazing');
      expect(sunrise.derivation_note).toContain('correction de réfraction atmosphérique appliquée');
      expect(sunrise.dni).toBeLessThanOrEqual(1361.2);
      expect(sunrise.dni).toBeGreaterThan(0);
      expect(sunrise.ghi).toBe(50); // Gb(i) + Gd(i) = 30 + 20
      expect(sunrise.raw_horizontal_beam_gbi).toBe(30);
      expect(sunrise.is_derived_dni).toBe(true);
    });

    it('distinguishes derivations at 1.0° and 2.0° with proper derivation methods', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i === 7 ? 60 : i === 8 ? 120 : 0,
        'Gd(i)': i === 7 ? 30 : i === 8 ? 40 : 0,
        'Gr(i)': 0,
        H_sun: i === 7 ? 1.0 : i === 8 ? 2.0 : -10.0,
        T2m: 17.0,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: sampleHourly } }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15');
      const h7 = result.hourly[7];
      const h8 = result.hourly[8];

      expect(h7.dni_derivation_method).toBe('refraction_corrected_low_elevation');
      expect(h8.dni_derivation_method).toBe('geometric_projection');
      expect(h7.raw_horizontal_beam_gbi).toBe(60);
      expect(h8.raw_horizontal_beam_gbi).toBe(120);
    });
  });

  describe('5. Product Metadata & Treatment of Unknown Products', () => {
    it('accurately identifies ERA5 reanalysis and sets isSatellite: false', async () => {
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
          outputs: { hourly: sampleHourly },
        }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2018-06-15', globalThis.fetch, 4000, 'PVGIS-ERA5');

      expect(result.data_type).toBe('reanalysis');
      expect(result.provenance?.source_id).toBe('pvgis_ecmwf_era5');
      expect(result.provenance?.spatial_resolution).toContain('28 km');
      expect(result.provenance?.radiation_source_db).toBe('PVGIS-ERA5');
      expect(result.provenance?.temperature_source_db).toBe('ERA5');
    });

    it('does NOT invent resolution or satellite status for unknown products', async () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': i >= 6 && i <= 18 ? 300 : 0,
        'Gd(i)': i >= 6 && i <= 18 ? 80 : 0,
        'Gr(i)': 0,
        H_sun: i >= 6 && i <= 18 ? 35.0 : -10.0,
        T2m: 18.0,
      }));

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          inputs: {
            meteo_data: {
              radiation_db: 'PVGIS-CUSTOM_MODEL',
              meteo_db: 'COSMO',
              year_min: 2010,
              year_max: 2020,
            },
          },
          outputs: { hourly: sampleHourly },
        }),
      } as any);

      const result = await queryPvgisSeries(43.6, 1.44, '2020-06-15', globalThis.fetch, 4000, 'PVGIS-CUSTOM_MODEL');

      expect(result.provenance?.source_id).toContain('unknown');
      expect(result.provenance?.is_unrecognized_product).toBe(true);
      expect(result.provenance?.spatial_resolution).toBe('Inconnue (produit non documenté)');
      expect(result.provenance?.radiation_source_db).toBe('PVGIS-CUSTOM_MODEL');
      expect(result.provenance?.temperature_source_db).toBe('COSMO');
      expect(result.provenance?.limits_and_disclaimers?.some((d) => d.includes('non répertorié'))).toBe(true);
    });
  });

  describe('6. Rigorous Hourly Validation & High Latitude Behavior', () => {
    it('detects missing hours in sequence and rejects payload without zero substitution', () => {
      // 23 hours instead of 24
      const sampleHourly = Array.from({ length: 23 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': 100,
        'Gd(i)': 50,
        H_sun: 20,
      }));

      const validation = validatePvgisHourlyPayload({ outputs: { hourly: sampleHourly } }, '2020-06-15', 1361.2);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('23/24');
    });

    it('detects duplicate hours and rejects payload', () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: i === 12 ? '20200615:1100' : `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': 100,
        'Gd(i)': 50,
        H_sun: 20,
      }));

      const validation = validatePvgisHourlyPayload({ outputs: { hourly: sampleHourly } }, '2020-06-15', 1361.2);
      expect(validation.valid).toBe(false);
    });

    it('detects chronological ordering violations and rejects payload', () => {
      const sampleHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200615:${String(i).padStart(2, '0')}00`,
        'Gb(i)': 100,
        'Gd(i)': 50,
        H_sun: 20,
      }));
      // Swap two entries to violate chronological order
      const tmp = sampleHourly[5];
      sampleHourly[5] = sampleHourly[4];
      sampleHourly[4] = tmp;

      const validation = validatePvgisHourlyPayload({ outputs: { hourly: sampleHourly } }, '2020-06-15', 1361.2);
      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('Défaut d\'ordonnancement chronologique');
    });

    it('accepts polar day (24h daylight) and polar night (24h night) at high latitudes as physically valid', () => {
      // Polar day: H_sun > 0 for all 24 hours
      const polarDayHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20200621:${String(i).padStart(2, '0')}00`,
        'Gb(i)': 150,
        'Gd(i)': 80,
        H_sun: 10 + Math.sin((i * Math.PI) / 12) * 8, // Elevation between 2° and 18°
        T2m: 5.0,
      }));

      const validationDay = validatePvgisHourlyPayload({ outputs: { hourly: polarDayHourly } }, '2020-06-21', 1361.2);
      expect(validationDay.valid).toBe(true);

      // Polar night: H_sun < 0 for all 24 hours
      const polarNightHourly = Array.from({ length: 24 }, (_, i) => ({
        time: `20201221:${String(i).padStart(2, '0')}00`,
        'Gb(i)': 0,
        'Gd(i)': 0,
        H_sun: -15 + Math.sin((i * Math.PI) / 12) * 5, // Elevation between -20° and -10°
        T2m: -20.0,
      }));

      const validationNight = validatePvgisHourlyPayload({ outputs: { hourly: polarNightHourly } }, '2020-12-21', 1361.2);
      expect(validationNight.valid).toBe(true);
    });
  });

  describe('7. SQLite Health Check with PRAGMA quick_check Integrity', () => {
    it('/api/v1/health reports SQLite presence, openability, header, and PRAGMA quick_check integrity', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ outputs: { hourly: [{ time: '20200615:1200' }] } }),
      } as any);

      // Test with clean rootDir where solar_earth.db is absent
      const emptyRootDir = path.resolve(process.cwd(), 'temp_test_empty_env');
      fs.mkdirSync(emptyRootDir, { recursive: true });
      try {
        const res = await handleApiRequest('/api/v1/health', { rootDir: emptyRootDir });
        expect(res).not.toBeNull();
        expect(res!.statusCode).toBe(200);

        const body = JSON.parse(res!.body);
        expect(body.status).toBe('ok');
        expect(body.storage.server_sqlite).toBeDefined();
        expect(typeof body.storage.server_sqlite.directory_writable).toBe('boolean');
        expect(body.storage.server_sqlite.database_exists).toBe(false);
        expect(body.storage.server_sqlite.database_verified).toBe(false);
        expect(body.pvgis.functional_status).toBe('available');
      } finally {
        if (fs.existsSync(emptyRootDir)) fs.rmdirSync(emptyRootDir);
      }
    });

    it('/api/v1/health verifies actual SQLite database when present using PRAGMA quick_check', async () => {
      const testDbPath = path.resolve(process.cwd(), 'temp_test_check.db');
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      const DatabaseSync = typeof process !== 'undefined' && typeof (process as any).getBuiltinModule === 'function'
        ? (process as any).getBuiltinModule('node:sqlite')?.DatabaseSync
        : null;

      if (DatabaseSync) {
        const db = new DatabaseSync(testDbPath);
        db.exec("CREATE TABLE test_meta (key TEXT, val TEXT); INSERT INTO test_meta VALUES ('app', 'SolarEarth');");
        db.close();
      } else {
        // Fallback valid SQLite header
        const header = Buffer.alloc(100);
        header.write('SQLite format 3\0', 0, 16, 'utf8');
        fs.writeFileSync(testDbPath, header);
      }

      try {
        // Mock rootDir to contain temp_test_check.db by renaming or pointing
        const testRootDir = path.resolve(process.cwd(), 'temp_test_env');
        fs.mkdirSync(testRootDir, { recursive: true });
        const targetDb = path.resolve(testRootDir, 'solar_earth.db');
        fs.copyFileSync(testDbPath, targetDb);

        const res = await handleApiRequest('/api/v1/health', { rootDir: testRootDir });
        expect(res).not.toBeNull();
        const body = JSON.parse(res!.body);

        expect(body.storage.server_sqlite.database_exists).toBe(true);
        expect(body.storage.server_sqlite.database_openable).toBe(true);
        expect(body.storage.server_sqlite.database_readable).toBe(true);
        expect(body.storage.server_sqlite.database_integrity_checked).toBe(true);
        expect(body.storage.server_sqlite.database_integrity_result).toBe('ok');
        expect(body.storage.server_sqlite.database_verified).toBe(true);

        fs.unlinkSync(targetDb);
        fs.rmdirSync(testRootDir);
      } finally {
        if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      }
    });
  });

  describe('8. Production Express Server Integration (server.ts)', () => {
    it('express server exports functional application routing /api/v1/health and /api/v1/info', async () => {
      expect(serverApp).toBeDefined();
      expect(typeof (serverApp as any).handle).toBe('function');

      // Test api handler directly through mock invocation
      const healthRes = await handleApiRequest('/api/v1/health');
      expect(healthRes?.statusCode).toBe(200);

      const infoRes = await handleApiRequest('/api/v1/info');
      expect(infoRes?.statusCode).toBe(200);
      const infoBody = JSON.parse(infoRes!.body);
      expect(infoBody.name).toBe('Solar Earth');
      expect(infoBody.version).toBe('0.3.0');
    });
  });

  describe('9. System Settings, Update Engine & Background Auto-Updates (v0.3.0)', () => {
    it('provides correct release date, app version, and last check date tracking', async () => {
      const { UpdateService, APP_VERSION, RELEASE_DATE } = await import('../services/updateService');
      expect(APP_VERSION).toBe('0.3.0');
      expect(RELEASE_DATE).toBe('28 octobre 2026');

      const testTimestamp = '2026-10-28T14:30:00.000Z';
      UpdateService.setLastCheckDate(testTimestamp);
      expect(UpdateService.getLastCheckDate()).toBe(testTimestamp);

      // Auto update toggling
      UpdateService.setAutoUpdateEnabled(true);
      expect(UpdateService.isAutoUpdateEnabled()).toBe(true);
      UpdateService.setAutoUpdateEnabled(false);
      expect(UpdateService.isAutoUpdateEnabled()).toBe(false);
      UpdateService.setAutoUpdateEnabled(true);

      // Auto update intervals
      UpdateService.setAutoUpdateIntervalMinutes(30);
      expect(UpdateService.getAutoUpdateIntervalMinutes()).toBe(30);
      UpdateService.setAutoUpdateIntervalMinutes(15);
      expect(UpdateService.getAutoUpdateIntervalMinutes()).toBe(15);
    });

    it('checkForUpdates executes without throwing and updates last check date', async () => {
      const { UpdateService } = await import('../services/updateService');
      const result = await UpdateService.checkForUpdates();
      expect(result).toBeDefined();
      expect(result.currentVersion).toBe('0.3.0');
      expect(typeof result.checkedAtIso).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.hasUpdate).toBe('boolean');
    });
  });
});
