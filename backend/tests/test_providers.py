"""
Tests for Provider architecture: PVGIS (V0.2 Live), NASA POWER, NOAA, EUMETSAT.
"""

import pytest
from backend.app.providers.pvgis import PVGISProvider
from backend.app.providers.nasa_power import NASAPowerProvider
from backend.app.providers.noaa import NOAAProvider
from backend.app.providers.eumetsat import EUMETSATProvider
from backend.app.providers.base import ProviderNotImplementedError
from backend.app.services.provider_service import provider_registry


def test_provider_registry_contains_all_four_providers():
    summary = provider_registry.get_summary()
    assert summary.total_count == 4
    for code in ["pvgis", "nasa_power", "noaa", "eumetsat"]:
        assert code in summary.providers
        status = summary.providers[code]
        assert len(status.supported_parameters) > 0

    # In V0.2, PVGIS is active!
    assert summary.providers["pvgis"].is_active_in_v0_1 is True


@pytest.mark.asyncio
async def test_pvgis_provider_returns_24h_series():
    pvgis = PVGISProvider()
    assert pvgis.code == "pvgis"
    assert pvgis.target_version == "V0.2"

    # Test get_hourly for Paris Observatory coordinates
    data = await pvgis.get_hourly(48.836, 2.336, "2026-06-21")
    assert "hourly" in data
    assert len(data["hourly"]) == 24
    assert data["daily_irradiation_kwh"] > 0
    assert data["peak_ghi"] > 0

    # Midday hour check (around solar noon hour 12 UTC)
    noon_point = data["hourly"][12]
    assert noon_point["hour"] == 12
    assert "ghi" in noon_point
    assert "dni" in noon_point
    assert "dhi" in noon_point
    assert noon_point["solar_elevation"] > 0


@pytest.mark.asyncio
async def test_pvgis_provider_cache_mechanism():
    pvgis = PVGISProvider()
    # First call sets cache
    res1 = await pvgis.get_hourly(48.836, 2.336, "2026-06-21")
    # Second call hits cache
    res2 = await pvgis.get_hourly(48.836, 2.336, "2026-06-21")
    assert res2["cached"] is True
    assert res2["daily_irradiation_kwh"] == res1["daily_irradiation_kwh"]


@pytest.mark.asyncio
async def test_nasa_power_provider_raises_not_implemented():
    nasa = NASAPowerProvider()
    assert nasa.code == "nasa_power"
    assert nasa.target_version == "V0.3"

    with pytest.raises(ProviderNotImplementedError) as exc_info:
        await nasa.get_hourly(48.8566, 2.3522, "2026-10-06")
    assert exc_info.value.provider_code == "nasa_power"


@pytest.mark.asyncio
async def test_noaa_provider_raises_not_implemented():
    noaa = NOAAProvider()
    assert noaa.code == "noaa"
    assert noaa.target_version == "V0.4"

    with pytest.raises(ProviderNotImplementedError) as exc_info:
        await noaa.get_current(0.0, 0.0)
    assert exc_info.value.provider_code == "noaa"


@pytest.mark.asyncio
async def test_eumetsat_provider_raises_not_implemented():
    eumetsat = EUMETSATProvider()
    assert eumetsat.code == "eumetsat"
    assert eumetsat.target_version == "V0.7"

    with pytest.raises(ProviderNotImplementedError) as exc_info:
        await eumetsat.get_daily(48.8566, 2.3522, "2026-10-01", "2026-10-06")
    assert exc_info.value.provider_code == "eumetsat"
