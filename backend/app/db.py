"""
Initial database state and memory store for FreightIQ.
"""
from typing import List, Dict, Any

FREIGHT_RATES_DATA: List[Dict[str, Any]] = [
    {"week": "W1 Jul", "actual": 18200, "forecast": 18500, "bdi": 1820},
    {"week": "W2 Jul", "actual": 17800, "forecast": 18100, "bdi": 1785},
    {"week": "W3 Jul", "actual": 19100, "forecast": 18900, "bdi": 1910},
    {"week": "W4 Jul", "actual": 20300, "forecast": 19800, "bdi": 2030},
    {"week": "W1 Aug", "actual": 21500, "forecast": 21000, "bdi": 2150},
    {"week": "W2 Aug", "actual": 22800, "forecast": 22200, "bdi": 2280},
    {"week": "W3 Aug", "actual": 21200, "forecast": 21800, "bdi": 2120},
    {"week": "W4 Aug", "actual": 23400, "forecast": 23100, "bdi": 2340},
    {"week": "W1 Sep", "actual": 24100, "forecast": 24500, "bdi": 2410},
    {"week": "W2 Sep", "actual": 23700, "forecast": 24200, "bdi": 2370},
    {"week": "W3 Sep", "actual": None, "forecast": 25100, "bdi": None},
    {"week": "W4 Sep", "actual": None, "forecast": 26300, "bdi": None},
    {"week": "W1 Oct", "actual": None, "forecast": 27800, "bdi": None},
    {"week": "W2 Oct", "actual": None, "forecast": 28400, "bdi": None},
]

CARGO_VOLUME_DATA: List[Dict[str, Any]] = [
    {"month": "Apr", "coal": 2.4, "iron": 1.8, "fertilizer": 0.6, "grain": 0.9},
    {"month": "May", "coal": 2.1, "iron": 2.0, "fertilizer": 0.8, "grain": 1.1},
    {"month": "Jun", "coal": 2.7, "iron": 1.9, "fertilizer": 1.0, "grain": 0.7},
    {"month": "Jul", "coal": 3.1, "iron": 2.3, "fertilizer": 0.9, "grain": 1.3},
    {"month": "Aug", "coal": 3.4, "iron": 2.5, "fertilizer": 1.1, "grain": 1.4},
    {"month": "Sep", "coal": 3.2, "iron": 2.8, "fertilizer": 1.3, "grain": 1.2},
]

VESSEL_UTILIZATION_DATA: List[Dict[str, Any]] = [
    {"name": "Capesize", "utilized": 78, "idle": 22},
    {"name": "Panamax", "utilized": 85, "idle": 15},
    {"name": "Supramax", "utilized": 91, "idle": 9},
    {"name": "Handysize", "utilized": 88, "idle": 12},
]

PORT_ACTIVITY_DATA: List[Dict[str, Any]] = [
    {"port": "Vizag", "inbound": 24, "outbound": 18, "waiting": 6},
    {"port": "Paradip", "inbound": 18, "outbound": 12, "waiting": 4},
    {"port": "Chennai", "inbound": 31, "outbound": 27, "waiting": 8},
    {"port": "Kolkata", "inbound": 14, "outbound": 11, "waiting": 3},
    {"port": "Krishnapatnam", "inbound": 20, "outbound": 16, "waiting": 5},
]

PORTS_DATA: List[Dict[str, Any]] = [
    {
        "name": "Visakhapatnam (Vizag)",
        "code": "INVTZ",
        "state": "Andhra Pradesh",
        "cap": "90 MT/yr",
        "draft": "17.5 m",
        "congestion": "Medium",
        "utilization": 74,
    },
    {
        "name": "Paradip Port",
        "code": "INPAQ",
        "state": "Odisha",
        "cap": "110 MT/yr",
        "draft": "16.0 m",
        "congestion": "Low",
        "utilization": 61,
    },
    {
        "name": "Chennai Port",
        "code": "INMAA",
        "state": "Tamil Nadu",
        "cap": "78 MT/yr",
        "draft": "14.5 m",
        "congestion": "High",
        "utilization": 89,
    },
    {
        "name": "Kolkata / Haldia",
        "code": "INCCU",
        "state": "West Bengal",
        "cap": "45 MT/yr",
        "draft": "8.5 m",
        "congestion": "Low",
        "utilization": 52,
    },
    {
        "name": "Krishnapatnam Port",
        "code": "INKRI",
        "state": "Andhra Pradesh",
        "cap": "60 MT/yr",
        "draft": "17.0 m",
        "congestion": "Medium",
        "utilization": 68,
    },
    {
        "name": "Kamarajar Port",
        "code": "INENS",
        "state": "Tamil Nadu",
        "cap": "35 MT/yr",
        "draft": "15.5 m",
        "congestion": "Low",
        "utilization": 58,
    },
]

VESSELS_DATA: List[Dict[str, Any]] = [
    {
        "id": "v-1",
        "name": "MV Eastern Star",
        "type": "Capesize",
        "dwt": "180,000",
        "route": "Port Hedland → Vizag",
        "cargo": "Iron Ore",
        "eta": "24 Sep 2026",
        "rate": "$22,400",
        "status": "En Route",
    },
    {
        "id": "v-2",
        "name": "MV Pacific Thunder",
        "type": "Panamax",
        "dwt": "75,000",
        "route": "Newcastle → Paradip",
        "cargo": "Thermal Coal",
        "eta": "27 Sep 2026",
        "rate": "$18,200",
        "status": "Loading",
    },
    {
        "id": "v-3",
        "name": "MV India Grit",
        "type": "Supramax",
        "dwt": "58,000",
        "route": "Richards Bay → Chennai",
        "cargo": "Steam Coal",
        "eta": "02 Oct 2026",
        "rate": "$15,600",
        "status": "At Port",
    },
    {
        "id": "v-4",
        "name": "MV Coastal Phoenix",
        "type": "Panamax",
        "dwt": "82,000",
        "route": "Tuticorin → Kolkata",
        "cargo": "Fertilizer",
        "eta": "05 Oct 2026",
        "rate": "$19,800",
        "status": "En Route",
    },
    {
        "id": "v-5",
        "name": "MV Bay Fortune",
        "type": "Handysize",
        "dwt": "38,000",
        "route": "Mundra → Krishnapatnam",
        "cargo": "Grain",
        "eta": "08 Oct 2026",
        "rate": "$12,400",
        "status": "Chartered",
    },
    {
        "id": "v-6",
        "name": "MV Iron Meridian",
        "type": "Capesize",
        "dwt": "205,000",
        "route": "Saldanha Bay → Vizag",
        "cargo": "Iron Ore",
        "eta": "12 Oct 2026",
        "rate": "$24,100",
        "status": "Negotiating",
    },
]

ALERTS_DATA: List[Dict[str, Any]] = [
    {
        "id": "alt-1",
        "type": "warning",
        "msg": "BDI up 3.2% — freight costs on Capesize routes may rise next week",
        "time": "14 min ago",
    },
    {
        "id": "alt-2",
        "type": "success",
        "msg": "MV Eastern Star cleared customs at Vizag anchorage — ETA confirmed",
        "time": "1 hr ago",
    },
    {
        "id": "alt-3",
        "type": "danger",
        "msg": "Cyclone alert in Bay of Bengal — Chennai port operations may be delayed 48h",
        "time": "2 hr ago",
    },
    {
        "id": "alt-4",
        "type": "info",
        "msg": "Q4 coal import demand forecast revised upward by 8% — consider early charter",
        "time": "4 hr ago",
    },
    {
        "id": "alt-5",
        "type": "warning",
        "msg": "Iron ore spot rate at Richards Bay spiked 5.6% — source alternate supplier",
        "time": "6 hr ago",
    },
]

ROUTES_DATA: List[Dict[str, Any]] = [
    {
        "from": "Port Hedland, AUS",
        "to": "Vizag",
        "cargo": "Iron Ore",
        "distance": "4,820 nm",
        "time": "18d",
        "vessels": 3,
    },
    {
        "from": "Newcastle, AUS",
        "to": "Paradip",
        "cargo": "Coal",
        "distance": "5,110 nm",
        "time": "20d",
        "vessels": 5,
    },
    {
        "from": "Richards Bay, SA",
        "to": "Chennai",
        "cargo": "Steam Coal",
        "distance": "3,840 nm",
        "time": "15d",
        "vessels": 4,
    },
    {
        "from": "Tuticorin, IN",
        "to": "Kolkata",
        "cargo": "Fertilizer",
        "distance": "1,620 nm",
        "time": "6d",
        "vessels": 2,
    },
]

RECOMMENDATIONS_DATA: List[Dict[str, Any]] = [
    {
        "id": "rec-1",
        "priority": "HIGH",
        "title": "Charter Capesize (180K DWT) immediately for Q4 Coal from Newcastle",
        "detail": "Freight rates forecast to rise 18% by Oct 15. Fixing today at $22,400/day vs projected $26,400/day saves approx. $2.1M over 30-day voyage.",
        "action": "Fix Charter",
        "color": "border-l-[#f59e0b] bg-[#f59e0b]/5",
    },
    {
        "id": "rec-2",
        "priority": "MEDIUM",
        "title": "Hedge 60% of Q4 iron ore volume via Time Charter",
        "detail": "Richards Bay spot FFA for Nov delivery at $21,800 — 4% below model forecast of $22,700. Execute partial hedge to reduce exposure.",
        "action": "Review FFA",
        "color": "border-l-[#06b6d4] bg-[#06b6d4]/5",
    },
    {
        "id": "rec-3",
        "priority": "LOW",
        "title": "Consolidate fertilizer parcels to Panamax at Paradip — Sep 30 laycan",
        "detail": "Two small Handysize lots can be consolidated to improve per-MT cost by 12%. Coordinate with supplier on loading timeline.",
        "action": "Schedule Call",
        "color": "border-l-[#8b5cf6] bg-[#8b5cf6]/5",
    },
]

COST_BREAKDOWN_DATA: List[Dict[str, Any]] = [
    {"label": "Ocean Freight (Time Charter)", "pct": 52, "value": "$19.9M", "color": "bg-[#f59e0b]"},
    {"label": "Bunker / Fuel Costs", "pct": 22, "value": "$8.4M", "color": "bg-[#06b6d4]"},
    {"label": "Port Dues & Pilotage", "pct": 11, "value": "$4.2M", "color": "bg-[#8b5cf6]"},
    {"label": "Insurance & Demurrage", "pct": 9, "value": "$3.4M", "color": "bg-[#10b981]"},
    {"label": "Agency & Misc Charges", "pct": 6, "value": "$2.3M", "color": "bg-[#475569]"},
]

MODEL_METRICS_DATA: List[Dict[str, Any]] = [
    {"label": "Model Accuracy (MAPE)", "value": "4.8%", "note": "Last 90 days backtest"},
    {"label": "BDI Signal", "value": "Bullish", "note": "Rising 3-wk streak"},
    {"label": "Bunker (VLSFO)", "value": "$642/MT", "note": "Singapore hub"},
    {"label": "Port Congestion Index", "value": "0.74", "note": "Vizag + Chennai avg"},
]
