"""
Tests for /api/v1/health endpoint.
"""

from fastapi.testclient import TestClient


def test_health_endpoint_status_200(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["service"] == "solar-earth-api"
    assert data["version"] == "0.2.0"
    assert "timestamp" in data


def test_root_endpoint_status_200(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Solar Earth Backend API"
    assert "docs" in data
