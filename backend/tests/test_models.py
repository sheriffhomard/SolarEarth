"""
Tests for SQLAlchemy Models and Schema validation with local SQLite storage.
"""

from uuid import uuid4
from backend.app.database.models.location import Location
from backend.app.schemas.location import LocationCreate


def test_location_model_repr():
    loc = Location(
        id=str(uuid4()),
        name="Observatoire de Paris",
        latitude=48.8364,
        longitude=2.3364,
        country="France",
        timezone="Europe/Paris",
    )
    assert "Observatoire de Paris" in repr(loc)
    assert "48.8364" in repr(loc)


def test_location_create_validation():
    loc_in = LocationCreate(
        name="Greenwich Royal Observatory",
        latitude=51.4769,
        longitude=0.0,
        country="United Kingdom",
        timezone="Europe/London",
    )
    assert loc_in.latitude == 51.4769
    assert loc_in.longitude == 0.0
