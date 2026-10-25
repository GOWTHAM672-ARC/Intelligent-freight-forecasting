"""
Unit and Integration tests for FreightIQ FastAPI endpoints.
Run with: pytest
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify system health check returns HEALTHY and dynamic date metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "current_date" in data
    assert "current_week" in data
    assert "timestamp" in data


def test_root_endpoint():
    """Verify root API endpoint metadata."""
    response = client.get("/")
    assert response.status_code == 200


def test_live_tick_endpoint():
    """Verify live streaming tick endpoint structure and data types."""
    response = client.get("/api/live/tick")
    assert response.status_code == 200
    data = response.json()
    assert "bdi" in data
    assert "capesize_rate" in data
    assert "panamax_rate" in data
    assert "trend" in data
    assert data["trend"] in ["BULLISH", "BEARISH"]
    assert "current_week" in data


def test_kpi_endpoint():
    """Verify dynamic KPI metrics are returned with valid structure."""
    response = client.get("/api/kpi")
    assert response.status_code == 200
    kpis = response.json()
    assert isinstance(kpis, list)
    assert len(kpis) >= 4
    for kpi in kpis:
        assert "label" in kpi
        assert "value" in kpi
        assert "change" in kpi
        assert "changeUp" in kpi


def test_freight_rates_endpoint():
    """Verify freight rates time-series array."""
    response = client.get("/api/forecast/rates")
    assert response.status_code == 200
    rates = response.json()
    assert isinstance(rates, list)
    assert len(rates) > 0
    first = rates[0]
    assert "week" in first
    assert "forecast" in first


def test_cargo_volumes_endpoint():
    """Verify historical and projected cargo volumes."""
    response = client.get("/api/cargo/volumes")
    assert response.status_code == 200
    volumes = response.json()
    assert isinstance(volumes, list)
    assert len(volumes) > 0
    assert "coal" in volumes[0]
    assert "iron" in volumes[0]


def test_fleet_vessels_get_and_post():
    """Verify fetching vessel fleet and registering a new vessel."""
    # GET vessels
    response = client.get("/api/fleet/vessels")
    assert response.status_code == 200
    initial_vessels = response.json()
    assert isinstance(initial_vessels, list)

    # POST new vessel
    new_vessel = {
        "name": "MV Test Carrier",
        "type": "Capesize",
        "dwt": "175,000",
        "route": "Port Hedland → Vizag",
        "cargo": "Iron Ore",
        "eta": "15 Nov 2026",
        "rate": "$28,000",
        "status": "En Route"
    }
    create_res = client.post("/api/fleet/vessels", json=new_vessel)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["name"] == "MV Test Carrier"


def test_ports_activity_endpoint():
    """Verify port congestion & activity metrics."""
    response = client.get("/api/ports/activity")
    assert response.status_code == 200
    ports = response.json()
    assert isinstance(ports, list)
    assert len(ports) > 0
    assert "port" in ports[0]
    assert "inbound" in ports[0]


def test_alerts_endpoint():
    """Verify maritime alerts retrieval and alert creation."""
    response = client.get("/api/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)

    # Post new alert
    new_alert = {
        "type": "warning",
        "msg": "Weather cyclone warning off Bay of Bengal",
        "time": "Just now"
    }
    post_res = client.post("/api/alerts", json=new_alert)
    assert post_res.status_code == 200
    created = post_res.json()
    assert created["msg"] == new_alert["msg"]


def test_forecast_prediction_endpoint():
    """Verify ML freight prediction endpoint returns expected estimates and recommendations."""
    payload = {
        "vessel_type": "Capesize",
        "route": "Port Hedland → Vizag",
        "cargo": "Iron Ore",
        "bunker_fuel_price_usd": 640.0,
        "season_factor": 1.08
    }
    response = client.post("/api/forecast/predict", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert "predicted_daily_rate" in result
    assert result["predicted_daily_rate"] > 0
    assert "confidence_interval" in result
    assert "bdi_equivalent" in result
    assert "recommendation" in result
