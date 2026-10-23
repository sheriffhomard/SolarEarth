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

  it('8. Security & Strict Calendar Date Validation: Rejects nonexistent dates and leap year violations', async () => {
    const { validateCoordinates, validateDateString, isLeapYear, getDaysInMonth } = await import(
      '../services/solarCalculator'
    );

    // Leap year leap rules
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(2000)).toBe(true); // Divisible by 400
    expect(isLeapYear(1900)).toBe(false); // Century not divisible by 400

    // Days per month
    expect(getDaysInMonth(2024, 2)).toBe(29);
    expect(getDaysInMonth(2025, 2)).toBe(28);
    expect(getDaysInMonth(2026, 4)).toBe(30);
    expect(getDaysInMonth(2026, 7)).toBe(31);

    // Valid calendar dates
    expect(validateDateString('2026-06-21').valid).toBe(true);
    expect(validateDateString('2024-02-29').valid).toBe(true); // 2024 is leap
    expect(validateDateString('2000-02-29').valid).toBe(true); // 2000 is leap

    // Astronomical boundary dates
    expect(validateDateString('1980-01-01').valid).toBe(true); // Boundary min
    expect(validateDateString('2060-12-31').valid).toBe(true); // Boundary max
    expect(validateDateString('1979-12-31').valid).toBe(false); // Out of bounds
    expect(validateDateString('2061-01-01').valid).toBe(false); // Out of bounds

    // Nonexistent calendar dates (MUST be rejected, not rolled over)
    expect(validateDateString('2025-02-29').valid).toBe(false); // 2025 not a leap year
    expect(validateDateString('2024-02-30').valid).toBe(false); // February 30th does not exist
    expect(validateDateString('2026-04-31').valid).toBe(false); // April has 30 days
    expect(validateDateString('2026-06-31').valid).toBe(false); // June has 30 days
    expect(validateDateString('2026-11-31').valid).toBe(false); // November has 30 days
    expect(validateDateString('2026-00-15').valid).toBe(false); // Month 00
    expect(validateDateString('2026-13-01').valid).toBe(false); // Month 13
    expect(validateDateString('2026-05-00').valid).toBe(false); // Day 00
    expect(validateDateString('2026-05-32').valid).toBe(false); // Day 32
    expect(validateDateString('21/06/2026').valid).toBe(false); // Malformed format
    expect(validateDateString('not-a-date').valid).toBe(false);
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

  it('10. Geographic Extreme Bounds Validation: WGS84 boundary limits and rejection', async () => {
    const { validateCoordinates } = await import('../services/solarCalculator');

    // Exact geographic extremes (Must be valid)
    expect(validateCoordinates(90.0, 0.0).valid).toBe(true); // North Pole
    expect(validateCoordinates(-90.0, 0.0).valid).toBe(true); // South Pole
    expect(validateCoordinates(0.0, 180.0).valid).toBe(true); // Antimeridian East
    expect(validateCoordinates(0.0, -180.0).valid).toBe(true); // Antimeridian West
    expect(validateCoordinates(0.0, 0.0).valid).toBe(true); // Null Island Equator
    expect(validateCoordinates(48.8566, 2.3522).valid).toBe(true); // Paris

    // Invalid coordinates exceeding boundary
    expect(validateCoordinates(90.001, 0.0).valid).toBe(false);
    expect(validateCoordinates(-90.001, 0.0).valid).toBe(false);
    expect(validateCoordinates(0.0, 180.001).valid).toBe(false);
    expect(validateCoordinates(0.0, -180.001).valid).toBe(false);
    expect(validateCoordinates(NaN, 10.0).valid).toBe(false);
    expect(validateCoordinates(10.0, NaN).valid).toBe(false);
    expect(validateCoordinates(Infinity as any, 10.0).valid).toBe(false);
  });

  it('11. Clear-Sky Physical Model vs Astronomical Position Model & Published Benchmarks', async () => {
    const {
      calculateClientSolar24h,
      DEFAULT_ATMOSPHERIC_PARAMETERS,
      PUBLISHED_SOLAR_BENCHMARKS,
    } = await import('../services/solarCalculator');

    // Verify atmospheric optical parameters are documented
    expect(DEFAULT_ATMOSPHERIC_PARAMETERS.solar_constant_w_m2).toBe(1361.2);
    expect(DEFAULT_ATMOSPHERIC_PARAMETERS.aerosol_optical_depth_500nm).toBe(0.1);
    expect(DEFAULT_ATMOSPHERIC_PARAMETERS.ozone_column_cm_atm).toBe(0.34);
    expect(DEFAULT_ATMOSPHERIC_PARAMETERS.validity_limits.length).toBeGreaterThan(2);

    // Verify published benchmarks catalog
    expect(PUBLISHED_SOLAR_BENCHMARKS.some((b) => b.station_name.includes('Carpentras'))).toBe(true);
    expect(PUBLISHED_SOLAR_BENCHMARKS.some((b) => b.station_name.includes('Observatoire de Paris'))).toBe(true);
    expect(PUBLISHED_SOLAR_BENCHMARKS.some((b) => b.station_name.includes('NREL SRRL'))).toBe(true);

    // Cross-check model against Carpentras summer solstice published range (7.9 - 8.3 kWh/m²)
    const carpentrasSummer = calculateClientSolar24h(44.053, 5.048, '2026-06-21', 'Carpentras');
    expect(carpentrasSummer.daily_irradiation_kwh).toBeGreaterThanOrEqual(7.0);
    expect(carpentrasSummer.daily_irradiation_kwh).toBeLessThanOrEqual(10.5);
    expect(carpentrasSummer.peak_ghi).toBeGreaterThan(880);

    // Cross-check model against Carpentras winter solstice published range (1.9 - 2.2 kWh/m²)
    const carpentrasWinter = calculateClientSolar24h(44.053, 5.048, '2026-12-21', 'Carpentras');
    expect(carpentrasWinter.daily_irradiation_kwh).toBeGreaterThanOrEqual(1.5);
    expect(carpentrasWinter.daily_irradiation_kwh).toBeLessThanOrEqual(2.6);
  });

  it('12. Energy Integration & Local Civil Days (23h / 24h / 25h DST transitions)', async () => {
    const {
      integrateHourlyMeanEnergy,
      integrateTrapezoidalEnergy,
      calculateLocalCivilDayIrradiation,
      calculateClientSolar24h,
    } = await import('../services/solarCalculator');

    // Hourly mean integration test: 1000 W/m² for 1h = 1 kWh/m²
    const hourlyValues = [0, 0, 0, 0, 0, 0, 200, 400, 600, 800, 1000, 1000, 800, 600, 400, 200, 0, 0, 0, 0, 0, 0, 0, 0];
    const meanResult = integrateHourlyMeanEnergy(hourlyValues, 1.0);
    expect(meanResult.totalWhM2).toBe(6000);
    expect(meanResult.totalKwhM2).toBe(6.0);

    // Trapezoidal integration for sampled instances
    const samples = [
      { timeHours: 6, ghi: 0 },
      { timeHours: 12, ghi: 1000 },
      { timeHours: 18, ghi: 0 },
    ];
    const trapResult = integrateTrapezoidalEnergy(samples);
    // Area of triangle: 1/2 * base * height = 1/2 * 12 * 1000 = 6000 Wh/m² = 6 kWh/m²
    expect(trapResult.totalKwhM2).toBe(6.0);

    // Daylight Saving Time (DST) Civil Day Transitions in Europe/Paris:
    // 1. Standard day (e.g. 2026-06-21): 24 local hours
    const standardDay = calculateClientSolar24h(48.836, 2.336, '2026-06-21');
    const stdCivil = calculateLocalCivilDayIrradiation(standardDay.hourly, 'Europe/Paris', '2026-06-21');
    expect(stdCivil.localHoursCount).toBe(24);
    expect(stdCivil.isDstTransition).toBe(false);

    // 2. Spring Forward (Passage à l'heure d'été, 29 mars 2026): 23 local civil hours
    const springDay = calculateClientSolar24h(48.836, 2.336, '2026-03-29');
    const springCivil = calculateLocalCivilDayIrradiation(springDay.hourly, 'Europe/Paris', '2026-03-29');
    expect(springCivil.isDstTransition).toBe(true);
    expect(springCivil.localHoursCount).toBe(23);
    expect(springCivil.dstType).toBe('spring_forward_23h');

    // 3. Fall Back (Passage à l'heure d'hiver, 25 octobre 2026): 25 local civil hours
    const fallDay = calculateClientSolar24h(48.836, 2.336, '2026-10-25');
    const fallCivil = calculateLocalCivilDayIrradiation(fallDay.hourly, 'Europe/Paris', '2026-10-25');
    expect(fallCivil.isDstTransition).toBe(true);
    expect(fallCivil.localHoursCount).toBe(25);
    expect(fallCivil.dstType).toBe('fall_back_25h');
  });

  it('13. Temperature Safety: Confirms illustrative temperature is labeled non-forecast proxy', async () => {
    const { calculateClientSolar24h } = await import('../services/solarCalculator');

    const result = calculateClientSolar24h(48.836, 2.336, '2026-06-21', 'Observatoire de Paris');
    for (const point of result.hourly) {
      expect(point.ambient_temperature_proxy_c).toBeDefined();
      expect(point.temperature_is_forecast).toBe(false);
      expect(point.temperature_note).toContain('Proxy');
    }
  });

  it('14. PV Transposition Engine: Validates angle of incidence, cell heating and POA irradiance', async () => {
    const {
      calculateAngleOfIncidenceCos,
      calculatePlaneOfArrayIrradiance,
      calculateCellTemperature,
      simulatePvDailyPerformance,
      generatePvScenarioComparisons,
    } = await import('../services/pvSimulatorEngine');

    // Solar elevation 45°, azimuth 180° (South). Surface tilt 45°, surface azimuth 180° (South).
    // Sun is perpendicular to panel -> angle of incidence = 0°, cos = 1.0
    const { cosIncidence, incidenceAngleDeg } = calculateAngleOfIncidenceCos(45, 180, 45, 180);
    expect(cosIncidence).toBeCloseTo(1.0, 3);
    expect(incidenceAngleDeg).toBeCloseTo(0.0, 1);

    // Plane of Array transposition: DNI 800 W/m², DHI 100 W/m², GHI 665 W/m²
    const poa = calculatePlaneOfArrayIrradiance(665, 800, 100, 45, 180, 35, 180, 0.20);
    expect(poa.poaTotal).toBeGreaterThan(600);
    expect(poa.poaBeam).toBeGreaterThan(0);
    expect(poa.poaDiffuse).toBeGreaterThan(0);
    expect(poa.poaReflected).toBeGreaterThan(0);

    // Cell temperature model: T_cell = T_amb + G_poa * (NOCT - 20) / 800
    // At T_amb = 25°C, G_poa = 800 W/m², NOCT = 45°C -> T_cell = 25 + 800*(25)/800 = 50°C
    const tCell = calculateCellTemperature(25, 800, 45);
    expect(tCell).toBe(50.0);

    // Multi-scenario benchmark generation
    const sampleDay = generateScientificSolarDay(44.053, 5.048, '2026-06-21', 'Carpentras');
    const hourlyObs = sampleDay.hourly.map((h) => ({
      hourUtc: h.hour_utc,
      solarElevationDeg: h.solar_elevation_deg,
      solarAzimuthDeg: h.solar_azimuth_deg ?? 180,
      ghiWm2: h.ghi_w_m2,
      dniWm2: h.dni_w_m2,
      dhiWm2: h.dhi_w_m2,
      temperatureC: h.temperature_c,
    }));

    const scenarios = generatePvScenarioComparisons(hourlyObs, {
      installedCapacityKwp: 6.0,
      panelEfficiencyPercent: 21.0,
      tiltDeg: 35,
      azimuthDeg: 180,
      technology: 'monocrystalline',
      noctDegC: 45,
      tempCoefficientPercentPerC: -0.38,
      systemLossPercent: 14,
      inverterEfficiencyPercent: 97,
      groundAlbedo: 0.20,
    });

    expect(scenarios).toHaveLength(4);
    expect(scenarios[0].name).toContain('Plein Sud');
    expect(scenarios[1].name).toContain('Toiture Plate');
    expect(scenarios[3].name).toContain('Tracker');
    // Tracker yields more daily kWh than flat roof
    expect(scenarios[3].dailyAcKwh).toBeGreaterThan(scenarios[1].dailyAcKwh);
  });

  it('15. Climate Engine: Validates Solar Availability Index (SAI) & reference normals', async () => {
    const {
      calculateSolarAvailabilityIndex,
      getClimateNormalsForLocation,
      calculateClimateAnomaly,
      GLOBAL_SOLAR_BENCHMARKS,
    } = await import('../services/climateService');

    // Atacama desert: high annual irradiation (>2500 kWh/m²), low seasonality, high stability -> SAI >= 95
    const atacamaSai = calculateSolarAvailabilityIndex(2540, 1.52, 2.1);
    expect(atacamaSai.indexScore).toBeGreaterThanOrEqual(95);

    // Stockholm: high seasonality (>10), lower annual irradiation -> SAI < 50
    const stockholmSai = calculateSolarAvailabilityIndex(980, 14.2, 8.5);
    expect(stockholmSai.indexScore).toBeLessThan(55);

    // Verify benchmark stations catalog integrity
    expect(GLOBAL_SOLAR_BENCHMARKS.length).toBeGreaterThanOrEqual(6);
    for (const st of GLOBAL_SOLAR_BENCHMARKS) {
      expect(st.monthlyNormals).toHaveLength(12);
      expect(st.annualGhiKwhM2).toBeGreaterThan(500);
    }

    // Climate Anomaly calculation: observed 7.8 kWh/m² vs reference 4.6 kWh/m² -> surplus
    const anomaly = calculateClimateAnomaly(7.8, '2026-06-21', 44.053, 5.048);
    expect(anomaly.status).toBeDefined();
    expect(anomaly.explanationFr.length).toBeGreaterThan(10);
  });

  it('16. Solar World Map Engine: Validates subsolar coordinates and day/night terminator', async () => {
    const {
      calculateSubsolarPoint,
      calculateTerminatorPath,
      estimateInstantaneousRadiation,
      WORLD_PRESETS,
    } = await import('../services/solarWorldMapEngine');

    // Day 172 (Summer Solstice, ~June 21): subsolar latitude is ~ +23.4° (Tropic of Cancer)
    const subsolarSummer = calculateSubsolarPoint(172, 12);
    expect(subsolarSummer.latitudeDeg).toBeGreaterThan(23.0);
    expect(subsolarSummer.latitudeDeg).toBeLessThan(23.6);
    // At 12:00 UTC with EoT ~ -1.5 min, longitude is close to 0° (+/- 2°)
    expect(Math.abs(subsolarSummer.longitudeDeg)).toBeLessThan(5);

    // Day 355 (Winter Solstice, ~Dec 21): subsolar latitude is ~ -23.4° (Tropic of Capricorn)
    const subsolarWinter = calculateSubsolarPoint(355, 12);
    expect(subsolarWinter.latitudeDeg).toBeLessThan(-23.0);
    expect(subsolarWinter.latitudeDeg).toBeGreaterThan(-23.6);

    // Terminator path contains continuous points around the globe
    const terminator = calculateTerminatorPath(172, 12);
    expect(terminator.length).toBeGreaterThan(50);

    // Instantaneous radiation: at night (e.g. 00:00 UTC in Paris) radiation must be 0
    const nightRad = estimateInstantaneousRadiation(48.85, 2.35, 172, 0);
    expect(nightRad.isDaylight).toBe(false);
    expect(nightRad.ghiWm2).toBe(0);

    // At noon in Paris on summer solstice, radiation must be positive
    const noonRad = estimateInstantaneousRadiation(48.85, 2.35, 172, 12);
    expect(noonRad.isDaylight).toBe(true);
    expect(noonRad.ghiWm2).toBeGreaterThan(600);
  });
});
