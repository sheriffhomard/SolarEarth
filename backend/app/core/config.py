"""
Configuration settings for Solar Earth API using Pydantic Settings.
Configured with automatic reference defaults for local SQLite storage and PVGIS V0.2.
"""

from typing import List
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Application details
    APP_NAME: str = "Solar Earth"
    APP_VERSION: str = "0.2.0"
    APP_ENV: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # Database: Local SQLite by default (no Docker or cloud PostgreSQL required)
    DATABASE_URL: str = Field(
        default="sqlite:///./solar_earth.db",
        description="SQLAlchemy Database URL for local SQLite storage"
    )

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"]

    # External Solar Providers (PVGIS V0.2 Active)
    PVGIS_BASE_URL: str = "https://re.jrc.ec.europa.eu/api/v5_3/"
    PVGIS_ENABLED: bool = True
    PVGIS_CACHE_TTL_DAYS: int = 30
    PVGIS_RATE_LIMIT_PER_MINUTE: int = 20

    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/"
    NASA_POWER_ENABLED: bool = False
    NASA_POWER_API_KEY: str = "DEMO_KEY"

    NOAA_BASE_URL: str = "https://services.swpc.noaa.gov/"
    NOAA_ENABLED: bool = False

    EUMETSAT_BASE_URL: str = "https://data.eumetsat.int/"
    EUMETSAT_ENABLED: bool = False
    EUMETSAT_CONSUMER_KEY: str = "eumetsat_consumer_key_placeholder"
    EUMETSAT_CONSUMER_SECRET: str = "eumetsat_consumer_secret_placeholder"

    # Provider HTTP policies
    PROVIDER_REQUEST_TIMEOUT_SECONDS: float = 15.0
    PROVIDER_MAX_RETRIES: int = 3

    # Client frontend API URL
    VITE_API_BASE_URL: str = "/api/v1"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]


settings = Settings()
