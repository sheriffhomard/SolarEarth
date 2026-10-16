"""
FastAPI application entry point for Solar Earth API.
"""

from contextlib import asynccontextmanager
import time
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, get_logger
from backend.app.api.router import api_router
from backend.app.providers.base import ProviderException, ProviderNotImplementedError

logger = get_logger("API")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan event handler for startup and shutdown."""
    setup_logging(level=settings.LOG_LEVEL)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.APP_ENV})")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Solar Earth Technical Foundation V0.1 — Mesure, calcul et visualisation du rayonnement solaire reçu sur Terre.",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# HTTP Request Logging & Timing Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} ({duration_ms:.2f}ms)"
    )
    return response


# Provider Exception Handler
@app.exception_handler(ProviderNotImplementedError)
async def provider_not_implemented_handler(request: Request, exc: ProviderNotImplementedError):
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={
            "error": "provider_not_implemented",
            "message": exc.message,
            "provider": exc.provider_code,
            "v0_1_note": "Real provider integration begins in V0.2. V0.1 provides architectural foundation only.",
        },
    )


@app.exception_handler(ProviderException)
async def provider_exception_handler(request: Request, exc: ProviderException):
    logger.warning(f"Provider error [{exc.provider_code}]: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code or status.HTTP_502_BAD_GATEWAY,
        content={
            "error": "provider_error",
            "message": exc.message,
            "provider": exc.provider_code,
        },
    )


# Database Error Handler (Never leak raw traces)
@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "database_error",
            "message": "Database query failure or temporary unavailability.",
        },
    )


# Generic Unhandled Exception Handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": "An unexpected server error occurred. Please consult system logs.",
        },
    )


# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Root greeting / endpoint discovery
@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": "Solar Earth Backend API",
        "version": settings.APP_VERSION,
        "docs": f"{settings.API_V1_PREFIX}/docs",
        "health": f"{settings.API_V1_PREFIX}/health",
        "info": f"{settings.API_V1_PREFIX}/info",
    }
