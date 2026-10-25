"""
Endpoints for Overview tab: KPI summaries, cargo volumes, Baltic Dry Index, and alerts.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from app.db import (
    FREIGHT_RATES_DATA,
    CARGO_VOLUME_DATA,
    ALERTS_DATA,
    VESSELS_DATA,
)
from app.models import KpiMetric, CargoVolumePoint, AlertItem

router = APIRouter(prefix="/overview", tags=["Overview"])


@router.get("/kpis", response_model=List[KpiMetric])
def get_kpis():
    """Returns overview KPI metrics calculated from active records."""
    active_charters = len([v for v in VESSELS_DATA if v.get("status") in ["Chartered", "En Route", "Loading", "At Port"]])
    latest_rate = "$23,700"
    latest_bdi = "2,370"

    return [
        {
            "label": "Avg Freight Rate",
            "value": latest_rate,
            "sub": "USD/day · Capesize",
            "change": "4.2% WoW",
            "changeUp": True,
        },
        {
            "label": "Baltic Dry Index",
            "value": latest_bdi,
            "sub": "Sep 19, 2026",
            "change": "3.1% WoW",
            "changeUp": True,
        },
        {
            "label": "Active Charters",
            "value": str(active_charters),
            "sub": "vessels under contract",
            "change": "2 from last month",
            "changeUp": True,
        },
        {
            "label": "Cargo Volume",
            "value": "8.4 MT",
            "sub": "Sep forecast",
            "change": "0.8% vs Aug",
            "changeUp": False,
        },
    ]


@router.get("/cargo-volume", response_model=List[CargoVolumePoint])
def get_cargo_volume():
    """Monthly cargo demand volumes across Coal, Iron Ore, Fertilizer, and Grain."""
    return CARGO_VOLUME_DATA


@router.get("/alerts", response_model=List[AlertItem])
def get_alerts():
    """Live supply chain, maritime weather, and charter market alerts."""
    return ALERTS_DATA


@router.post("/alerts", response_model=AlertItem)
def create_alert(alert: AlertItem):
    """Add a real-time operational alert."""
    new_alert = alert.model_dump()
    new_alert["id"] = f"alt-{len(ALERTS_DATA) + 1}"
    ALERTS_DATA.insert(0, new_alert)
    return new_alert
