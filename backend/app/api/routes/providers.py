"""
Provider registry inspection endpoints.
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.provider import ProviderRegistrySummary, ProviderStatus
from backend.app.services.provider_service import provider_registry

router = APIRouter(prefix="/providers", tags=["Providers"])


@router.get("", response_model=ProviderRegistrySummary, summary="List all data providers")
async def list_providers() -> ProviderRegistrySummary:
    """Returns overview of all solar, geomagnetic, and satellite providers."""
    return provider_registry.get_summary()


@router.get("/{code}", response_model=ProviderStatus, summary="Get provider details")
async def get_provider(code: str) -> ProviderStatus:
    """Returns specific provider metadata and supported operations."""
    provider = provider_registry.get_provider(code.lower())
    if not provider:
        raise HTTPException(
            status_code=404,
            detail=f"Provider '{code}' not found in registry. Available: pvgis, nasa_power, noaa, eumetsat",
        )
    return provider.get_status()
