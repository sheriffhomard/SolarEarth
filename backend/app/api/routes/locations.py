"""
Locations endpoint interacting with SQLite / relational database.
"""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.app.database.session import get_db
from backend.app.database.models.location import Location
from backend.app.schemas.location import LocationCreate, LocationRead

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=List[LocationRead], summary="List registered locations")
def list_locations(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)) -> List[Location]:
    """Retrieve indexed locations with coordinates."""
    stmt = select(Location).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED, summary="Create location")
def create_location(location_in: LocationCreate, db: Session = Depends(get_db)) -> Location:
    """Create a new geographic location with WKT representation."""
    db_location = Location(
        name=location_in.name,
        latitude=location_in.latitude,
        longitude=location_in.longitude,
        country=location_in.country,
        timezone=location_in.timezone,
        geom_wkt=f"POINT({location_in.longitude} {location_in.latitude})",
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location
