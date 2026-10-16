"""
NASA POWER (Prediction Of Worldwide Energy Resources) Provider.
Scheduled for full implementation in V0.3.
"""

from typing import Any, Dict
from backend.app.core.config import settings
from backend.app.providers.base import SolarDataProvider, ProviderNotImplementedError
from backend.app.schemas.provider import SupportedOperations


class NASAPowerProvider(SolarDataProvider):
    """
    Provider for NASA POWER API.
    Provides worldwide solar irradiance and meteorological parameters derived from satellite observations and GMAO models.
    """

    def __init__(self):
        super().__init__(
            code="nasa_power",
            name="NASA POWER (Prediction Of Worldwide Energy Resources)",
            base_url=settings.NASA_POWER_BASE_URL,
            enabled=settings.NASA_POWER_ENABLED,
            target_version="V0.3",
            description="Global satellite-derived surface solar irradiance, all-sky insolations, and atmospheric meteorology from NASA Langley Research Center.",
        )

    def get_supported_operations(self) -> SupportedOperations:
        return SupportedOperations(
            current=False,
            hourly=True,
            daily=True,
            historical=True,
        )

    def get_supported_parameters(self) -> list[str]:
        return [
            "ALLSKY_SFC_SW_DWN (kW-hr/m²/day or W/m²)",
            "CLRSKY_SFC_SW_DWN (W/m²)",
            "T2M (°C)",
            "RH2M (%)",
        ]

    async def get_current(self, latitude: float, longitude: float) -> Dict[str, Any]:
        self.logger.info(f"get_current requested for ({latitude}, {longitude}) - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NASA POWER current data is planned for V0.3. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_hourly(self, latitude: float, longitude: float, date: str) -> Dict[str, Any]:
        self.logger.info(f"get_hourly requested for ({latitude}, {longitude}) on {date} - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NASA POWER hourly series is planned for V0.3. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_daily(
        self, latitude: float, longitude: float, start_date: str, end_date: str
    ) -> Dict[str, Any]:
        self.logger.info(f"get_daily requested for ({latitude}, {longitude}) - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NASA POWER daily data is planned for V0.3. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_historical(
        self, latitude: float, longitude: float, start_year: int, end_year: int
    ) -> Dict[str, Any]:
        self.logger.info(f"get_historical requested for ({latitude}, {longitude}) - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NASA POWER historical series is planned for V0.3. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )
