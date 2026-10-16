"""
Abstract Base Provider architecture for Solar Earth data providers.
Prepares interfaces for PVGIS, NASA POWER, NOAA, and EUMETSAT.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import get_logger
from backend.app.schemas.provider import ProviderStatus, ProviderState, SupportedOperations


class ProviderException(Exception):
    """Base exception for provider operations."""
    def __init__(self, message: str, provider_code: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.provider_code = provider_code
        self.status_code = status_code


class ProviderNotImplementedError(ProviderException):
    """Raised when an operation is scheduled for a future version (e.g. V0.2+)."""
    pass


class ProviderTimeoutError(ProviderException):
    """Raised when an external provider request exceeds the configured timeout."""
    pass


class ProviderUnavailableError(ProviderException):
    """Raised when external provider endpoint is unreachable or returning 5xx errors."""
    pass


class SolarDataProvider(ABC):
    """
    Abstract interface for solar, atmospheric, and geomagnetic data providers.
    In V0.1, real API calls are strictly disallowed; classes serve as architectural scaffolding.
    """

    def __init__(
        self,
        code: str,
        name: str,
        base_url: str,
        enabled: bool = False,
        target_version: str = "V0.2",
        description: str = "",
    ):
        self.code = code
        self.name = name
        self.base_url = base_url
        self.enabled = enabled
        self.target_version = target_version
        self.description = description
        self.timeout = settings.PROVIDER_REQUEST_TIMEOUT_SECONDS
        self.max_retries = settings.PROVIDER_MAX_RETRIES
        self.logger = get_logger(code)

    def get_state(self) -> ProviderState:
        if self.enabled:
            return ProviderState.ENABLED
        if self.base_url:
            return ProviderState.CONFIGURED
        return ProviderState.DISABLED

    @abstractmethod
    def get_supported_operations(self) -> SupportedOperations:
        """Returns the matrix of supported temporal operations."""
        pass

    @abstractmethod
    def get_supported_parameters(self) -> list[str]:
        """Returns the scientific parameters supplied by this provider (e.g. GHI, DNI, DHI, Kp)."""
        pass

    def get_status(self) -> ProviderStatus:
        """Returns current operational status of the provider."""
        return ProviderStatus(
            code=self.code,
            name=self.name,
            state=self.get_state(),
            base_url=self.base_url,
            target_version=self.target_version,
            is_active_in_v0_1=False,
            supported_operations=self.get_supported_operations(),
            supported_parameters=self.get_supported_parameters(),
            description=self.description,
        )

    def _create_http_client(self) -> httpx.AsyncClient:
        """Helper to create configured httpx client with timeout and headers for future versions."""
        return httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
            headers={"User-Agent": f"SolarEarth/{settings.APP_VERSION} (Research & Education)"},
        )

    @abstractmethod
    async def get_current(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch current observation at specified geographic coordinates."""
        raise ProviderNotImplementedError(
            f"get_current is planned for {self.target_version}. Real API integration not implemented in V0.1.",
            provider_code=self.code,
        )

    @abstractmethod
    async def get_hourly(self, latitude: float, longitude: float, date: str) -> Dict[str, Any]:
        """Fetch hourly solar or geomagnetic series for a given date."""
        raise ProviderNotImplementedError(
            f"get_hourly is planned for {self.target_version}. Real API integration not implemented in V0.1.",
            provider_code=self.code,
        )

    @abstractmethod
    async def get_daily(
        self, latitude: float, longitude: float, start_date: str, end_date: str
    ) -> Dict[str, Any]:
        """Fetch daily aggregated data across a date interval."""
        raise ProviderNotImplementedError(
            f"get_daily is planned for {self.target_version}. Real API integration not implemented in V0.1.",
            provider_code=self.code,
        )

    @abstractmethod
    async def get_historical(
        self, latitude: float, longitude: float, start_year: int, end_year: int
    ) -> Dict[str, Any]:
        """Fetch multi-year historical solar climatology or reanalysis series."""
        raise ProviderNotImplementedError(
            f"get_historical is planned for {self.target_version}. Real API integration not implemented in V0.1.",
            provider_code=self.code,
        )
