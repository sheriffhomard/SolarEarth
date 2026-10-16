"""
Pydantic schemas for data providers and status inspection.
"""

from enum import Enum
from typing import Dict, List
from pydantic import BaseModel, Field


class ProviderState(str, Enum):
    CONFIGURED = "configured"
    ENABLED = "enabled"
    DISABLED = "disabled"


class SupportedOperations(BaseModel):
    current: bool = False
    hourly: bool = False
    daily: bool = False
    historical: bool = False


class ProviderStatus(BaseModel):
    code: str = Field(description="Unique provider identifier, e.g. pvgis, nasa_power, noaa, eumetsat")
    name: str = Field(description="Human readable name")
    state: ProviderState = Field(description="Provider readiness: enabled, disabled, or configured")
    base_url: str = Field(description="Target API base endpoint")
    target_version: str = Field(description="Roadmap version where live integration lands (e.g. V0.2, V0.3)")
    is_active_in_v0_1: bool = Field(default=False, description="Strictly false in V0.1 foundation")
    supported_operations: SupportedOperations
    supported_parameters: List[str] = Field(default_factory=list, description="e.g. GHI, DNI, DHI, Kp, F10.7")
    description: str


class ProviderRegistrySummary(BaseModel):
    providers: Dict[str, ProviderStatus]
    total_count: int
    v0_1_policy: str = "All providers are architectural placeholders. No external network requests performed."
