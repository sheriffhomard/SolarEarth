"""
Information route returning application metadata, active architecture, and provider status.
"""

from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.schemas.info import InfoResponse
from backend.app.services.provider_service import provider_registry

router = APIRouter(tags=["Information"])


@router.get("/info", response_model=InfoResponse, summary="Application metadata & providers")
async def get_info() -> InfoResponse:
    """
    Returns application identity, environment, database type, and provider status matrix.
    """
    return InfoResponse(
        name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        description="Solar Earth V0.1 technical foundation for solar radiation, space weather, and satellite observations.",
        database_type="SQLite 3 (Local Mobile Embedded)",
        providers=provider_registry.list_statuses(),
    )
