import { describe, it, expect } from 'vitest';
import {
  SOLAR_CONSTANT_ISC,
  WMO_SUNSHINE_THRESHOLD_DNI,
  getOrbitalEccentricityCorrection,
  getExtraterrestrialNormalIrradiance,
  calculateSolarAngles,
  validatePhysicalIrradiance,
  calculateDailyIrradiation,
  calculateSunshineDurationHours,
  generateScientificSolarDay,
} from '../services/physicsEngine';

describe('Solar Physics Engine — Physical Validation & Unit Consistency (Priorité 3)', () => {
  it('1. Verifies Solar Constant and Earth Orbital Eccentricity variation', () => {
    expect(SOLAR_CONSTANT_ISC).toBe(1361.2);

    // Day 3 (January ~ perihelion): Earth is closest to Sun, ecc > 1.03
    const eccJan = getOrbitalEccentricityCorrection(3);
    expect(eccJan).toBeGreaterThan(1.02);
    expect(eccJan).toBeLessThan(1.04);

    // Day 185 (July ~ aphelion): Earth is farthest, ecc < 0.98
    const eccJul = getOrbitalEccentricityCorrection(185);
    expect(eccJul).toBeGreaterThan(0.96);
    expect(eccJul).toBeLessThan(0.98);

    // Extraterrestrial normal irradiance variation: ~1410 W/m² in Jan, ~1320 W/m² in July
    const i0Jan = getExtraterrestrialNormalIrradiance(3);
    const i0Jul = getExtraterrestrialNormalIrradiance(185);
    expect(i0Jan).toBeGreaterThan(i0Jul);
    expect(i0Jan).toBeGreaterThan(1390);
    expect(i0Jul).toBeLessThan(1340);
  });

  it('2. Enforces Night-Time Zero Radiation Rule', () => {
    // Night validation (elevation = -15 deg)
    const nightValid = validatePhysicalIrradiance(0, 0, 0, -15);
    expect(nightValid.isValid).toBe(true);
    expect(nightValid.violations).toHaveLength(0);

    // Night violation: positive GHI when sun is below horizon
    const nightViolation = validatePhysicalIrradiance(50, 0, 50, -10);
    expect(nightViolation.isValid).toBe(false);
    expect(nightViolation.violations[0]).toContain('nocturne');
  });

  it('3. Enforces Geometric Component Balance: GHI = DNI * sin(elevation) + DHI', () => {
    const elevation = 45; // sin(45°) ~ 0.7071
    const dni = 800;
    const dhi = 120;
    const expectedGhi = Math.round(dni * Math.sin((45 * Math.PI) / 180) + dhi); // 800*0.7071 + 120 = 686 W/m²

    const balanced = validatePhysicalIrradiance(expectedGhi, dni, dhi, elevation);
    expect(balanced.isValid).toBe(true);

    // Severe unbalance: GHI reported as 200 while DNI*sin + DHI is ~686
    const unbalanced = validatePhysicalIrradiance(200, dni, dhi, elevation);
    expect(unbalanced.isValid).toBe(false);
    expect(unbalanced.violations[0]).toContain('Déséquilibre géométrique');
  });

  it('4. Rejects Aberrant Irradiance exceeding Extraterrestrial Limits', () => {
    const aberrant = validatePhysicalIrradiance(1850, 900, 200, 60);
    expect(aberrant.isValid).toBe(false);
    expect(aberrant.violations[0]).toContain('dépasse la limite physique');
  });

  it('5. Verifies Energy Integration: Irradiance (W/m²) to Irradiation (kWh/m²)', () => {
    // 24 hours of 1000 W/m² = 24,000 Wh/m² = 24.0 kWh/m²
    const constantIrradiance = Array(24).fill(1000);
    const { totalWhM2, totalKwhM2 } = calculateDailyIrradiation(constantIrradiance);

    expect(totalWhM2).toBe(24000);
    expect(totalKwhM2).toBe(24.0);

    // 1 kWh/m² = 1000 Wh/m²
    const singleHour1000 = [1000, ...Array(23).fill(0)];
    const singleResult = calculateDailyIrradiation(singleHour1000);
    expect(singleResult.totalWhM2).toBe(1000);
    expect(singleResult.totalKwhM2).toBe(1.0);
  });

  it('6. Computes WMO Sunshine Duration (DNI >= 120 W/m²)', () => {
    const dniHours = [0, 0, 50, 119, 120, 250, 800, 900, 850, 500, 150, 120, 90, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sunshine = calculateSunshineDurationHours(dniHours);
    // Values >= 120: 120, 250, 800, 900, 850, 500, 150, 120 = 8 hours
    expect(sunshine).toBe(8);
  });

  it('7. Scientific Benchmark: Carpentras (Provence Solaire) Summer Solstice vs Winter Solstice', () => {
    const latCarpentras = 44.053;
    const lonCarpentras = 5.048;

    // Summer Solstice: June 21 (Day ~172)
    const summerDay = generateScientificSolarDay(latCarpentras, lonCarpentras, '2026-06-21', 'Carpentras');
    // Winter Solstice: December 21 (Day ~355)
    const winterDay = generateScientificSolarDay(latCarpentras, lonCarpentras, '2026-12-21', 'Carpentras');

    // In summer in Provence: solar elevation reaches ~69°, daily irradiation ~7.5 - 8.5 kWh/m²
    expect(summerDay.max_solar_elevation_deg).toBeGreaterThan(65);
    expect(summerDay.daily_ghi_kwh_m2).toBeGreaterThan(6.0);
    expect(summerDay.sunshine_hours_wmo).toBeGreaterThan(12);

    // In winter: solar elevation max is ~22°, daily irradiation is much lower ~1.8 - 2.5 kWh/m²
    expect(winterDay.max_solar_elevation_deg).toBeLessThan(26);
    expect(winterDay.daily_ghi_kwh_m2).toBeLessThan(3.0);
    expect(winterDay.sunshine_hours_wmo).toBeLessThan(9);

    // Summer must receive substantially more energy than winter
    expect(summerDay.daily_ghi_kwh_m2).toBeGreaterThan(winterDay.daily_ghi_kwh_m2 * 2.5);
  });

  it('8. Security & Input Validation: Rejects out-of-range coordinates and malformed dates', async () => {
    const { validateCoordinates, validateDateString } = await import('../services/solarCalculator');

    // Valid coordinates
    expect(validateCoordinates(48.8566, 2.3522).valid).toBe(true);
    expect(validateCoordinates(-90, 0).valid).toBe(true);
    expect(validateCoordinates(90, 180).valid).toBe(true);

    // Invalid coordinates
    expect(validateCoordinates(91.5, 2.3).valid).toBe(false);
    expect(validateCoordinates(-95, 2.3).valid).toBe(false);
    expect(validateCoordinates(48.8, 185.0).valid).toBe(false);
    expect(validateCoordinates(48.8, -190.0).valid).toBe(false);
    expect(validateCoordinates(NaN, 2.3).valid).toBe(false);

    // Valid dates
    expect(validateDateString('2026-06-21').valid).toBe(true);
    expect(validateDateString('2024-02-29').valid).toBe(true); // Leap year

    // Invalid dates
    expect(validateDateString('2026-13-45').valid).toBe(false);
    expect(validateDateString('21/06/2026').valid).toBe(false);
    expect(validateDateString('invalid-date').valid).toBe(false);
    expect(validateDateString('1950-01-01').valid).toBe(false); // Out of supported astronomical range
  });

  it('9. Scientific Provenance & Formula Audit Trail: Validates standards and closure', async () => {
    const { generateScientificProvenance, calculateClientSolar24h } = await import('../services/solarCalculator');

    const result = calculateClientSolar24h(48.836, 2.336, '2026-06-21', 'Observatoire de Paris');
    expect(result.provenance).toBeDefined();

    const prov = result.provenance!;
    expect(prov.source_id).toBe('simulated_clearsky_model');
    expect(prov.source_name).toContain('Modèle Astronomique');
    expect(prov.source_version).toBeDefined();
    expect(prov.spatial_resolution).toContain('WGS84');
    expect(prov.temporal_resolution).toBe('1 heure (moyenne intégrée)');
    expect(prov.solar_constant_w_m2).toBe(1361.2);

    // Verify formulas catalog
    expect(prov.formulas.daily_irradiation.unit).toBe('kWh/m²');
    expect(prov.formulas.daily_irradiation.reference_standard).toContain('WMO');
    expect(prov.formulas.peak_irradiance.unit).toBe('W/m²');
    expect(prov.formulas.peak_irradiance.reference_standard).toContain('ISO 9060');
    expect(prov.formulas.radiative_closure.symbol).toBe('GHI = DNI · sin(α) + DHI');

    // Quality assessment
    expect(prov.quality_assessment.missing_values_count).toBe(0);
    expect(prov.quality_assessment.outliers_detected).toBe(0);
    expect(prov.quality_assessment.closure_equation_verified).toBe(true);

    // Also verify PVGIS satellite provenance structure
    const pvgisProv = generateScientificProvenance(48.836, 2.336, '2026-06-21', 6.2, 850, 780, 11, 'pvgis_jrc_sarah2');
    expect(pvgisProv.source_id).toBe('pvgis_jrc_sarah2');
    expect(pvgisProv.source_name).toContain('PVGIS');
    expect(pvgisProv.spatial_resolution).toBe('0.05° (~5 km)');
    expect(pvgisProv.quality_assessment.status).toBe('satellite_derived');
  });
});
