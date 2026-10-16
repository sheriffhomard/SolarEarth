"""
EUMETSAT (European Organisation for the Exploitation of Meteorological Satellites) Provider.
Scheduled for full implementation in V0.7.
"""

from typing import Any, Dict
from backend.app.core.config import settings
from backend.app.providers.base import SolarDataProvider, ProviderNotImplementedError
from backend.app.schemas.provider import SupportedOperations


class EUMETSATProvider(SolarDataProvider):
    """
    Provider for EUMETSAT Data Store and SARAH-3 / MTG / MSG solar radiation products.
    Provides geostationary satellite surface solar radiation, effective cloud albedo, and direct/diffuse fractions.
    """

    def __init__(self):
        super().__init__(
            code="eumetsat",
            name="EUMETSAT (European Meteorological Satellites)",
            base_url=settings.EUMETSAT_BASE_URL,
            enabled=settings.EUMETSAT_ENABLED,
            target_version="V0.7",
            description="Geostationary satellite surface solar radiation products (SARAH climate records, MTG/FCI near-real-time imagery) for satellite-based cross-validation.",
        )

    def get_supported_operations(self) -> SupportedOperations:
        return SupportedOperations(
            current=True,
            hourly=True,
            daily=True,
            historical=True,
        )

    def get_supported_parameters(self) -> list[str]:
        return [
            "SIS Surface Incoming Shortwave Radiation (W/m²)",
            "SID Surface Incoming Direct Radiation (W/m²)",
            "CAL Effective Cloud Albedo",
            "DNI Satellite Estimate (W/m²)",
        ]

    async def get_current(self, latitude: float, longitude: float) -> Dict[str, Any]:
        self.logger.info(f"get_current requested for ({latitude}, {longitude}) - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "EUMETSAT satellite observation is planned for V0.7. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_hourly(self, latitude: float, longitude: float, date: str) -> Dict[str, Any]:
        self.logger.info(f"get_hourly requested for ({latitude}, {longitude}) on {date} - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "EUMETSAT hourly satellite series is planned for V0.7. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_daily(
        self, latitude: float, longitude: float, start_date: str, end_date: str
    ) -> Dict[str, Any]:
        self.logger.info(f"get_daily requested for ({latitude}, {longitude}) - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "EUMETSAT daily satellite data is planned for V0.7. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_historical(
        self, latitude: float, longitude: float, start_year: int, end_year: int
    ) -> Dict[str, Any]:
        self.logger.info(f"get_historical requested for ({latitude}, {longitude}) - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "EUMETSAT SARAH climatology is planned for V0.7. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )
