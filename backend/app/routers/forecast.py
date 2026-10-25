"""
Endpoints for Rate Forecast and ML predictive simulations.
"""
from fastapi import APIRouter, Query
from typing import List, Optional
import math
from app.db import (
    FREIGHT_RATES_DATA,
    MODEL_METRICS_DATA,
    ROUTES_DATA,
)
from app.models import (
    FreightRatePoint,
    ModelInputItem,
    RouteItem,
    ForecastSimulationRequest,
    ForecastSimulationResponse,
    SimulationResultPoint,
)

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/rates", response_model=List[FreightRatePoint])
def get_rates(horizon: Optional[str] = Query("8w", description="Forecast horizon window: 4w, 8w, 12w")):
    """Returns historical and forecasted freight rate points."""
    if horizon == "4w":
        return FREIGHT_RATES_DATA[:10]
    return FREIGHT_RATES_DATA


@router.get("/model-metrics", response_model=List[ModelInputItem])
def get_model_metrics():
    """Current features & metrics powering the ensemble model (MAPE, BDI Signal, Bunker, Port Congestion)."""
    return MODEL_METRICS_DATA


@router.get("/routes", response_model=List[RouteItem])
def get_routes():
    """Active import maritime corridors and vessel tracking."""
    return ROUTES_DATA


@router.post("/simulate", response_model=ForecastSimulationResponse)
def simulate_forecast(req: ForecastSimulationRequest):
    """
    Simulates ML freight rate forecasts dynamically using an ensemble simulation logic
    combining BDI growth rate, bunker fuel costs, and port congestion index.
    """
    base_rate_map = {
        "Capesize": 23700,
        "Panamax": 18200,
        "Supramax": 15600,
        "Handysize": 12400,
    }
    base = base_rate_map.get(req.vessel_type, 20000)

    # Base coefficients from regression models
    bdi_factor = (req.bdi_growth_pct / 100.0) * 0.45
    bunker_delta = (req.bunker_fuel_price - 640.0) * 4.2
    congestion_impact = (req.port_congestion_index - 0.5) * 1800.0

    simulated: List[SimulationResultPoint] = []
    current = base

    for w in range(1, req.horizon_weeks + 1):
        # Compound growth plus seasonality curve
        trend = (bdi_factor * 0.3) + math.sin(w / 2.0) * 0.015
        current = int(current * (1 + trend) + (bunker_delta * 0.05) + (congestion_impact * 0.08))
        error_band = int(current * (0.045 + (w * 0.005)))
        confidence = max(65.0, round(92.0 - (w * 1.8), 1))

        simulated.append(
            SimulationResultPoint(
                week=f"+{w}w",
                projected_rate=current,
                lower_bound=current - error_band,
                upper_bound=current + error_band,
                confidence_pct=confidence,
            )
        )

    return ForecastSimulationResponse(
        model_name="FreightIQ-LSTM-XGBoost-Ensemble-v2.4",
        vessel_type=req.vessel_type,
        horizon_weeks=req.horizon_weeks,
        mape=4.8,
        simulated_rates=simulated,
    )
