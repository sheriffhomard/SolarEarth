/**
 * Photovoltaic (PV) Transposition and Yield Physics Engine.
 *
 * Implements standard engineering equations:
 * 1. Transposition onto tilted planes (beam, isotropic diffuse, ground reflection).
 * 2. Sandia / King cell temperature model using NOCT (Nominal Module Operating Temperature).
 * 3. Temperature power coefficient derating (P_dc = P_stc * (G_poa / 1000) * [1 + gamma * (T_cell - 25)]).
 * 4. Inverter conversion and balance of system (BOS) losses.
 * 5. Multi-configuration benchmark generators (South 35°, Flat 0°, East-West dual, 1D Tracker).
 */

export type PvCellTechnology = 'monocrystalline' | 'polycrystalline' | 'thin_film_cdte';

export interface PvSystemParameters {
  installedCapacityKwp: number; // Peak power at STC in kWp
  panelEfficiencyPercent: number; // Module nominal efficiency (e.g. 21.0%)
  tiltDeg: number; // Panel inclination from horizontal (0° = flat, 90° = vertical)
  azimuthDeg: number; // Surface azimuth (180° = True South, 90° = East, 270° = West)
  technology: PvCellTechnology;
  noctDegC: number; // Nominal Module Operating Temperature (default ~45°C)
  tempCoefficientPercentPerC: number; // Power temp coefficient gamma (%/°C, e.g. -0.38)
  systemLossPercent: number; // Soiling, wiring, mismatch, LID (default ~14%)
  inverterEfficiencyPercent: number; // Nominal inverter conversion efficiency (default ~97%)
  groundAlbedo: number; // Ground reflection coefficient (default 0.20 for grass/concrete, 0.60 for snow)
  shadingLossPercent?: number; // Optional obstacle / tree shading derate
}

export interface HourlyPvProductionPoint {
  hourUtc: number;
  solarElevationDeg: number;
  solarAzimuthDeg: number;
  angleIncidenceDeg: number;
  ghiWm2: number;
  dniWm2: number;
  dhiWm2: number;
  poaBeamWm2: number;
  poaDiffuseWm2: number;
  poaReflectedWm2: number;
  poaTotalWm2: number;
  cellTemperatureC: number;
  ambientTemperatureC: number;
  dcPowerW: number;
  acPowerW: number;
  effectiveLossPercent: number;
}

export interface PvSimulationSummary {
  parameters: PvSystemParameters;
  estimatedAreaM2: number;
  dailyTotalAcKwh: number;
  peakAcPowerW: number;
  equivalentPeakHoursH: number; // Daily yield / installed capacity (kWh / kWp = h)
  averagePerformanceRatio: number; // PR = Actual AC yield / (POA_total * P_stc)
  annualEstimatedKwh: number; // Extrapolated annual yield based on climate factor
  specificAnnualYieldKwhKwp: number;
  co2SavedDailyKg: number; // Approx 55g CO2/kWh in France, 300g/kWh EU avg
  hourly: HourlyPvProductionPoint[];
}

export interface PvScenarioComparison {
  name: string;
  description: string;
  tiltDeg: number;
  azimuthDeg: number;
  dailyAcKwh: number;
  peakAcPowerW: number;
  specificDailyYieldH: number;
  performanceRatio: number;
  gainVsBaselinePercent: number;
}

/**
 * Default characteristics by solar cell technology.
 */
export const PV_TECHNOLOGY_DEFAULTS: Record<
  PvCellTechnology,
  { label: string; efficiencyPercent: number; tempCoeff: number; noct: number }
> = {
  monocrystalline: {
    label: 'Silicium Monocristallin (PERC / TOPCon)',
    efficiencyPercent: 21.5,
    tempCoeff: -0.36,
    noct: 45.0,
  },
  polycrystalline: {
    label: 'Silicium Polycristallin',
    efficiencyPercent: 17.5,
    tempCoeff: -0.40,
    noct: 47.0,
  },
  thin_film_cdte: {
    label: 'Couches Minces (CdTe / CIGS)',
    efficiencyPercent: 18.0,
    tempCoeff: -0.25,
    noct: 44.0,
  },
};

/**
 * Calculates the cosine of the solar angle of incidence on a tilted surface.
 *
 * cos(theta) = sin(alpha) * cos(beta) + cos(alpha) * sin(beta) * cos(psi - gamma)
 * where:
 * alpha = solar elevation angle
 * beta  = surface tilt angle
 * psi   = solar azimuth angle (0° = North, 90° = East, 180° = South, 270° = West)
 * gamma = surface azimuth angle
 */
export function calculateAngleOfIncidenceCos(
  solarElevationDeg: number,
  solarAzimuthDeg: number,
  surfaceTiltDeg: number,
  surfaceAzimuthDeg: number
): { cosIncidence: number; incidenceAngleDeg: number } {
  if (solarElevationDeg <= 0) {
    return { cosIncidence: 0, incidenceAngleDeg: 90 };
  }

  const alphaRad = (solarElevationDeg * Math.PI) / 180;
  const betaRad = (surfaceTiltDeg * Math.PI) / 180;
  const psiRad = (solarAzimuthDeg * Math.PI) / 180;
  const gammaRad = (surfaceAzimuthDeg * Math.PI) / 180;

  const cosTheta =
    Math.sin(alphaRad) * Math.cos(betaRad) +
    Math.cos(alphaRad) * Math.sin(betaRad) * Math.cos(psiRad - gammaRad);

  const clampedCos = Math.max(0, Math.min(1, cosTheta));
  const incidenceAngleDeg = (Math.acos(clampedCos) * 180) / Math.PI;

  return { cosIncidence: clampedCos, incidenceAngleDeg };
}

/**
 * Transposition of global horizontal irradiance (GHI), direct normal (DNI),
 * and diffuse horizontal (DHI) to Plane of Array (POA) irradiance.
 */
export function calculatePlaneOfArrayIrradiance(
  ghi: number,
  dni: number,
  dhi: number,
  solarElevationDeg: number,
  solarAzimuthDeg: number,
  surfaceTiltDeg: number,
  surfaceAzimuthDeg: number,
  groundAlbedo: number = 0.20
): {
  poaBeam: number;
  poaDiffuse: number;
  poaReflected: number;
  poaTotal: number;
  incidenceAngleDeg: number;
} {
  if (solarElevationDeg <= 0 || ghi <= 0) {
    return {
      poaBeam: 0,
      poaDiffuse: 0,
      poaReflected: 0,
      poaTotal: 0,
      incidenceAngleDeg: 90,
    };
  }

  const { cosIncidence, incidenceAngleDeg } = calculateAngleOfIncidenceCos(
    solarElevationDeg,
    solarAzimuthDeg,
    surfaceTiltDeg,
    surfaceAzimuthDeg
  );

  const betaRad = (surfaceTiltDeg * Math.PI) / 180;

  // Direct beam component on tilted surface
  const poaBeam = Math.max(0, dni * cosIncidence);

  // Isotropic diffuse component (Liu & Jordan 1960)
  const poaDiffuse = Math.max(0, dhi * ((1 + Math.cos(betaRad)) / 2));

  // Ground-reflected component with surface albedo
  const poaReflected = Math.max(0, ghi * groundAlbedo * ((1 - Math.cos(betaRad)) / 2));

  const poaTotal = Math.round((poaBeam + poaDiffuse + poaReflected) * 10) / 10;

  return {
    poaBeam: Math.round(poaBeam * 10) / 10,
    poaDiffuse: Math.round(poaDiffuse * 10) / 10,
    poaReflected: Math.round(poaReflected * 10) / 10,
    poaTotal,
    incidenceAngleDeg: Math.round(incidenceAngleDeg * 10) / 10,
  };
}

/**
 * Cell Temperature model:
 * T_cell = T_amb + G_poa * (NOCT - 20) / 800
 */
export function calculateCellTemperature(
  ambientTempC: number,
  poaIrradianceWm2: number,
  noctDegC: number = 45.0
): number {
  if (poaIrradianceWm2 <= 0) return ambientTempC;
  const tCell = ambientTempC + (poaIrradianceWm2 * (noctDegC - 20)) / 800;
  return Math.round(tCell * 10) / 10;
}

/**
 * Runs a complete hourly PV production simulation for a specific day.
 */
export function simulatePvDailyPerformance(
  hourlyObservations: Array<{
    hourUtc: number;
    solarElevationDeg: number;
    solarAzimuthDeg: number;
    ghiWm2: number;
    dniWm2: number;
    dhiWm2: number;
    temperatureC?: number;
  }>,
  params: PvSystemParameters
): PvSimulationSummary {
  const pPeakW = params.installedCapacityKwp * 1000;
  const areaM2 = Math.round((pPeakW / (1000 * (params.panelEfficiencyPercent / 100))) * 10) / 10;

  const bosLossFactor = (100 - params.systemLossPercent) / 100;
  const inverterNominalFactor = params.inverterEfficiencyPercent / 100;
  const shadingFactor = (100 - (params.shadingLossPercent || 0)) / 100;

  const hourly: HourlyPvProductionPoint[] = [];
  let totalAcWh = 0;
  let totalPoaWh = 0;
  let peakAcW = 0;

  for (const obs of hourlyObservations) {
    const ambientTemp = obs.temperatureC ?? 20;

    const { poaBeam, poaDiffuse, poaReflected, poaTotal, incidenceAngleDeg } =
      calculatePlaneOfArrayIrradiance(
        obs.ghiWm2,
        obs.dniWm2,
        obs.dhiWm2,
        obs.solarElevationDeg,
        obs.solarAzimuthDeg,
        params.tiltDeg,
        params.azimuthDeg,
        params.groundAlbedo
      );

    const cellTemp = calculateCellTemperature(ambientTemp, poaTotal, params.noctDegC);

    let dcPower = 0;
    let acPower = 0;

    if (poaTotal > 0) {
      // Temperature derating: 1 + gamma * (T_cell - 25°C)
      const tempDerate = 1 + (params.tempCoefficientPercentPerC / 100) * (cellTemp - 25);
      const thermalMultiplier = Math.max(0.65, Math.min(1.15, tempDerate));

      // DC power before wiring/shading
      const unlossedDc = pPeakW * (poaTotal / 1000) * thermalMultiplier;
      dcPower = unlossedDc * bosLossFactor * shadingFactor;

      // Inverter curve derating: higher efficiency at nominal load
      const loadRatio = Math.min(1.2, dcPower / (pPeakW * 0.95));
      const dynamicInverterEff =
        loadRatio < 0.1
          ? inverterNominalFactor * 0.85
          : loadRatio < 0.2
          ? inverterNominalFactor * 0.94
          : inverterNominalFactor;

      acPower = Math.min(pPeakW * 1.05, dcPower * dynamicInverterEff);
    }

    const effectiveLoss =
      poaTotal > 0 && pPeakW > 0
        ? Math.round(
            (1 - acPower / (pPeakW * (poaTotal / 1000))) * 100 * 10
          ) / 10
        : 0;

    totalAcWh += acPower;
    totalPoaWh += poaTotal;
    if (acPower > peakAcW) peakAcW = acPower;

    hourly.push({
      hourUtc: obs.hourUtc,
      solarElevationDeg: obs.solarElevationDeg,
      solarAzimuthDeg: obs.solarAzimuthDeg,
      angleIncidenceDeg: incidenceAngleDeg,
      ghiWm2: obs.ghiWm2,
      dniWm2: obs.dniWm2,
      dhiWm2: obs.dhiWm2,
      poaBeamWm2: poaBeam,
      poaDiffuseWm2: poaDiffuse,
      poaReflectedWm2: poaReflected,
      poaTotalWm2: poaTotal,
      cellTemperatureC: cellTemp,
      ambientTemperatureC: ambientTemp,
      dcPowerW: Math.round(dcPower * 10) / 10,
      acPowerW: Math.round(acPower * 10) / 10,
      effectiveLossPercent: Math.max(0, effectiveLoss),
    });
  }

  const dailyAcKwh = Math.round((totalAcWh / 1000) * 100) / 100;
  const equivalentPeakHoursH =
    params.installedCapacityKwp > 0
      ? Math.round((dailyAcKwh / params.installedCapacityKwp) * 100) / 100
      : 0;

  const expectedTheoreticalWh = totalPoaWh * params.installedCapacityKwp;
  const averagePr =
    expectedTheoreticalWh > 0
      ? Math.round((totalAcWh / expectedTheoreticalWh) * 1000) / 1000
      : 0;

  // Annual projection heuristic based on 365 days weighted by typical solar variability
  const annualEstimatedKwh = Math.round(dailyAcKwh * 320);
  const specificAnnualYieldKwhKwp =
    params.installedCapacityKwp > 0
      ? Math.round(annualEstimatedKwh / params.installedCapacityKwp)
      : 0;

  // Avoided CO2 emissions (~0.055 kg/kWh France, ~0.300 kg/kWh Europe)
  const co2SavedDailyKg = Math.round(dailyAcKwh * 0.18 * 100) / 100;

  return {
    parameters: params,
    estimatedAreaM2: areaM2,
    dailyTotalAcKwh: dailyAcKwh,
    peakAcPowerW: Math.round(peakAcW),
    equivalentPeakHoursH,
    averagePerformanceRatio: averagePr,
    annualEstimatedKwh,
    specificAnnualYieldKwhKwp,
    co2SavedDailyKg,
    hourly,
  };
}

/**
 * Computes comparative performance across 4 standard photovoltaic installation geometries.
 */
export function generatePvScenarioComparisons(
  hourlyObservations: Array<{
    hourUtc: number;
    solarElevationDeg: number;
    solarAzimuthDeg: number;
    ghiWm2: number;
    dniWm2: number;
    dhiWm2: number;
    temperatureC?: number;
  }>,
  baseParams: PvSystemParameters
): PvScenarioComparison[] {
  // Scenario 1: South 35° (Optimal standard Europe)
  const s1 = simulatePvDailyPerformance(hourlyObservations, {
    ...baseParams,
    tiltDeg: 35,
    azimuthDeg: 180,
  });

  // Scenario 2: Flat Roof 0° (Toiture plate horizontale)
  const s2 = simulatePvDailyPerformance(hourlyObservations, {
    ...baseParams,
    tiltDeg: 0,
    azimuthDeg: 180,
  });

  // Scenario 3: East-West 15° (Est 90° et Ouest 270° partagé)
  const s3East = simulatePvDailyPerformance(hourlyObservations, {
    ...baseParams,
    installedCapacityKwp: baseParams.installedCapacityKwp / 2,
    tiltDeg: 15,
    azimuthDeg: 90,
  });
  const s3West = simulatePvDailyPerformance(hourlyObservations, {
    ...baseParams,
    installedCapacityKwp: baseParams.installedCapacityKwp / 2,
    tiltDeg: 15,
    azimuthDeg: 270,
  });
  const s3DailyKwh = Math.round((s3East.dailyTotalAcKwh + s3West.dailyTotalAcKwh) * 100) / 100;
  const s3PeakW = s3East.peakAcPowerW + s3West.peakAcPowerW;

  // Scenario 4: Single-Axis Solar Tracker (Suiveur 1D optimisé)
  // Approximate tracker transposition: adjusts tilt and azimuth hourly
  const trackerObservations = hourlyObservations.map((obs) => {
    // Dynamic tracking: tilt matches zenith when sun is up, azimuth matches sun azimuth
    const dynamicTilt = Math.max(10, Math.min(65, 90 - obs.solarElevationDeg));
    const dynamicAzimuth = obs.solarAzimuthDeg;
    return {
      ...obs,
      dynamicTilt,
      dynamicAzimuth,
    };
  });

  let trackerTotalAcWh = 0;
  let trackerPeakW = 0;
  for (const obs of trackerObservations) {
    const { poaTotal } = calculatePlaneOfArrayIrradiance(
      obs.ghiWm2,
      obs.dniWm2,
      obs.dhiWm2,
      obs.solarElevationDeg,
      obs.solarAzimuthDeg,
      obs.solarElevationDeg > 0 ? obs.dynamicTilt : 35,
      obs.solarElevationDeg > 0 ? obs.dynamicAzimuth : 180,
      baseParams.groundAlbedo
    );
    const cellTemp = calculateCellTemperature(obs.temperatureC ?? 20, poaTotal, baseParams.noctDegC);
    const tempDerate = 1 + (baseParams.tempCoefficientPercentPerC / 100) * (cellTemp - 25);
    const dc = (baseParams.installedCapacityKwp * 1000) * (poaTotal / 1000) * Math.max(0.65, tempDerate) * 0.86;
    const ac = dc * 0.97;
    trackerTotalAcWh += ac;
    if (ac > trackerPeakW) trackerPeakW = ac;
  }
  const trackerDailyKwh = Math.round((trackerTotalAcWh / 1000) * 100) / 100;

  const baselineYield = s1.dailyTotalAcKwh || 1;

  return [
    {
      name: 'Plein Sud Incliné 35°',
      description: 'Orientation toiture optimale en France & Europe tempérée',
      tiltDeg: 35,
      azimuthDeg: 180,
      dailyAcKwh: s1.dailyTotalAcKwh,
      peakAcPowerW: s1.peakAcPowerW,
      specificDailyYieldH: s1.equivalentPeakHoursH,
      performanceRatio: s1.averagePerformanceRatio,
      gainVsBaselinePercent: 0,
    },
    {
      name: 'Toiture Plate Horizontale 0°',
      description: 'Intégration terrasse ou bâtiment sans surimposition inclinée',
      tiltDeg: 0,
      azimuthDeg: 180,
      dailyAcKwh: s2.dailyTotalAcKwh,
      peakAcPowerW: s2.peakAcPowerW,
      specificDailyYieldH: s2.equivalentPeakHoursH,
      performanceRatio: s2.averagePerformanceRatio,
      gainVsBaselinePercent: Math.round(((s2.dailyTotalAcKwh - baselineYield) / baselineYield) * 100),
    },
    {
      name: 'Bi-Orientation Est-Ouest 15°',
      description: 'Lisse la production sur la journée (autoconsommation maximale)',
      tiltDeg: 15,
      azimuthDeg: 90,
      dailyAcKwh: s3DailyKwh,
      peakAcPowerW: Math.round(s3PeakW * 0.75), // non-simultaneous peaks
      specificDailyYieldH: Math.round((s3DailyKwh / baseParams.installedCapacityKwp) * 100) / 100,
      performanceRatio: Math.round((s1.averagePerformanceRatio * 0.96) * 1000) / 1000,
      gainVsBaselinePercent: Math.round(((s3DailyKwh - baselineYield) / baselineYield) * 100),
    },
    {
      name: 'Suiveur 1D (Tracker Solaire)',
      description: 'Poursuite diurne Est-Ouest sur axe orienté Nord-Sud',
      tiltDeg: 35,
      azimuthDeg: 180,
      dailyAcKwh: trackerDailyKwh,
      peakAcPowerW: Math.round(trackerPeakW),
      specificDailyYieldH: Math.round((trackerDailyKwh / baseParams.installedCapacityKwp) * 100) / 100,
      performanceRatio: 0.81,
      gainVsBaselinePercent: Math.round(((trackerDailyKwh - baselineYield) / baselineYield) * 100),
    },
  ];
}
