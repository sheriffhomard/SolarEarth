"""
Pydantic schemas for solar radiation observations (hourly & daily).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class HourlyRadiationPoint(BaseModel):
    hour: int = Field(ge=0, le=23, description="Hour of day (0-23)")
    time: str = Field(description="ISO timestamp or time label")
    ghi: float = Field(ge=0, description="Global Horizontal Irradiance in W/m²")
    dni: float = Field(ge=0, description="Direct Normal Irradiance in W/m²")
    dhi: float = Field(ge=0, description="Diffuse Horizontal Irradiance in W/m²")
    solar_elevation: float = Field(description="Sun height / elevation angle in degrees")
    solar_azimuth: Optional[float] = Field(default=None, description="Sun azimuth angle in degrees")
    temperature: Optional[float] = Field(default=None, description="Ambient air temperature in °C")
    quality_flag: str = Field(default="validated", description="validated, clearsky_model, or synthetic")


class HourlyRadiationResponse(BaseModel):
    location_name: Optional[str] = Field(default=None)
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    date: str = Field(description="Date in YYYY-MM-DD format")
    source: str = Field(default="pvgis", description="pvgis, pvgis_cache, or clearsky_model")
    units: str = Field(default="W/m² for irradiance, kWh/m² for irradiation")
    daily_irradiation_kwh: float = Field(description="Cumulative daily global irradiation in kWh/m²")
    peak_ghi: float = Field(description="Maximum hourly GHI reached in W/m²")
    peak_dni: float = Field(description="Maximum hourly DNI reached in W/m²")
    sunshine_hours: float = Field(default=0.0, description="Sun hours above WMO direct threshold (120 W/m²)")
    cached: bool = Field(default=False)
    provenance: Optional[dict] = Field(default=None, description="Scientific provenance, source, formulas, and UTC timestamps")
    hourly: List[HourlyRadiationPoint]


class DailyRadiationPoint(BaseModel):
    date: str = Field(description="Date in YYYY-MM-DD format")
    ghi_total_kwh: float = Field(description="Daily GHI in kWh/m²")
    dni_total_kwh: float = Field(description="Daily DNI in kWh/m²")
    dhi_total_kwh: float = Field(description="Daily DHI in kWh/m²")
    peak_ghi: float = Field(description="Peak GHI of day in W/m²")


class DailyRadiationResponse(BaseModel):
    latitude: float
    longitude: float
    start_date: str
    end_date: str
    days_count: int
    average_daily_kwh: float
    source: str = "pvgis"
    daily: List[DailyRadiationPoint]
