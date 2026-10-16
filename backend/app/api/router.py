"""
API router aggregation.
"""

from fastapi import APIRouter
from backend.app.api.routes import health, info, providers, locations, radiation

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(info.router)
api_router.include_router(providers.router)
api_router.include_router(locations.router)
api_router.include_router(radiation.router)
