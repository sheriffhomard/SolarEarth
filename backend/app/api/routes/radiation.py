"""
API routes for solar radiation data (hourly profiles and daily series).
Provides GHI, DNI, DHI from PVGIS JRC with caching, rate limiting, and persistence.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.app.database.session import get_db
from backend.app.database.models.location import Location
from backend.app.database.models.radiation_observation import RadiationObservation
from backend.app.schemas.radiation import HourlyRadiationResponse, DailyRadiationResponse
from backend.app.services.provider_service import provider_registry

router = APIRouter(prefix="/radiation", tags=["Solar Radiation"])


@router.get("/hourly", response_model=HourlyRadiationResponse, summary="Get 24-hour solar radiation profile")
async def get_hourly_radiation(
    latitude: Optional[float] = Query(default=None, ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    longitude: Optional[float] = Query(default=None, ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    location_id: Optional[str] = Query(default=None, description="Optional stored location UUID"),
    date: Optional[str] = Query(default=None, description="Date in YYYY-MM-DD format (defaults to today)"),
    db: Session = Depends(get_db),
) -> HourlyRadiationResponse:
    """
    Returns 24 hourly solar radiation components (GHI, DNI, DHI, solar elevation, temperature)
    from European Commission PVGIS JRC with local caching and astronomical physical validation.
    """
    loc_name: Optional[str] = None

    # Resolve location if location_id is provided
    if location_id:
        loc = db.scalar(select(Location).where(Location.id == location_id))
        if loc:
            latitude = loc.latitude
            longitude = loc.longitude
            loc_name = loc.name
        elif latitude is None or longitude is None:
            raise HTTPException(status_code=404, detail=f"Location with id '{location_id}' not found.")

    # Defaults to Paris Observatory if coordinates are omitted
    if latitude is None or longitude is None:
        latitude = 48.836
        longitude = 2.336
        loc_name = "Observatoire de Paris"

    # Default to current date if omitted or validate calendar format
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    else:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
            if parsed_date.year < 1980 or parsed_date.year > 2060:
                raise HTTPException(
                    status_code=422,
                    detail="Date out of supported range (1980-2060)."
                )
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid date format '{date}'. Expected YYYY-MM-DD."
            )

    pvgis_provider = provider_registry.get_provider("pvgis")
    if not pvgis_provider:
        raise HTTPException(status_code=500, detail="PVGIS provider not registered.")

    data = await pvgis_provider.get_hourly(latitude=latitude, longitude=longitude, date_str=date)
    data["location_name"] = loc_name

    # Optionally persist in radiation_observations table for future history/aggregation
    try:
        if location_id and data.get("hourly"):
            for pt in data["hourly"]:
                ts_str = pt.get("time")
                try:
                    ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                except Exception:
                    ts = datetime.now(timezone.utc)

                obs = RadiationObservation(
                    location_id=location_id,
                    timestamp=ts,
                    source=data.get("source", "pvgis"),
                    observation_type="model",
                    ghi=pt.get("ghi", 0.0),
                    dni=pt.get("dni", 0.0),
                    dhi=pt.get("dhi", 0.0),
                    solar_elevation=pt.get("solar_elevation"),
                    temperature=pt.get("temperature"),
                    quality_flag=pt.get("quality_flag", "validated"),
                )
                db.add(obs)
            db.commit()
    except Exception:
        db.rollback()  # Ignore persistence errors gracefully

    return HourlyRadiationResponse(**data)


@router.get("/daily", response_model=DailyRadiationResponse, summary="Get daily aggregated radiation")
async def get_daily_radiation(
    latitude: float = Query(ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    longitude: float = Query(ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    start_date: str = Query(description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(description="End date in YYYY-MM-DD format"),
) -> DailyRadiationResponse:
    """
    Returns daily irradiation totals (GHI, DNI, DHI in kWh/m²) over the specified interval.
    """
    # Validate date intervals
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid date format. Both start_date and end_date must be YYYY-MM-DD."
        )

    if end_dt < start_dt:
        raise HTTPException(
            status_code=422,
            detail=f"end_date ({end_date}) cannot precede start_date ({start_date})."
        )

    if (end_dt - start_dt).days > 366:
        raise HTTPException(
            status_code=422,
            detail="Date range exceeds maximum allowed interval of 366 days."
        )

    pvgis_provider = provider_registry.get_provider("pvgis")
    if not pvgis_provider:
        raise HTTPException(status_code=500, detail="PVGIS provider not registered.")

    data = await pvgis_provider.get_daily(
        latitude=latitude,
        longitude=longitude,
        start_date=start_date,
        end_date=end_date,
    )
    return DailyRadiationResponse(**data)
