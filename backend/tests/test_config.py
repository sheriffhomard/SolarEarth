"""
Tests for application settings and configuration with SQLite and V0.2.
"""

from backend.app.core.config import Settings


def test_default_configuration_loaded():
    cfg = Settings()
    assert cfg.APP_NAME == "Solar Earth"
    assert cfg.APP_VERSION == "0.2.0"
    assert cfg.APP_ENV == "development"
    assert cfg.API_V1_PREFIX == "/api/v1"
    assert "sqlite" in cfg.DATABASE_URL
    assert cfg.PVGIS_ENABLED is True
    assert cfg.NASA_POWER_ENABLED is False
    assert cfg.NOAA_ENABLED is False
    assert cfg.EUMETSAT_ENABLED is False
    assert cfg.PROVIDER_REQUEST_TIMEOUT_SECONDS > 0
    assert cfg.PROVIDER_MAX_RETRIES >= 1


def test_cors_origins_parsing():
    cfg = Settings(CORS_ORIGINS="http://example.com, https://app.example.com")
    assert "http://example.com" in cfg.CORS_ORIGINS
    assert "https://app.example.com" in cfg.CORS_ORIGINS
