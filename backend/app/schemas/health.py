"""Health response schema."""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Overall service status ('ok' or 'degraded')")
    service: str = Field(default="solar-earth-api", description="Service identifier")
    version: str = Field(default="0.1.0", description="API version")
    database: Optional[str] = Field(default=None, description="Database connection status ('connected' or 'disconnected')")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp of check")
