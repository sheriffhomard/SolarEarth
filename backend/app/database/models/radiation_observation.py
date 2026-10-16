"""
RadiationObservation model storing time-series solar irradiance measurements and models.
Units: GHI (W/m²), DNI (W/m²), DHI (W/m²).
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Index
from backend.app.database.base import Base


class RadiationObservation(Base):
    __tablename__ = "radiation_observations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    location_id = Column(String(36), ForeignKey("locations.id", ondelete="CASCADE"), nullable=True, index=True)

    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    source = Column(String(50), nullable=False, default="pvgis", index=True)
    observation_type = Column(String(30), nullable=False, default="model")  # measurement, model, satellite

    # Primary Solar Irradiance components in W/m²
    ghi = Column(Float, nullable=False, comment="Global Horizontal Irradiance in W/m²")
    dni = Column(Float, nullable=False, comment="Direct Normal Irradiance in W/m²")
    dhi = Column(Float, nullable=False, comment="Diffuse Horizontal Irradiance in W/m²")

    # Solar position & atmospheric properties
    solar_elevation = Column(Float, nullable=True, comment="Sun elevation angle in degrees")
    solar_azimuth = Column(Float, nullable=True, comment="Sun azimuth angle in degrees")
    temperature = Column(Float, nullable=True, comment="Ambient 2m air temperature in °C")

    quality_flag = Column(String(20), nullable=False, default="validated")  # validated, model_clearsky, synthetic

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_rad_obs_loc_time", "location_id", "timestamp"),
        Index("idx_rad_obs_source_time", "source", "timestamp"),
    )

    def __repr__(self) -> str:
        return f"<RadiationObservation(source='{self.source}', time='{self.timestamp}', GHI={self.ghi} W/m²)>"
