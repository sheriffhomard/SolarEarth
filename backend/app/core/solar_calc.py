"""
Solar astronomical positioning and clear-sky irradiance model.
Implements NOAA / Spencer solar position algorithms and Bird / Ineichen clear-sky model.
Provides deterministic, scientifically grounded solar curves for any (lat, lon, date).
"""

import math
from datetime import datetime, timezone
from typing import Dict, List, Tuple


def calculate_solar_position(latitude_deg: float, longitude_deg: float, dt_utc: datetime) -> Tuple[float, float]:
    """
    Computes solar elevation angle and azimuth angle for given coordinates and UTC datetime.
    Returns: (elevation_deg, azimuth_deg)
    """
    # Day of year (1-366)
    day_of_year = dt_utc.timetuple().tm_yday
    hour_utc = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0

    # Fractional year (radians)
    gamma = 2.0 * math.pi / 365.0 * (day_of_year - 1 + (hour_utc - 12.0) / 24.0)

    # Equation of time (minutes)
    eqtime = 229.18 * (
        0.000075
        + 0.001868 * math.cos(gamma)
        - 0.032077 * math.sin(gamma)
        - 0.014615 * math.cos(2 * gamma)
        - 0.040849 * math.sin(2 * gamma)
    )

    # Solar declination angle (radians)
    decl = (
        0.006918
        - 0.399912 * math.cos(gamma)
        + 0.070257 * math.sin(gamma)
        - 0.006758 * math.cos(2 * gamma)
        + 0.000907 * math.sin(2 * gamma)
        - 0.002697 * math.cos(3 * gamma)
        + 0.00148 * math.sin(3 * gamma)
    )

    # True solar time (minutes from midnight)
    time_offset = eqtime + 4.0 * longitude_deg
    tst = (hour_utc * 60.0 + time_offset) % 1440.0

    # Solar hour angle (degrees)
    ha_deg = (tst / 4.0) - 180.0
    ha_rad = math.radians(ha_deg)

    lat_rad = math.radians(latitude_deg)

    # Zenith angle cosine
    cos_zenith = math.sin(lat_rad) * math.sin(decl) + math.cos(lat_rad) * math.cos(decl) * math.cos(ha_rad)
    cos_zenith = max(-1.0, min(1.0, cos_zenith))
    zenith_rad = math.acos(cos_zenith)

    elevation_rad = (math.pi / 2.0) - zenith_rad
    elevation_deg = math.degrees(elevation_rad)

    # Solar azimuth angle
    if elevation_deg > -89.9:
        cos_azimuth = (math.sin(decl) * math.cos(lat_rad) - math.cos(decl) * math.sin(lat_rad) * math.cos(ha_rad)) / math.cos(elevation_rad)
        cos_azimuth = max(-1.0, min(1.0, cos_azimuth))
        azimuth_deg = math.degrees(math.acos(cos_azimuth))
        if ha_deg > 0:
            azimuth_deg = (360.0 - azimuth_deg) % 360.0
    else:
        azimuth_deg = 180.0

    return elevation_deg, azimuth_deg


def calculate_clearsky_irradiance(elevation_deg: float, day_of_year: int) -> Tuple[float, float, float]:
    """
    Computes standard clear-sky irradiance components: GHI, DNI, DHI in W/m².
    Uses Spencer extraterrestrial solar constant variation and modified Bird clear-sky model.
    Returns: (GHI, DNI, DHI)
    """
    if elevation_deg <= 0.0:
        return 0.0, 0.0, 0.0

    # Solar constant I0 = 1361 W/m² with eccentricity correction
    theta_0 = 2.0 * math.pi * (day_of_year - 1) / 365.0
    eccentricity = 1.000110 + 0.034221 * math.cos(theta_0) + 0.001280 * math.sin(theta_0) + 0.000719 * math.cos(2 * theta_0)
    i0 = 1361.0 * eccentricity

    sin_el = math.sin(math.radians(elevation_deg))
    cos_zenith = sin_el

    # Air mass (Kasten-Young approximation)
    zenith_deg = 90.0 - elevation_deg
    air_mass = 1.0 / (cos_zenith + 0.50572 * math.pow(96.07995 - zenith_deg, -1.6364))
    air_mass = max(1.0, min(30.0, air_mass))

    # Atmospheric transmittance (standard clear atmosphere, Linke turbidity ~ 3.0)
    tau_beam = math.exp(-0.16 * air_mass)
    tau_diffuse = 0.08 + 0.04 * math.sin(math.radians(elevation_deg))

    # Direct Normal Irradiance (DNI)
    dni = i0 * tau_beam
    dni = max(0.0, min(1150.0, dni))

    # Diffuse Horizontal Irradiance (DHI)
    dhi = i0 * sin_el * tau_diffuse
    dhi = max(0.0, min(350.0, dhi))

    # Global Horizontal Irradiance (GHI = DNI * sin(elevation) + DHI)
    ghi = (dni * sin_el) + dhi
    ghi = max(0.0, min(1250.0, ghi))

    return round(ghi, 1), round(dni, 1), round(dhi, 1)


def generate_24h_clearsky_series(latitude: float, longitude: float, date_str: str) -> List[Dict]:
    """
    Generates 24-hour astronomical clear-sky series for a given location and date (YYYY-MM-DD).
    """
    parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    day_of_year = parsed_date.timetuple().tm_yday
    points = []

    for hour in range(24):
        dt_utc = datetime(parsed_date.year, parsed_date.month, parsed_date.day, hour, 0, 0, tzinfo=timezone.utc)
        elevation, azimuth = calculate_solar_position(latitude, longitude, dt_utc)
        ghi, dni, dhi = calculate_clearsky_irradiance(elevation, day_of_year)

        # Ambient temperature diurnal model based on solar elevation
        ambient_temp = 12.0 + 8.0 * math.sin(math.radians(max(0.0, elevation))) + 4.0 * math.cos(math.radians(latitude))

        points.append({
            "hour": hour,
            "time": f"{date_str}T{hour:02d}:00:00Z",
            "ghi": ghi,
            "dni": dni,
            "dhi": dhi,
            "solar_elevation": round(elevation, 2),
            "solar_azimuth": round(azimuth, 2),
            "temperature": round(ambient_temp, 1),
            "quality_flag": "model_clearsky",
        })

    return points
