import os
import datetime
import random
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

# Try loading .env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = FastAPI(
    title="Intelligent Freight Forecasting API",
    version="1.0.0",
    description="Maritime logistics & predictive freight rate intelligence platform",
)

# CORS configuration for development and production
cors_env = os.getenv("CORS_ORIGINS", "*").strip()
if cors_env == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ──────────────────────────────────────────────────────────────────

class KpiMetric(BaseModel):
    label: str
    value: str
    sub: str
    change: str
    changeUp: bool
    updatedAt: Optional[str] = None

class FreightRatePoint(BaseModel):
    week: str
    actual: Optional[float] = None
    forecast: float
    bdi: Optional[float] = None

class CargoVolumePoint(BaseModel):
    month: str
    coal: float
    iron: float
    fertilizer: float
    grain: float

class PortActivity(BaseModel):
    port: str
    inbound: int
    outbound: int
    waiting: int

class Vessel(BaseModel):
    name: str
    type: str
    dwt: str
    route: str
    cargo: str
    eta: str
    rate: str
    status: str

class MaritimeAlert(BaseModel):
    type: str  # warning, success, danger, info
    msg: str
    time: str

class RouteLane(BaseModel):
    from_port: str = Field(..., alias="from")
    to_port: str = Field(..., alias="to")
    cargo: str
    distance: str
    time: str
    vessels: int

class ForecastPredictionRequest(BaseModel):
    route: str
    vessel_type: str
    cargo: str
    bunker_fuel_price_usd: float = 642.0
    season_factor: float = 1.08

class ForecastPredictionResponse(BaseModel):
    predicted_daily_rate: float
    currency: str = "USD"
    confidence_interval: dict
    bdi_equivalent: float
    recommendation: str

class LiveMarketTick(BaseModel):
    timestamp: str
    server_time: str
    current_week: str
    bdi: float
    capesize_rate: float
    panamax_rate: float
    bunker_vlsfo: float
    port_congestion_index: float
    active_charters: int
    change_pct: float
    trend: str

# ─── In-Memory Data Store (Aligned to October W3 2026) ─────────────────────────

_market_state = {
    "bdi": 2760.0,
    "capesize_rate": 27600.0,
    "panamax_rate": 19800.0,
    "bunker_vlsfo": 642.0,
    "congestion": 0.74,
}

# Real-time timeline: Current date is Week 3 October 2026 (Oct 19, 2026)
# Actuals recorded up to W3 Oct (Today); Forecast extends into late Oct and Nov 2026
FREIGHT_RATES: List[dict] = [
    {"week": "W1 Aug", "actual": 21500, "forecast": 21000, "bdi": 2150},
    {"week": "W2 Aug", "actual": 22800, "forecast": 22200, "bdi": 2280},
    {"week": "W3 Aug", "actual": 21200, "forecast": 21800, "bdi": 2120},
    {"week": "W4 Aug", "actual": 23400, "forecast": 23100, "bdi": 2340},
    {"week": "W1 Sep", "actual": 24100, "forecast": 24500, "bdi": 2410},
    {"week": "W2 Sep", "actual": 23700, "forecast": 24200, "bdi": 2370},
    {"week": "W3 Sep", "actual": 25100, "forecast": 24900, "bdi": 2510},
    {"week": "W4 Sep", "actual": 25900, "forecast": 25800, "bdi": 2590},
    {"week": "W1 Oct", "actual": 26800, "forecast": 26500, "bdi": 2680},
    {"week": "W2 Oct", "actual": 27200, "forecast": 27100, "bdi": 2720},
    {"week": "W3 Oct", "actual": 27600, "forecast": 27500, "bdi": 2760},
    {"week": "W4 Oct", "actual": 28400, "forecast": 28400, "bdi": 2840},
    {"week": "W1 Nov", "actual": None, "forecast": 29200, "bdi": None},
    {"week": "W2 Nov", "actual": None, "forecast": 29800, "bdi": None},
    {"week": "W3 Nov", "actual": None, "forecast": 30500, "bdi": None},
]

CARGO_VOLUMES: List[dict] = [
    {"month": "May", "coal": 2.1, "iron": 2.0, "fertilizer": 0.8, "grain": 1.1},
    {"month": "Jun", "coal": 2.7, "iron": 1.9, "fertilizer": 1.0, "grain": 0.7},
    {"month": "Jul", "coal": 3.1, "iron": 2.3, "fertilizer": 0.9, "grain": 1.3},
    {"month": "Aug", "coal": 3.4, "iron": 2.5, "fertilizer": 1.1, "grain": 1.4},
    {"month": "Sep", "coal": 3.2, "iron": 2.8, "fertilizer": 1.3, "grain": 1.2},
    {"month": "Oct", "coal": 3.6, "iron": 3.1, "fertilizer": 1.4, "grain": 1.5},
]

VESSELS: List[dict] = [
    {"name": "MV Eastern Star", "type": "Capesize", "dwt": "180,000", "route": "Port Hedland → Vizag", "cargo": "Iron Ore", "eta": "22 Oct 2026", "rate": "$27,600", "status": "En Route"},
    {"name": "MV Pacific Thunder", "type": "Panamax", "dwt": "75,000", "route": "Newcastle → Paradip", "cargo": "Thermal Coal", "eta": "25 Oct 2026", "rate": "$19,800", "status": "Loading"},
    {"name": "MV India Grit", "type": "Supramax", "dwt": "58,000", "route": "Richards Bay → Chennai", "cargo": "Steam Coal", "eta": "29 Oct 2026", "rate": "$16,900", "status": "At Port"},
    {"name": "MV Coastal Phoenix", "type": "Panamax", "dwt": "82,000", "route": "Tuticorin → Kolkata", "cargo": "Fertilizer", "eta": "02 Nov 2026", "rate": "$20,400", "status": "En Route"},
    {"name": "MV Bay Fortune", "type": "Handysize", "dwt": "38,000", "route": "Mundra → Krishnapatnam", "cargo": "Grain", "eta": "06 Nov 2026", "rate": "$13,800", "status": "Chartered"},
    {"name": "MV Iron Meridian", "type": "Capesize", "dwt": "205,000", "route": "Saldanha Bay → Vizag", "cargo": "Iron Ore", "eta": "12 Nov 2026", "rate": "$28,500", "status": "Negotiating"},
]

ALERTS: List[dict] = [
    {"type": "warning", "msg": "W4 Oct BDI hits 2,760 (+4.8% WoW) — Capesize freight rates surging into Q4 peak", "time": "Just now"},
    {"type": "success", "msg": "MV Eastern Star confirmed on-schedule arrival at Vizag anchorage — ETA 22 Oct", "time": "20 min ago"},
    {"type": "danger", "msg": "Post-monsoon wave surge off Bay of Bengal — Chennai & Paradip port turnaround extended 24h", "time": "1 hr ago"},
    {"type": "info", "msg": "Q4 coal import target revised upward to 5.2 MT — early chartering recommended before Nov rate hike", "time": "2 hr ago"},
    {"type": "warning", "msg": "Iron ore spot rate at Port Hedland rose 4.2% — consider locking 30-day index-linked forward", "time": "4 hr ago"},
]

PORTS: List[dict] = [
    {"port": "Vizag", "inbound": 26, "outbound": 20, "waiting": 7},
    {"port": "Paradip", "inbound": 21, "outbound": 14, "waiting": 5},
    {"port": "Chennai", "inbound": 33, "outbound": 29, "waiting": 9},
    {"port": "Kolkata", "inbound": 16, "outbound": 12, "waiting": 4},
    {"port": "Krishnapatnam", "inbound": 22, "outbound": 18, "waiting": 6},
]

ROUTES: List[dict] = [
    {"from": "Port Hedland, AUS", "to": "Vizag", "cargo": "Iron Ore", "distance": "4,820 nm", "time": "18d", "vessels": 4},
    {"from": "Newcastle, AUS", "to": "Paradip", "cargo": "Coal", "distance": "5,110 nm", "time": "20d", "vessels": 6},
    {"from": "Richards Bay, SA", "to": "Chennai", "cargo": "Steam Coal", "distance": "3,840 nm", "time": "15d", "vessels": 4},
    {"from": "Tuticorin, IN", "to": "Kolkata", "cargo": "Fertilizer", "distance": "1,620 nm", "time": "6d", "vessels": 3},
]

def _now_str() -> str:
    utc_dt = datetime.datetime.now(datetime.timezone.utc)
    ist_dt = utc_dt + datetime.timedelta(hours=5, minutes=30)
    return ist_dt.strftime("%H:%M:%S IST")

def _current_date_info() -> dict:
    utc_dt = datetime.datetime.now(datetime.timezone.utc)
    ist_dt = utc_dt + datetime.timedelta(hours=5, minutes=30)
    month_name = ist_dt.strftime("%b")
    day = ist_dt.day
    year = ist_dt.year
    week_num = min(5, (day - 1) // 7 + 1)
    week_str = f"W{week_num} {month_name}"
    date_str = f"{month_name} {day}, {year}"
    return {
        "date_str": date_str,
        "week_str": week_str,
        "full_str": f"{date_str} ({week_str})",
        "timestamp": ist_dt.strftime("%H:%M:%S IST"),
    }

def _step_market():
    """Simulate subtle real-time market random-walk fluctuation around current baseline."""
    delta_rate = round(random.uniform(-45.0, 55.0), 1)
    _market_state["capesize_rate"] = max(24000.0, round(_market_state["capesize_rate"] + delta_rate, 0))
    _market_state["bdi"] = max(2200.0, round(_market_state["bdi"] + (delta_rate / 10.0), 0))
    _market_state["panamax_rate"] = max(17000.0, round(_market_state["panamax_rate"] + random.uniform(-25.0, 30.0), 0))
    # Update current week's spot in FREIGHT_RATES dynamically
    info = _current_date_info()
    current_wk = info["week_str"]
    updated = False
    for pt in FREIGHT_RATES:
        if pt["week"] == current_wk:
            pt["actual"] = _market_state["capesize_rate"]
            pt["bdi"] = _market_state["bdi"]
            updated = True
            break
    if not updated and len(FREIGHT_RATES) > 11:
        FREIGHT_RATES[11]["actual"] = _market_state["capesize_rate"]
        FREIGHT_RATES[11]["bdi"] = _market_state["bdi"]

# ─── Endpoints ────────────────────────────────────────────────────────────────

# Detect frontend dist directory for unified production deployment
frontend_dist_env = os.getenv("FRONTEND_DIST")
frontend_dist_default = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
frontend_dist = frontend_dist_env if frontend_dist_env and os.path.exists(frontend_dist_env) else (
    frontend_dist_default if os.path.exists(frontend_dist_default) else None
)

@app.get("/")
def root():
    info = _current_date_info()
    if frontend_dist and os.path.exists(os.path.join(frontend_dist, "index.html")):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    return {
        "service": "Intelligent Freight Forecasting API",
        "status": "LIVE",
        "current_date": info["date_str"],
        "current_week": info["full_str"],
        "version": "1.0.0",
        "docs": "/docs",
        "timestamp": info["timestamp"]
    }

@app.get("/health")
def health_check():
    info = _current_date_info()
    return {
        "status": "HEALTHY",
        "service": "Intelligent Freight Forecasting API",
        "current_date": info["date_str"],
        "current_week": info["full_str"],
        "timestamp": info["timestamp"]
    }

@app.get("/api/live/tick", response_model=LiveMarketTick)
def get_live_tick():
    """Live streaming tick endpoint that returns current market prices and timestamp."""
    _step_market()
    info = _current_date_info()
    rate = _market_state["capesize_rate"]
    bdi = _market_state["bdi"]
    panamax = _market_state["panamax_rate"]
    pct = round(((rate - 26800.0) / 26800.0) * 100, 2)
    return LiveMarketTick(
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        server_time=info["timestamp"],
        current_week=info["week_str"],
        bdi=bdi,
        capesize_rate=rate,
        panamax_rate=panamax,
        bunker_vlsfo=_market_state["bunker_vlsfo"],
        port_congestion_index=_market_state["congestion"],
        active_charters=len(VESSELS) * 2 + 3,
        change_pct=pct,
        trend="BULLISH" if pct >= 0 else "BEARISH",
    )

@app.get("/api/kpi", response_model=List[KpiMetric])
def get_kpis():
    """Returns dynamic KPI metrics reflecting real-time market position."""
    _step_market()
    info = _current_date_info()
    rate = int(_market_state["capesize_rate"])
    bdi = int(_market_state["bdi"])
    ts = info["timestamp"]
    date_str = info["date_str"]
    week_str = info["week_str"]
    return [
        {
            "label": "Avg Freight Rate",
            "value": f"${rate:,}",
            "sub": f"USD/day · Capesize ({week_str})",
            "change": "4.8% WoW",
            "changeUp": True,
            "updatedAt": ts
        },
        {
            "label": "Baltic Dry Index",
            "value": f"{bdi:,}",
            "sub": f"{date_str} ({ts})",
            "change": "3.6% WoW",
            "changeUp": True,
            "updatedAt": ts
        },
        {
            "label": "Active Charters",
            "value": str(len(VESSELS) + 9),
            "sub": "vessels under contract",
            "change": "3 New this week",
            "changeUp": True,
            "updatedAt": ts
        },
        {
            "label": "Cargo Volume",
            "value": "9.6 MT",
            "sub": "Oct 2026 forecast",
            "change": "1.2% vs Sep",
            "changeUp": True,
            "updatedAt": ts
        },
    ]

@app.get("/api/forecast/rates", response_model=List[FreightRatePoint])
def get_freight_rates():
    return FREIGHT_RATES

@app.get("/api/cargo/volumes", response_model=List[CargoVolumePoint])
def get_cargo_volumes():
    return CARGO_VOLUMES

@app.get("/api/fleet/vessels", response_model=List[Vessel])
def get_fleet_vessels():
    return VESSELS

@app.post("/api/fleet/vessels", response_model=Vessel)
def add_vessel(vessel: Vessel):
    VESSELS.insert(0, vessel.model_dump())
    ALERTS.insert(0, {
        "type": "info",
        "msg": f"New vessel {vessel.name} ({vessel.type}) chartered on {vessel.route} — ETA {vessel.eta}",
        "time": "Just now"
    })
    return vessel

@app.get("/api/ports/activity", response_model=List[PortActivity])
def get_port_activity():
    return PORTS

@app.get("/api/alerts", response_model=List[MaritimeAlert])
def get_alerts():
    return ALERTS

@app.post("/api/alerts", response_model=MaritimeAlert)
def create_alert(alert: MaritimeAlert):
    ALERTS.insert(0, alert.model_dump())
    return alert

@app.get("/api/routes")
def get_routes():
    return ROUTES

@app.post("/api/forecast/predict", response_model=ForecastPredictionResponse)
def predict_freight_rate(req: ForecastPredictionRequest):
    base_rate_map = {
        "Capesize": 27500.0,
        "Panamax": 19800.0,
        "Supramax": 16900.0,
        "Handysize": 13800.0,
    }
    base = base_rate_map.get(req.vessel_type, 20000.0)
    bunker_impact = (req.bunker_fuel_price_usd - 640.0) * 8.5
    predicted = round((base + bunker_impact) * req.season_factor, 2)
    low_bound = round(predicted * 0.94, 2)
    high_bound = round(predicted * 1.06, 2)

    return ForecastPredictionResponse(
        predicted_daily_rate=predicted,
        currency="USD",
        confidence_interval={"p10": low_bound, "p90": high_bound, "confidence": "91%"},
        bdi_equivalent=round(predicted / 10.0, 1),
        recommendation=f"Q4 seasonal demand peaks by mid-November. Secure 45-day charter for {req.vessel_type} on {req.route} before rates exceed ${high_bound:,.0f}."
    )

# Static assets & SPA fallback routing for unified production deployment
if frontend_dist and os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["api", "health", "docs", "openapi.json", "redoc"]:
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=os.getenv("RELOAD", "false").lower() == "true")

