"""
Provider Service registry managing configured data providers.
"""

from typing import Dict, Optional
from backend.app.core.logging import get_logger
from backend.app.providers.base import SolarDataProvider
from backend.app.providers.pvgis import PVGISProvider
from backend.app.providers.nasa_power import NASAPowerProvider
from backend.app.providers.noaa import NOAAProvider
from backend.app.providers.eumetsat import EUMETSATProvider
from backend.app.schemas.provider import ProviderRegistrySummary, ProviderStatus

logger = get_logger("API")


class ProviderRegistry:
    """Registry holding all known scientific data providers."""

    def __init__(self):
        self._providers: Dict[str, SolarDataProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self) -> None:
        self.register(PVGISProvider())
        self.register(NASAPowerProvider())
        self.register(NOAAProvider())
        self.register(EUMETSATProvider())

    def register(self, provider: SolarDataProvider) -> None:
        self._providers[provider.code] = provider
        logger.info(f"Registered provider: {provider.code} ({provider.name})")

    def get_provider(self, code: str) -> Optional[SolarDataProvider]:
        return self._providers.get(code)

    def list_statuses(self) -> Dict[str, ProviderStatus]:
        return {code: provider.get_status() for code, provider in self._providers.items()}

    def get_summary(self) -> ProviderRegistrySummary:
        statuses = self.list_statuses()
        return ProviderRegistrySummary(
            providers=statuses,
            total_count=len(statuses),
        )


provider_registry = ProviderRegistry()
