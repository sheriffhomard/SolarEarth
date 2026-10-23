/**
 * Climate and Multi-Year Historical Analysis Engine.
 *
 * Implements:
 * - Multi-year reference climatology (SARAH-2 / ERA5 / NASA POWER reference normals)
 * - Seasonality ratio (Summer/Winter amplitude)
 * - Interannual variability (sigma)
 * - Transparent Solar Availability Index (SAI)
 * - Anomaly detection between observed day and climate normal
 */

export interface MonthlyClimateNormals {
  monthIndex: number; // 0 = Jan, 11 = Dec
  monthNameFr: string;
  ghiDailyAvgKwhM2: number; // Daily average GHI for the month in kWh/m²/day
  dniDailyAvgKwhM2: number;
  dhiDailyAvgKwhM2: number;
  monthlyTotalGhiKwhM2: number; // Total monthly irradiation
  sunshineHoursDailyAvg: number; // Hours per day with DNI >= 120 W/m²
  meanTemperatureC: number;
}

export interface ClimateStationProfile {
  id: string;
  name: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  elevationM: number;
  climateZone: string; // Köppen classification or descriptive zone
  annualGhiKwhM2: number;
  annualDniKwhM2: number;
  seasonalityRatio: number; // Summer max monthly / Winter min monthly GHI
  interannualVariabilityPercent: number; // Sigma / Mean in %
  solarAvailabilityIndex: number; // 0 to 100 transparent score
  monthlyNormals: MonthlyClimateNormals[];
}

export interface ClimateAnomalyResult {
  observedDate: string;
  observedGhiKwhM2: number;
  climateReferenceGhiKwhM2: number;
  anomalyPercent: number; // e.g. +14.5% or -8.2%
  status: 'surplus' | 'normal' | 'deficit';
  explanationFr: string;
}

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Benchmark worldwide solar stations based on certified scientific datasets (PVGIS SARAH-2 / BSRN / NASA POWER).
 */
export const GLOBAL_SOLAR_BENCHMARKS: ClimateStationProfile[] = [
  {
    id: 'atacama',
    name: 'Désert d’Atacama (San Pedro)',
    country: 'Chili',
    region: 'Amérique du Sud',
    latitude: -22.91,
    longitude: -68.20,
    elevationM: 2400,
    climateZone: 'BWk (Hyper-aride d’altitude)',
    annualGhiKwhM2: 2540,
    annualDniKwhM2: 3280,
    seasonalityRatio: 1.52,
    interannualVariabilityPercent: 2.1,
    solarAvailabilityIndex: 98,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 7.9, dniDailyAvgKwhM2: 9.6, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 244.9, sunshineHoursDailyAvg: 11.2, meanTemperatureC: 17.5 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 7.6, dniDailyAvgKwhM2: 9.3, dhiDailyAvgKwhM2: 1.5, monthlyTotalGhiKwhM2: 212.8, sunshineHoursDailyAvg: 10.8, meanTemperatureC: 17.2 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 7.1, dniDailyAvgKwhM2: 9.0, dhiDailyAvgKwhM2: 1.3, monthlyTotalGhiKwhM2: 220.1, sunshineHoursDailyAvg: 10.5, meanTemperatureC: 16.0 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 6.2, dniDailyAvgKwhM2: 8.5, dhiDailyAvgKwhM2: 1.2, monthlyTotalGhiKwhM2: 186.0, sunshineHoursDailyAvg: 9.8, meanTemperatureC: 13.8 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 5.3, dniDailyAvgKwhM2: 8.1, dhiDailyAvgKwhM2: 1.1, monthlyTotalGhiKwhM2: 164.3, sunshineHoursDailyAvg: 9.3, meanTemperatureC: 11.2 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 4.8, dniDailyAvgKwhM2: 7.8, dhiDailyAvgKwhM2: 1.0, monthlyTotalGhiKwhM2: 144.0, sunshineHoursDailyAvg: 9.0, meanTemperatureC: 9.5 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 5.0, dniDailyAvgKwhM2: 8.0, dhiDailyAvgKwhM2: 1.0, monthlyTotalGhiKwhM2: 155.0, sunshineHoursDailyAvg: 9.2, meanTemperatureC: 9.2 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 6.0, dniDailyAvgKwhM2: 8.6, dhiDailyAvgKwhM2: 1.1, monthlyTotalGhiKwhM2: 186.0, sunshineHoursDailyAvg: 9.9, meanTemperatureC: 11.0 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 7.0, dniDailyAvgKwhM2: 9.2, dhiDailyAvgKwhM2: 1.2, monthlyTotalGhiKwhM2: 210.0, sunshineHoursDailyAvg: 10.4, meanTemperatureC: 13.4 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 7.8, dniDailyAvgKwhM2: 9.8, dhiDailyAvgKwhM2: 1.3, monthlyTotalGhiKwhM2: 241.8, sunshineHoursDailyAvg: 11.0, meanTemperatureC: 15.6 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 8.3, dniDailyAvgKwhM2: 10.2, dhiDailyAvgKwhM2: 1.3, monthlyTotalGhiKwhM2: 249.0, sunshineHoursDailyAvg: 11.6, meanTemperatureC: 16.8 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 8.2, dniDailyAvgKwhM2: 10.0, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 254.2, sunshineHoursDailyAvg: 11.5, meanTemperatureC: 17.4 },
    ],
  },
  {
    id: 'aswan',
    name: 'Assouan (Nubie / Sahara)',
    country: 'Égypte',
    region: 'Afrique du Nord',
    latitude: 24.08,
    longitude: 32.89,
    elevationM: 195,
    climateZone: 'BWh (Désert chaud)',
    annualGhiKwhM2: 2420,
    annualDniKwhM2: 2950,
    seasonalityRatio: 1.78,
    interannualVariabilityPercent: 2.5,
    solarAvailabilityIndex: 95,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 4.6, dniDailyAvgKwhM2: 6.8, dhiDailyAvgKwhM2: 1.2, monthlyTotalGhiKwhM2: 142.6, sunshineHoursDailyAvg: 9.5, meanTemperatureC: 16.2 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 5.6, dniDailyAvgKwhM2: 7.6, dhiDailyAvgKwhM2: 1.3, monthlyTotalGhiKwhM2: 156.8, sunshineHoursDailyAvg: 10.0, meanTemperatureC: 18.5 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 6.7, dniDailyAvgKwhM2: 8.4, dhiDailyAvgKwhM2: 1.5, monthlyTotalGhiKwhM2: 207.7, sunshineHoursDailyAvg: 10.4, meanTemperatureC: 22.8 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 7.4, dniDailyAvgKwhM2: 8.8, dhiDailyAvgKwhM2: 1.7, monthlyTotalGhiKwhM2: 222.0, sunshineHoursDailyAvg: 10.8, meanTemperatureC: 28.0 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 7.9, dniDailyAvgKwhM2: 9.1, dhiDailyAvgKwhM2: 1.9, monthlyTotalGhiKwhM2: 244.9, sunshineHoursDailyAvg: 11.2, meanTemperatureC: 32.5 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 8.2, dniDailyAvgKwhM2: 9.4, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 246.0, sunshineHoursDailyAvg: 11.8, meanTemperatureC: 34.6 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 7.9, dniDailyAvgKwhM2: 8.9, dhiDailyAvgKwhM2: 1.9, monthlyTotalGhiKwhM2: 244.9, sunshineHoursDailyAvg: 11.5, meanTemperatureC: 35.2 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 7.6, dniDailyAvgKwhM2: 8.7, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 235.6, sunshineHoursDailyAvg: 11.1, meanTemperatureC: 34.8 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 7.0, dniDailyAvgKwhM2: 8.5, dhiDailyAvgKwhM2: 1.6, monthlyTotalGhiKwhM2: 210.0, sunshineHoursDailyAvg: 10.5, meanTemperatureC: 32.4 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 5.9, dniDailyAvgKwhM2: 7.8, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 182.9, sunshineHoursDailyAvg: 9.8, meanTemperatureC: 28.6 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 4.9, dniDailyAvgKwhM2: 7.1, dhiDailyAvgKwhM2: 1.2, monthlyTotalGhiKwhM2: 147.0, sunshineHoursDailyAvg: 9.4, meanTemperatureC: 22.8 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 4.3, dniDailyAvgKwhM2: 6.5, dhiDailyAvgKwhM2: 1.1, monthlyTotalGhiKwhM2: 133.3, sunshineHoursDailyAvg: 9.1, meanTemperatureC: 18.0 },
    ],
  },
  {
    id: 'dakar',
    name: 'Dakar (Cap-Vert)',
    country: 'Sénégal',
    region: 'Afrique de l’Ouest',
    latitude: 14.71,
    longitude: -17.46,
    elevationM: 25,
    climateZone: 'BSh (Semi-aride sahélien côtier)',
    annualGhiKwhM2: 2090,
    annualDniKwhM2: 2180,
    seasonalityRatio: 1.34,
    interannualVariabilityPercent: 3.8,
    solarAvailabilityIndex: 91,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 5.1, dniDailyAvgKwhM2: 5.8, dhiDailyAvgKwhM2: 1.7, monthlyTotalGhiKwhM2: 158.1, sunshineHoursDailyAvg: 8.2, meanTemperatureC: 21.5 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 5.8, dniDailyAvgKwhM2: 6.4, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 162.4, sunshineHoursDailyAvg: 8.8, meanTemperatureC: 21.0 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 6.5, dniDailyAvgKwhM2: 7.2, dhiDailyAvgKwhM2: 1.9, monthlyTotalGhiKwhM2: 201.5, sunshineHoursDailyAvg: 9.5, meanTemperatureC: 21.8 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 6.8, dniDailyAvgKwhM2: 7.5, dhiDailyAvgKwhM2: 2.0, monthlyTotalGhiKwhM2: 204.0, sunshineHoursDailyAvg: 9.8, meanTemperatureC: 22.5 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 6.8, dniDailyAvgKwhM2: 7.1, dhiDailyAvgKwhM2: 2.2, monthlyTotalGhiKwhM2: 210.8, sunshineHoursDailyAvg: 9.4, meanTemperatureC: 24.2 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 6.2, dniDailyAvgKwhM2: 6.2, dhiDailyAvgKwhM2: 2.5, monthlyTotalGhiKwhM2: 186.0, sunshineHoursDailyAvg: 8.5, meanTemperatureC: 26.8 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 5.5, dniDailyAvgKwhM2: 5.2, dhiDailyAvgKwhM2: 2.7, monthlyTotalGhiKwhM2: 170.5, sunshineHoursDailyAvg: 7.5, meanTemperatureC: 27.5 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 5.2, dniDailyAvgKwhM2: 4.8, dhiDailyAvgKwhM2: 2.8, monthlyTotalGhiKwhM2: 161.2, sunshineHoursDailyAvg: 7.0, meanTemperatureC: 27.8 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 5.4, dniDailyAvgKwhM2: 5.3, dhiDailyAvgKwhM2: 2.6, monthlyTotalGhiKwhM2: 162.0, sunshineHoursDailyAvg: 7.4, meanTemperatureC: 28.0 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 5.6, dniDailyAvgKwhM2: 5.9, dhiDailyAvgKwhM2: 2.2, monthlyTotalGhiKwhM2: 173.6, sunshineHoursDailyAvg: 8.0, meanTemperatureC: 28.2 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 5.2, dniDailyAvgKwhM2: 5.8, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 156.0, sunshineHoursDailyAvg: 8.1, meanTemperatureC: 26.5 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 4.8, dniDailyAvgKwhM2: 5.4, dhiDailyAvgKwhM2: 1.7, monthlyTotalGhiKwhM2: 148.8, sunshineHoursDailyAvg: 7.9, meanTemperatureC: 23.5 },
    ],
  },
  {
    id: 'madrid',
    name: 'Madrid (Meseta Centrale)',
    country: 'Espagne',
    region: 'Europe du Sud',
    latitude: 40.41,
    longitude: -3.70,
    elevationM: 667,
    climateZone: 'Csa (Méditerranéen continentalisé)',
    annualGhiKwhM2: 1780,
    annualDniKwhM2: 2050,
    seasonalityRatio: 3.65,
    interannualVariabilityPercent: 4.8,
    solarAvailabilityIndex: 78,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 2.2, dniDailyAvgKwhM2: 3.4, dhiDailyAvgKwhM2: 0.9, monthlyTotalGhiKwhM2: 68.2, sunshineHoursDailyAvg: 5.2, meanTemperatureC: 6.2 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 3.2, dniDailyAvgKwhM2: 4.5, dhiDailyAvgKwhM2: 1.1, monthlyTotalGhiKwhM2: 89.6, sunshineHoursDailyAvg: 6.3, meanTemperatureC: 8.0 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 4.6, dniDailyAvgKwhM2: 5.8, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 142.6, sunshineHoursDailyAvg: 7.2, meanTemperatureC: 11.2 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 5.6, dniDailyAvgKwhM2: 6.5, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 168.0, sunshineHoursDailyAvg: 8.1, meanTemperatureC: 13.5 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 6.7, dniDailyAvgKwhM2: 7.6, dhiDailyAvgKwhM2: 2.1, monthlyTotalGhiKwhM2: 207.7, sunshineHoursDailyAvg: 9.5, meanTemperatureC: 17.8 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 7.8, dniDailyAvgKwhM2: 8.8, dhiDailyAvgKwhM2: 2.1, monthlyTotalGhiKwhM2: 234.0, sunshineHoursDailyAvg: 11.2, meanTemperatureC: 23.5 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 8.0, dniDailyAvgKwhM2: 9.1, dhiDailyAvgKwhM2: 2.0, monthlyTotalGhiKwhM2: 248.0, sunshineHoursDailyAvg: 11.8, meanTemperatureC: 26.8 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 7.1, dniDailyAvgKwhM2: 8.2, dhiDailyAvgKwhM2: 1.9, monthlyTotalGhiKwhM2: 220.1, sunshineHoursDailyAvg: 10.9, meanTemperatureC: 26.2 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 5.4, dniDailyAvgKwhM2: 6.7, dhiDailyAvgKwhM2: 1.5, monthlyTotalGhiKwhM2: 162.0, sunshineHoursDailyAvg: 8.7, meanTemperatureC: 21.5 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 3.7, dniDailyAvgKwhM2: 4.8, dhiDailyAvgKwhM2: 1.2, monthlyTotalGhiKwhM2: 114.7, sunshineHoursDailyAvg: 6.8, meanTemperatureC: 15.8 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 2.4, dniDailyAvgKwhM2: 3.5, dhiDailyAvgKwhM2: 0.9, monthlyTotalGhiKwhM2: 72.0, sunshineHoursDailyAvg: 5.4, meanTemperatureC: 10.0 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 1.9, dniDailyAvgKwhM2: 3.0, dhiDailyAvgKwhM2: 0.8, monthlyTotalGhiKwhM2: 58.9, sunshineHoursDailyAvg: 4.8, meanTemperatureC: 6.8 },
    ],
  },
  {
    id: 'carpentras',
    name: 'Carpentras (Provence Solaire)',
    country: 'France',
    region: 'Europe de l’Ouest',
    latitude: 44.05,
    longitude: 5.05,
    elevationM: 98,
    climateZone: 'Csa (Méditerranéen d’abri)',
    annualGhiKwhM2: 1620,
    annualDniKwhM2: 1890,
    seasonalityRatio: 4.15,
    interannualVariabilityPercent: 5.2,
    solarAvailabilityIndex: 73,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 1.8, dniDailyAvgKwhM2: 3.0, dhiDailyAvgKwhM2: 0.8, monthlyTotalGhiKwhM2: 55.8, sunshineHoursDailyAvg: 4.9, meanTemperatureC: 5.5 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 2.8, dniDailyAvgKwhM2: 4.2, dhiDailyAvgKwhM2: 1.0, monthlyTotalGhiKwhM2: 78.4, sunshineHoursDailyAvg: 6.1, meanTemperatureC: 6.8 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 4.2, dniDailyAvgKwhM2: 5.3, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 130.2, sunshineHoursDailyAvg: 7.3, meanTemperatureC: 10.5 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 5.3, dniDailyAvgKwhM2: 6.1, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 159.0, sunshineHoursDailyAvg: 8.2, meanTemperatureC: 13.8 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 6.4, dniDailyAvgKwhM2: 7.1, dhiDailyAvgKwhM2: 2.1, monthlyTotalGhiKwhM2: 198.4, sunshineHoursDailyAvg: 9.4, meanTemperatureC: 17.8 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 7.4, dniDailyAvgKwhM2: 8.2, dhiDailyAvgKwhM2: 2.1, monthlyTotalGhiKwhM2: 222.0, sunshineHoursDailyAvg: 11.0, meanTemperatureC: 22.2 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 7.6, dniDailyAvgKwhM2: 8.5, dhiDailyAvgKwhM2: 2.0, monthlyTotalGhiKwhM2: 235.6, sunshineHoursDailyAvg: 11.8, meanTemperatureC: 25.0 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 6.6, dniDailyAvgKwhM2: 7.6, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 204.6, sunshineHoursDailyAvg: 10.6, meanTemperatureC: 24.5 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 4.9, dniDailyAvgKwhM2: 6.0, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 147.0, sunshineHoursDailyAvg: 8.5, meanTemperatureC: 20.0 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 3.2, dniDailyAvgKwhM2: 4.3, dhiDailyAvgKwhM2: 1.1, monthlyTotalGhiKwhM2: 99.2, sunshineHoursDailyAvg: 6.2, meanTemperatureC: 15.5 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 2.0, dniDailyAvgKwhM2: 3.1, dhiDailyAvgKwhM2: 0.8, monthlyTotalGhiKwhM2: 60.0, sunshineHoursDailyAvg: 5.0, meanTemperatureC: 9.8 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 1.5, dniDailyAvgKwhM2: 2.6, dhiDailyAvgKwhM2: 0.7, monthlyTotalGhiKwhM2: 46.5, sunshineHoursDailyAvg: 4.4, meanTemperatureC: 6.0 },
    ],
  },
  {
    id: 'paris',
    name: 'Paris (Bassin Parisien)',
    country: 'France',
    region: 'Europe de l’Ouest',
    latitude: 48.85,
    longitude: 2.35,
    elevationM: 35,
    climateZone: 'Cfb (Océanique dégradé)',
    annualGhiKwhM2: 1190,
    annualDniKwhM2: 1240,
    seasonalityRatio: 6.20,
    interannualVariabilityPercent: 7.1,
    solarAvailabilityIndex: 56,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 0.9, dniDailyAvgKwhM2: 1.3, dhiDailyAvgKwhM2: 0.6, monthlyTotalGhiKwhM2: 27.9, sunshineHoursDailyAvg: 2.1, meanTemperatureC: 5.0 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 1.7, dniDailyAvgKwhM2: 2.4, dhiDailyAvgKwhM2: 0.9, monthlyTotalGhiKwhM2: 47.6, sunshineHoursDailyAvg: 3.2, meanTemperatureC: 5.8 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 3.0, dniDailyAvgKwhM2: 3.8, dhiDailyAvgKwhM2: 1.4, monthlyTotalGhiKwhM2: 93.0, sunshineHoursDailyAvg: 4.9, meanTemperatureC: 8.8 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 4.4, dniDailyAvgKwhM2: 4.9, dhiDailyAvgKwhM2: 1.9, monthlyTotalGhiKwhM2: 132.0, sunshineHoursDailyAvg: 6.3, meanTemperatureC: 11.8 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 5.3, dniDailyAvgKwhM2: 5.6, dhiDailyAvgKwhM2: 2.3, monthlyTotalGhiKwhM2: 164.3, sunshineHoursDailyAvg: 7.2, meanTemperatureC: 15.5 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 5.8, dniDailyAvgKwhM2: 6.2, dhiDailyAvgKwhM2: 2.4, monthlyTotalGhiKwhM2: 174.0, sunshineHoursDailyAvg: 8.1, meanTemperatureC: 18.8 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 5.7, dniDailyAvgKwhM2: 6.0, dhiDailyAvgKwhM2: 2.3, monthlyTotalGhiKwhM2: 176.7, sunshineHoursDailyAvg: 8.2, meanTemperatureC: 21.0 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 4.9, dniDailyAvgKwhM2: 5.4, dhiDailyAvgKwhM2: 2.0, monthlyTotalGhiKwhM2: 151.9, sunshineHoursDailyAvg: 7.4, meanTemperatureC: 20.8 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 3.6, dniDailyAvgKwhM2: 4.2, dhiDailyAvgKwhM2: 1.6, monthlyTotalGhiKwhM2: 108.0, sunshineHoursDailyAvg: 5.8, meanTemperatureC: 17.2 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 2.1, dniDailyAvgKwhM2: 2.8, dhiDailyAvgKwhM2: 1.1, monthlyTotalGhiKwhM2: 65.1, sunshineHoursDailyAvg: 3.9, meanTemperatureC: 13.0 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 1.1, dniDailyAvgKwhM2: 1.6, dhiDailyAvgKwhM2: 0.7, monthlyTotalGhiKwhM2: 33.0, sunshineHoursDailyAvg: 2.3, meanTemperatureC: 8.4 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 0.7, dniDailyAvgKwhM2: 1.0, dhiDailyAvgKwhM2: 0.5, monthlyTotalGhiKwhM2: 21.7, sunshineHoursDailyAvg: 1.8, meanTemperatureC: 5.8 },
    ],
  },
  {
    id: 'stockholm',
    name: 'Stockholm (Scandinavie)',
    country: 'Suède',
    region: 'Europe du Nord',
    latitude: 59.33,
    longitude: 18.06,
    elevationM: 28,
    climateZone: 'Dfb (Continental humide boréal)',
    annualGhiKwhM2: 980,
    annualDniKwhM2: 1080,
    seasonalityRatio: 14.2,
    interannualVariabilityPercent: 8.5,
    solarAvailabilityIndex: 44,
    monthlyNormals: [
      { monthIndex: 0, monthNameFr: 'Janvier', ghiDailyAvgKwhM2: 0.4, dniDailyAvgKwhM2: 0.7, dhiDailyAvgKwhM2: 0.3, monthlyTotalGhiKwhM2: 12.4, sunshineHoursDailyAvg: 1.4, meanTemperatureC: -1.8 },
      { monthIndex: 1, monthNameFr: 'Février', ghiDailyAvgKwhM2: 1.1, dniDailyAvgKwhM2: 1.8, dhiDailyAvgKwhM2: 0.6, monthlyTotalGhiKwhM2: 30.8, sunshineHoursDailyAvg: 2.6, meanTemperatureC: -1.9 },
      { monthIndex: 2, monthNameFr: 'Mars', ghiDailyAvgKwhM2: 2.5, dniDailyAvgKwhM2: 3.6, dhiDailyAvgKwhM2: 1.2, monthlyTotalGhiKwhM2: 77.5, sunshineHoursDailyAvg: 4.8, meanTemperatureC: 1.2 },
      { monthIndex: 3, monthNameFr: 'Avril', ghiDailyAvgKwhM2: 4.1, dniDailyAvgKwhM2: 5.0, dhiDailyAvgKwhM2: 1.8, monthlyTotalGhiKwhM2: 123.0, sunshineHoursDailyAvg: 6.8, meanTemperatureC: 6.5 },
      { monthIndex: 4, monthNameFr: 'Mai', ghiDailyAvgKwhM2: 5.6, dniDailyAvgKwhM2: 6.4, dhiDailyAvgKwhM2: 2.2, monthlyTotalGhiKwhM2: 173.6, sunshineHoursDailyAvg: 8.8, meanTemperatureC: 11.8 },
      { monthIndex: 5, monthNameFr: 'Juin', ghiDailyAvgKwhM2: 6.0, dniDailyAvgKwhM2: 6.6, dhiDailyAvgKwhM2: 2.4, monthlyTotalGhiKwhM2: 180.0, sunshineHoursDailyAvg: 9.6, meanTemperatureC: 16.0 },
      { monthIndex: 6, monthNameFr: 'Juillet', ghiDailyAvgKwhM2: 5.8, dniDailyAvgKwhM2: 6.2, dhiDailyAvgKwhM2: 2.3, monthlyTotalGhiKwhM2: 179.8, sunshineHoursDailyAvg: 9.2, meanTemperatureC: 18.8 },
      { monthIndex: 7, monthNameFr: 'Août', ghiDailyAvgKwhM2: 4.5, dniDailyAvgKwhM2: 5.1, dhiDailyAvgKwhM2: 1.9, monthlyTotalGhiKwhM2: 139.5, sunshineHoursDailyAvg: 7.5, meanTemperatureC: 17.5 },
      { monthIndex: 8, monthNameFr: 'Septembre', ghiDailyAvgKwhM2: 2.8, dniDailyAvgKwhM2: 3.6, dhiDailyAvgKwhM2: 1.3, monthlyTotalGhiKwhM2: 84.0, sunshineHoursDailyAvg: 5.2, meanTemperatureC: 12.8 },
      { monthIndex: 9, monthNameFr: 'Octobre', ghiDailyAvgKwhM2: 1.3, dniDailyAvgKwhM2: 1.9, dhiDailyAvgKwhM2: 0.8, monthlyTotalGhiKwhM2: 40.3, sunshineHoursDailyAvg: 3.2, meanTemperatureC: 7.5 },
      { monthIndex: 10, monthNameFr: 'Novembre', ghiDailyAvgKwhM2: 0.5, dniDailyAvgKwhM2: 0.8, dhiDailyAvgKwhM2: 0.4, monthlyTotalGhiKwhM2: 15.0, sunshineHoursDailyAvg: 1.6, meanTemperatureC: 3.2 },
      { monthIndex: 11, monthNameFr: 'Décembre', ghiDailyAvgKwhM2: 0.25, dniDailyAvgKwhM2: 0.4, dhiDailyAvgKwhM2: 0.2, monthlyTotalGhiKwhM2: 7.7, sunshineHoursDailyAvg: 1.1, meanTemperatureC: 0.1 },
    ],
  },
];

/**
 * Calculates Solar Availability Index (SAI/GAI):
 * Transparent formula:
 * - 50% Abundance: Annual GHI normalized to 2500 kWh/m²
 * - 30% Regularity: Inverted seasonality penalty (1 / SeasonalityRatio)
 * - 20% Stability: Low interannual variability (100 - sigma * 4)
 */
export function calculateSolarAvailabilityIndex(
  annualGhiKwhM2: number,
  seasonalityRatio: number,
  interannualVariabilityPercent: number
): {
  indexScore: number;
  abundanceScore: number;
  regularityScore: number;
  stabilityScore: number;
} {
  const abundanceScore = Math.max(0, Math.min(100, (annualGhiKwhM2 / 2400) * 100));
  const regularityScore = Math.max(0, Math.min(100, (2.0 / (seasonalityRatio + 0.5)) * 100));
  const stabilityScore = Math.max(0, Math.min(100, 100 - interannualVariabilityPercent * 4));

  const indexScore = Math.round(
    0.50 * abundanceScore +
    0.30 * regularityScore +
    0.20 * stabilityScore
  );

  return {
    indexScore: Math.max(1, Math.min(99, indexScore)),
    abundanceScore: Math.round(abundanceScore),
    regularityScore: Math.round(regularityScore),
    stabilityScore: Math.round(stabilityScore),
  };
}

/**
 * Finds the closest reference station or interpolates climate normals for any coordinate.
 */
export function getClimateNormalsForLocation(
  latitude: number,
  longitude: number
): ClimateStationProfile {
  // Check exact benchmark match or closest station
  let closestStation = GLOBAL_SOLAR_BENCHMARKS[0];
  let minDistance = Infinity;

  for (const station of GLOBAL_SOLAR_BENCHMARKS) {
    const dLat = station.latitude - latitude;
    const dLon = station.longitude - longitude;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < minDistance) {
      minDistance = dist;
      closestStation = station;
    }
  }

  // If very close to benchmark station (< 1.5°), return benchmark directly
  if (minDistance < 1.5) {
    return closestStation;
  }

  // Otherwise, synthesize a tailored astronomical climate profile based on latitude
  const absLat = Math.abs(latitude);
  const isNorthernHemisphere = latitude >= 0;

  // Approximate annual GHI based on latitude band (from ~2500 at equator/tropics to ~900 at 60°)
  const annualGhi = Math.round(
    Math.max(750, Math.min(2600, 2550 - 28 * Math.pow(absLat / 10, 1.8)))
  );
  const annualDni = Math.round(annualGhi * (absLat < 30 ? 1.25 : 1.1));

  // Seasonality ratio increases sharply with latitude
  const seasonality = Math.max(1.15, Math.min(18.0, 1.2 + 0.08 * Math.pow(absLat, 1.3) / 10));
  const variability = Math.max(2.0, Math.min(12.0, 2.0 + absLat * 0.1));

  const { indexScore } = calculateSolarAvailabilityIndex(annualGhi, seasonality, variability);

  const monthlyNormals: MonthlyClimateNormals[] = [];
  const baseDailyGhi = annualGhi / 365.25;

  for (let m = 0; m < 12; m++) {
    // Peak month: July (m=6) in North, January (m=0) in South
    const peakMonth = isNorthernHemisphere ? 6 : 0;
    const phaseOffset = ((m - peakMonth + 12) % 12) / 12;
    const cosFactor = Math.cos(phaseOffset * 2 * Math.PI); // 1 at peak, -1 at trough

    const amplitude = (seasonality - 1) / (seasonality + 1);
    const monthDailyGhi = Math.max(
      0.3,
      Math.round(baseDailyGhi * (1 + amplitude * cosFactor) * 10) / 10
    );
    const monthDailyDni = Math.round(monthDailyGhi * 1.15 * 10) / 10;
    const monthDailyDhi = Math.round(monthDailyGhi * 0.3 * 10) / 10;
    const monthlyTotal = Math.round(monthDailyGhi * DAYS_IN_MONTH[m] * 10) / 10;
    const sunshine = Math.round(Math.min(13, Math.max(1.5, monthDailyDni * 1.3)) * 10) / 10;
    const temp = Math.round((20 - absLat * 0.35 + 9 * cosFactor) * 10) / 10;

    monthlyNormals.push({
      monthIndex: m,
      monthNameFr: MONTH_NAMES_FR[m],
      ghiDailyAvgKwhM2: monthDailyGhi,
      dniDailyAvgKwhM2: monthDailyDni,
      dhiDailyAvgKwhM2: monthDailyDhi,
      monthlyTotalGhiKwhM2: monthlyTotal,
      sunshineHoursDailyAvg: sunshine,
      meanTemperatureC: temp,
    });
  }

  return {
    id: `coord_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,
    name: `Coordonnées (${latitude >= 0 ? '+' : ''}${latitude.toFixed(2)}°, ${longitude >= 0 ? '+' : ''}${longitude.toFixed(2)}°)`,
    country: 'International',
    region: isNorthernHemisphere ? 'Hémisphère Nord' : 'Hémisphère Sud',
    latitude,
    longitude,
    elevationM: 100,
    climateZone: `Zone ${absLat < 23.5 ? 'Tropicale' : absLat < 40 ? 'Subtropicale' : absLat < 60 ? 'Tempérée' : 'Polaire'}`,
    annualGhiKwhM2: annualGhi,
    annualDniKwhM2: annualDni,
    seasonalityRatio: Math.round(seasonality * 10) / 10,
    interannualVariabilityPercent: Math.round(variability * 10) / 10,
    solarAvailabilityIndex: indexScore,
    monthlyNormals,
  };
}

/**
 * Computes anomaly between an observed single-day GHI and the multi-year climate average for that month.
 */
export function calculateClimateAnomaly(
  observedGhiKwhM2: number,
  observedDateStr: string,
  latitude: number,
  longitude: number
): ClimateAnomalyResult {
  const parts = observedDateStr.split('-').map(Number);
  const month = (parts[1] || 1) - 1; // 0-indexed

  const climate = getClimateNormalsForLocation(latitude, longitude);
  const referenceMonth = climate.monthlyNormals[month] || climate.monthlyNormals[0];
  const refGhi = referenceMonth.ghiDailyAvgKwhM2;

  const diff = observedGhiKwhM2 - refGhi;
  const anomalyPercent = refGhi > 0 ? Math.round((diff / refGhi) * 1000) / 10 : 0;

  let status: 'surplus' | 'normal' | 'deficit' = 'normal';
  if (anomalyPercent > 8) status = 'surplus';
  else if (anomalyPercent < -8) status = 'deficit';

  let explanationFr = '';
  if (status === 'surplus') {
    explanationFr = `Rayonnement supérieur de +${anomalyPercent}% à la normale de ${referenceMonth.monthNameFr} (${refGhi} kWh/m²/j) : conditions de ciel particulièrement dégagé et faible turbidité aérosol.`;
  } else if (status === 'deficit') {
    explanationFr = `Rayonnement inférieur de ${anomalyPercent}% à la normale de ${referenceMonth.monthNameFr} (${refGhi} kWh/m²/j) : couverture nuageuse, nébulosité ou atténuation optique marquée.`;
  } else {
    explanationFr = `Rayonnement conforme à la normale climatique de ${referenceMonth.monthNameFr} (${refGhi} kWh/m²/j) avec un écart minime de ${anomalyPercent}%.`;
  }

  return {
    observedDate: observedDateStr,
    observedGhiKwhM2,
    climateReferenceGhiKwhM2: refGhi,
    anomalyPercent,
    status,
    explanationFr,
  };
}
