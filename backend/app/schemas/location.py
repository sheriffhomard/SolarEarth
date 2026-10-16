"""Location schema models."""

from datetime import datetime
from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel, Field


class LocationBase(BaseModel):
    name: str = Field(min_length=1, max_length=255, description="Location title or station name")
    latitude: float = Field(ge=-90.0, le=90.0, description="WGS84 Latitude between -90 and 90")
    longitude: float = Field(ge=-180.0, le=180.0, description="WGS84 Longitude between -180 and 180")
    country: Optional[str] = Field(default=None, max_length=100)
    timezone: Optional[str] = Field(default=None, max_length=50)


class LocationCreate(LocationBase):
    pass


class LocationRead(LocationBase):
    id: Union[str, UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
