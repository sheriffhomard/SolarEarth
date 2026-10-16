"""
Health check route.
"""

from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.database.session import check_db_connection
from backend.app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service health status")
async def get_health() -> HealthResponse:
    """
    Returns service health check for orchestrators (Docker, Kubernetes) and clients.
    """
    db_ok = check_db_connection()
    return HealthResponse(
        status="ok" if db_ok else "degraded",
        service="solar-earth-api",
        version=settings.APP_VERSION,
        database="connected" if db_ok else "disconnected",
    )
