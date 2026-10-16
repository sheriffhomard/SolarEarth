"""
NOAA SWPC (Space Weather Prediction Center) Provider.
Scheduled for full implementation in V0.4.
"""

from typing import Any, Dict
from backend.app.core.config import settings
from backend.app.providers.base import SolarDataProvider, ProviderNotImplementedError
from backend.app.schemas.provider import SupportedOperations


class NOAAProvider(SolarDataProvider):
    """
    Provider for NOAA Space Weather Prediction Center (SWPC).
    Provides real-time solar radio flux (F10.7), planetary K-index (Kp), disturbance storm time (Dst), and solar flare data.
    """

    def __init__(self):
        super().__init__(
            code="noaa",
            name="NOAA Space Weather Prediction Center (SWPC)",
            base_url=settings.NOAA_BASE_URL,
            enabled=settings.NOAA_ENABLED,
            target_version="V0.4",
            description="Real-time and forecast solar-terrestrial indices including 10.7cm solar radio flux (sfu), planetary Kp index, Dst index (nT), and X-ray flares.",
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
            "F10.7 Solar Radio Flux (sfu)",
            "Planetary Kp Index",
            "Dst Geomagnetic Storm Index (nT)",
            "GOES Solar X-Ray Flux (W/m²)",
            "Solar Flare Classification",
        ]

    async def get_current(self, latitude: float = 0.0, longitude: float = 0.0) -> Dict[str, Any]:
        self.logger.info("get_current requested for space weather indices - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NOAA SWPC real-time space weather indices are planned for V0.4. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_hourly(
        self, latitude: float = 0.0, longitude: float = 0.0, date: str = ""
    ) -> Dict[str, Any]:
        self.logger.info(f"get_hourly space weather requested for {date} - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NOAA SWPC hourly indices are planned for V0.4. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_daily(
        self, latitude: float = 0.0, longitude: float = 0.0, start_date: str = "", end_date: str = ""
    ) -> Dict[str, Any]:
        self.logger.info("get_daily space weather requested - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NOAA SWPC daily indices are planned for V0.4. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )

    async def get_historical(
        self, latitude: float = 0.0, longitude: float = 0.0, start_year: int = 2000, end_year: int = 2026
    ) -> Dict[str, Any]:
        self.logger.info("get_historical space weather requested - V0.1 placeholder")
        raise ProviderNotImplementedError(
            "NOAA SWPC historical indices are planned for V0.4. V0.1 is architectural foundation only.",
            provider_code=self.code,
        )
