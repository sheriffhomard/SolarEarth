"""Info response schema."""

from typing import Dict, List
from pydantic import BaseModel, Field
from backend.app.schemas.provider import ProviderStatus


class InfoResponse(BaseModel):
    name: str = Field(default="Solar Earth", description="Application name")
    version: str = Field(default="0.1.0", description="Semantic version")
    environment: str = Field(default="development", description="Current execution environment")
    description: str = Field(
        default="Solar Earth foundation service - Solar radiation, GHI/DNI/DHI, space weather, and satellite data infrastructure",
        description="Application purpose"
    )
    database_type: str = Field(default="SQLite 3 (Local Mobile Embedded)", description="Local persistence engine")
    providers: Dict[str, ProviderStatus] = Field(description="Configured scientific data providers")
    roadmap: List[str] = Field(
        default=[
            "V0.1: Architecture & database foundation (Active)",
            "V0.2: PVGIS integration (GHI, DNI, DHI)",
            "V0.3: NASA POWER integration (Worldwide solar & meteorology)",
            "V0.4: NOAA SWPC integration (F10.7, Kp, Dst, flares)",
            "V0.5: Solar Earth application indices (Clear Sky, SRI, SAI, GAI)",
            "V0.6: Interactive global map & time slider",
            "V0.7: EUMETSAT satellite validation products",
        ]
    )
