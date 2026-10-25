"""
Pydantic data models for FreightIQ API.
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class KpiMetric(BaseModel):
    label: str
    value: str
    sub: str
    change: str
    changeUp: bool


class FreightRatePoint(BaseModel):
    week: str
    actual: Optional[int] = None
    forecast: int
    bdi: Optional[int] = None


class CargoVolumePoint(BaseModel):
    month: str
    coal: float
    iron: float
    fertilizer: float
    grain: float


class AlertItem(BaseModel):
    id: Optional[str] = None
    type: Literal["warning", "success", "danger", "info"]
    msg: str
    time: str


class VesselItem(BaseModel):
    id: Optional[str] = None
    name: str
    type: Literal["Capesize", "Panamax", "Supramax", "Handysize"]
    dwt: str
    route: str
    cargo: str
    eta: str
    rate: str
    status: Literal["En Route", "Loading", "At Port", "Chartered", "Negotiating"]


class VesselUtilizationPoint(BaseModel):
    name: str
    utilized: int
    idle: int


class PortItem(BaseModel):
    name: str
    code: str
    state: str
    cap: str
    draft: str
    congestion: Literal["Low", "Medium", "High"]
    utilization: int


class PortActivityPoint(BaseModel):
    port: str
    inbound: int
    outbound: int
    waiting: int


class RouteItem(BaseModel):
    from_port: str = Field(..., alias="from")
    to: str
    cargo: str
    distance: str
    time: str
    vessels: int

    class Config:
        populate_by_name = True


class RecommendationItem(BaseModel):
    id: Optional[str] = None
    priority: Literal["HIGH", "MEDIUM", "LOW"]
    title: str
    detail: str
    action: str
    color: str


class CostBreakdownItem(BaseModel):
    label: str
    pct: int
    value: str
    color: str


class ModelInputItem(BaseModel):
    label: str
    value: str
    note: str


# ML Simulation / Forecast Request & Response
class ForecastSimulationRequest(BaseModel):
    vessel_type: Literal["Capesize", "Panamax", "Supramax", "Handysize"] = "Capesize"
    horizon_weeks: int = Field(8, ge=2, le=24)
    bdi_growth_pct: float = Field(3.0, ge=-50.0, le=100.0)
    bunker_fuel_price: float = Field(642.0, ge=300.0, le=1500.0)
    port_congestion_index: float = Field(0.74, ge=0.0, le=2.0)


class SimulationResultPoint(BaseModel):
    week: str
    projected_rate: int
    lower_bound: int
    upper_bound: int
    confidence_pct: float


class ForecastSimulationResponse(BaseModel):
    model_name: str
    vessel_type: str
    horizon_weeks: int
    mape: float
    simulated_rates: List[SimulationResultPoint]
