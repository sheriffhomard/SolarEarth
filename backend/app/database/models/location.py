"""
Location model for local SQLite storage (and portable across SQL dialects).
Stores stations and geographical points with latitude, longitude, and metadata.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Float, DateTime, Index
from backend.app.database.base import Base


class Location(Base):
    __tablename__ = "locations"

    # String UUID primary key for maximum compatibility with SQLite and PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)

    # WKT or GeoJSON representation (e.g. POINT(lon lat))
    geom_wkt = Column(String(100), nullable=True)

    country = Column(String(100), nullable=True, index=True)
    timezone = Column(String(50), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_locations_lat_lon", "latitude", "longitude"),
    )

    def __repr__(self) -> str:
        return f"<Location(name='{self.name}', lat={self.latitude}, lon={self.longitude})>"
