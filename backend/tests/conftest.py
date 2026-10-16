"""
Pytest fixtures for Solar Earth tests.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings


@pytest.fixture
def client() -> TestClient:
    """Synchronous test client for FastAPI application."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def app_settings():
    """Application settings fixture."""
    return settings
