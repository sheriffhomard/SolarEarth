"""
Tests for /api/v1/radiation endpoints (hourly and daily).
"""

from fastapi.testclient import TestClient


def test_hourly_radiation_endpoint(client: TestClient):
    response = client.get("/api/v1/radiation/hourly?latitude=48.836&longitude=2.336&date=2026-06-21")
    assert response.status_code == 200
    data = response.json()
    assert "hourly" in data
    assert len(data["hourly"]) == 24
    assert data["latitude"] == 48.836
    assert data["longitude"] == 2.336
    assert data["daily_irradiation_kwh"] > 0
    assert data["peak_ghi"] > 0
    assert "sunshine_hours" in data


def test_daily_radiation_endpoint(client: TestClient):
    response = client.get("/api/v1/radiation/daily?latitude=48.836&longitude=2.336&start_date=2026-06-20&end_date=2026-06-22")
    assert response.status_code == 200
    data = response.json()
    assert "daily" in data
    assert data["days_count"] == 3
    assert data["average_daily_kwh"] > 0
