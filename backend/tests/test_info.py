"""
Tests for /api/v1/info endpoint.
"""

from fastapi.testclient import TestClient


def test_info_endpoint_status_200(client: TestClient):
    response = client.get("/api/v1/info")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Solar Earth"
    assert "providers" in data
    assert "pvgis" in data["providers"]
    assert "nasa_power" in data["providers"]
    assert "noaa" in data["providers"]
    assert "eumetsat" in data["providers"]

    # In V0.2: PVGIS is active, others remain inactive
    assert data["providers"]["pvgis"]["is_active_in_v0_1"] is True
    assert data["providers"]["nasa_power"]["is_active_in_v0_1"] is False
    assert data["providers"]["noaa"]["is_active_in_v0_1"] is False
    assert data["providers"]["eumetsat"]["is_active_in_v0_1"] is False
