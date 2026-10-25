import { useState, useEffect, useCallback } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import {
  API_BASE_URL,
  fetchKpiMetrics,
  fetchFreightRates,
  fetchCargoVolumes,
  fetchVessels,
  fetchAlerts,
  fetchLiveTick,
  addVessel as apiAddVessel,
  addAlert as apiAddAlert,
  predictRate as apiPredictRate,
  type KpiMetric,
  type FreightRatePoint,
  type CargoVolumePoint,
  type Vessel,
  type MaritimeAlert,
  type LiveMarketTick,
  type ForecastPredictionResponse,
} from "./api"

function getClientDateInfo() {
  const now = new Date()
  const day = now.getDate()
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const month = months[now.getMonth()]
  const year = now.getFullYear()
  const weekNum = Math.min(5, Math.ceil(day / 7))
  const weekStr = `W${weekNum} ${month}`
  const dateStr = `${month} ${day}, ${year}`
  return { dateStr, weekStr, fullStr: `${dateStr} (${weekStr})` }
}

// ─── Initial Fallback Data (Dynamic Date Tracking) ──────────────────────────

const defaultFreightRateData: FreightRatePoint[] = [
  { week: "W1 Aug", actual: 21500, forecast: 21000, bdi: 2150 },
  { week: "W2 Aug", actual: 22800, forecast: 22200, bdi: 2280 },
  { week: "W3 Aug", actual: 21200, forecast: 21800, bdi: 2120 },
  { week: "W4 Aug", actual: 23400, forecast: 23100, bdi: 2340 },
  { week: "W1 Sep", actual: 24100, forecast: 24500, bdi: 2410 },
  { week: "W2 Sep", actual: 23700, forecast: 24200, bdi: 2370 },
  { week: "W3 Sep", actual: 25100, forecast: 24900, bdi: 2510 },
  { week: "W4 Sep", actual: 25900, forecast: 25800, bdi: 2590 },
  { week: "W1 Oct", actual: 26800, forecast: 26500, bdi: 2680 },
  { week: "W2 Oct", actual: 27200, forecast: 27100, bdi: 2720 },
  { week: "W3 Oct", actual: 27600, forecast: 27500, bdi: 2760 },
  { week: "W4 Oct", actual: 28400, forecast: 28400, bdi: 2840 },
  { week: "W1 Nov", actual: null, forecast: 29200, bdi: null },
  { week: "W2 Nov", actual: null, forecast: 29800, bdi: null },
  { week: "W3 Nov", actual: null, forecast: 30500, bdi: null },
]

const defaultCargoVolumeData: CargoVolumePoint[] = [
  { month: "May", coal: 2.1, iron: 2.0, fertilizer: 0.8, grain: 1.1 },
  { month: "Jun", coal: 2.7, iron: 1.9, fertilizer: 1.0, grain: 0.7 },
  { month: "Jul", coal: 3.1, iron: 2.3, fertilizer: 0.9, grain: 1.3 },
  { month: "Aug", coal: 3.4, iron: 2.5, fertilizer: 1.1, grain: 1.4 },
  { month: "Sep", coal: 3.2, iron: 2.8, fertilizer: 1.3, grain: 1.2 },
  { month: "Oct", coal: 3.6, iron: 3.1, fertilizer: 1.4, grain: 1.5 },
]

const vesselUtilizationData = [
  { name: "Capesize", utilized: 84, idle: 16 },
  { name: "Panamax", utilized: 88, idle: 12 },
  { name: "Supramax", utilized: 93, idle: 7 },
  { name: "Handysize", utilized: 89, idle: 11 },
]

const portActivityData = [
  { port: "Vizag", inbound: 26, outbound: 20, waiting: 7 },
  { port: "Paradip", inbound: 21, outbound: 14, waiting: 5 },
  { port: "Chennai", inbound: 33, outbound: 29, waiting: 9 },
  { port: "Kolkata", inbound: 16, outbound: 12, waiting: 4 },
  { port: "Krishnapatnam", inbound: 22, outbound: 18, waiting: 6 },
]

const defaultVessels: Vessel[] = [
  {
    name: "MV Eastern Star",
    type: "Capesize",
    dwt: "180,000",
    route: "Port Hedland → Vizag",
    cargo: "Iron Ore",
    eta: "22 Oct 2026",
    rate: "$27,600",
    status: "En Route",
  },
  {
    name: "MV Pacific Thunder",
    type: "Panamax",
    dwt: "75,000",
    route: "Newcastle → Paradip",
    cargo: "Thermal Coal",
    eta: "25 Oct 2026",
    rate: "$19,800",
    status: "Loading",
  },
  {
    name: "MV India Grit",
    type: "Supramax",
    dwt: "58,000",
    route: "Richards Bay → Chennai",
    cargo: "Steam Coal",
    eta: "29 Oct 2026",
    rate: "$16,900",
    status: "At Port",
  },
  {
    name: "MV Coastal Phoenix",
    type: "Panamax",
    dwt: "82,000",
    route: "Tuticorin → Kolkata",
    cargo: "Fertilizer",
    eta: "02 Nov 2026",
    rate: "$20,400",
    status: "En Route",
  },
  {
    name: "MV Bay Fortune",
    type: "Handysize",
    dwt: "38,000",
    route: "Mundra → Krishnapatnam",
    cargo: "Grain",
    eta: "06 Nov 2026",
    rate: "$13,800",
    status: "Chartered",
  },
  {
    name: "MV Iron Meridian",
    type: "Capesize",
    dwt: "205,000",
    route: "Saldanha Bay → Vizag",
    cargo: "Iron Ore",
    eta: "12 Nov 2026",
    rate: "$28,500",
    status: "Negotiating",
  },
]

const defaultAlerts: MaritimeAlert[] = [
  {
    type: "warning",
    msg: "W4 Oct BDI hits 2,760 (+4.8% WoW) — Capesize freight rates surging into Q4 peak",
    time: "Just now",
  },
  {
    type: "success",
    msg: "MV Eastern Star confirmed on-schedule arrival at Vizag anchorage — ETA 22 Oct",
    time: "20 min ago",
  },
  {
    type: "danger",
    msg: "Post-monsoon wave surge off Bay of Bengal — Chennai & Paradip port turnaround extended 24h",
    time: "1 hr ago",
  },
  {
    type: "info",
    msg: "Q4 coal import target revised upward to 5.2 MT — early chartering recommended before Nov rate hike",
    time: "2 hr ago",
  },
  {
    type: "warning",
    msg: "Iron ore spot rate at Port Hedland rose 4.2% — consider locking 30-day index-linked forward",
    time: "4 hr ago",
  },
]

const initialClientDate = getClientDateInfo()

const defaultKpis: KpiMetric[] = [
  { label: "Avg Freight Rate", value: "$28,400", sub: `USD/day · Capesize (${initialClientDate.weekStr})`, change: "4.8% WoW", changeUp: true },
  { label: "Baltic Dry Index", value: "2,840", sub: `${initialClientDate.dateStr} · Global Benchmark`, change: "3.6% WoW", changeUp: true },
  { label: "Active Charters", value: "15", sub: "vessels under contract", change: "3 New this week", changeUp: true },
  { label: "Cargo Volume", value: "9.6 MT", sub: `${initialClientDate.dateStr.slice(0, 3)} 2026 forecast`, change: "1.2% vs Sep", changeUp: true },
]

const routes = [
  {
    from: "Port Hedland, AUS",
    to: "Vizag",
    cargo: "Iron Ore",
    distance: "4,820 nm",
    time: "18d",
    vessels: 4,
  },
  {
    from: "Newcastle, AUS",
    to: "Paradip",
    cargo: "Coal",
    distance: "5,110 nm",
    time: "20d",
    vessels: 6,
  },
  {
    from: "Richards Bay, SA",
    to: "Chennai",
    cargo: "Steam Coal",
    distance: "3,840 nm",
    time: "15d",
    vessels: 4,
  },
  {
    from: "Tuticorin, IN",
    to: "Kolkata",
    cargo: "Fertilizer",
    distance: "1,620 nm",
    time: "6d",
    vessels: 3,
  },
]

type NavTab = "overview" | "forecast" | "vessels" | "ports" | "procurement"

const statusColors: Record<string, string> = {
  "En Route": "text-[#06b6d4] bg-[#06b6d4]/10 border-[#06b6d4]/30",
  Loading: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30",
  "At Port": "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30",
  Chartered: "text-[#8b5cf6] bg-[#8b5cf6]/10 border-[#8b5cf6]/30",
  Negotiating: "text-[#64748b] bg-[#64748b]/10 border-[#64748b]/30",
}

const alertColors: Record<string, { bar: string; icon: string; text: string }> = {
  warning: { bar: "bg-[#f59e0b]", icon: "⚠", text: "text-[#fbbf24]" },
  success: { bar: "bg-[#10b981]", icon: "✓", text: "text-[#34d399]" },
  danger: { bar: "bg-[#ef4444]", icon: "✕", text: "text-[#f87171]" },
  info: { bar: "bg-[#06b6d4]", icon: "i", text: "text-[#22d3ee]" },
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  change,
  changeUp,
  updatedAt,
}: KpiMetric) {
  return (
    <div className="freight-card glass glass-kpi rounded-xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] tracking-widest text-[#64748b] uppercase">
          {label}
        </p>
        {updatedAt && (
          <span className="font-mono text-[9px] text-[#06b6d4]/70">
            {updatedAt}
          </span>
        )}
      </div>
      <p className="font-['Outfit'] text-3xl font-bold text-[#e2e8f0] leading-none mb-1">
        {value}
      </p>
      <p className="text-xs text-[#64748b] mb-3">{sub}</p>
      <span
        className={`font-mono text-xs font-semibold ${
          changeUp ? "text-[#10b981]" : "text-[#ef4444]"
        }`}
      >
        {changeUp ? "▲" : "▼"} {change}
      </span>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg p-3 shadow-xl font-mono text-xs">
      <p className="text-[#64748b] mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="leading-5">
          {p.name}:{" "}
          <span className="font-semibold">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function OverviewTab({
  kpis,
  rates,
  volumes,
  alerts,
  liveTick,
  onAddQuickAlert,
}: {
  kpis: KpiMetric[]
  rates: FreightRatePoint[]
  volumes: CargoVolumePoint[]
  alerts: MaritimeAlert[]
  liveTick: LiveMarketTick | null
  onAddQuickAlert: () => void
}) {
  const currentWeekLabel = liveTick?.current_week || getClientDateInfo().weekStr
  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* Live Market Ticker Strip */}
      {liveTick && (
        <div className="glass rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 border border-[#06b6d4]/20 bg-[#06b6d4]/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span className="font-mono text-xs font-semibold text-[#10b981]">
              LIVE TICK ({liveTick.current_week || currentWeekLabel})
            </span>
            <span className="font-mono text-xs text-[#94a3b8]">
              {liveTick.server_time}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
            <div>
              <span className="text-[#64748b]">BDI: </span>
              <span className="text-[#f59e0b] font-bold">{liveTick.bdi}</span>
            </div>
            <div>
              <span className="text-[#64748b]">Capesize Spot: </span>
              <span className="text-[#06b6d4] font-bold">
                ${liveTick.capesize_rate.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#64748b]">Panamax: </span>
              <span className="text-[#cbd5e1] font-bold">
                ${liveTick.panamax_rate.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#64748b]">Trend: </span>
              <span
                className={`font-bold ${
                  liveTick.trend === "BULLISH"
                    ? "text-[#10b981]"
                    : "text-[#ef4444]"
                }`}
              >
                {liveTick.trend} ({liveTick.change_pct}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Freight Rate Forecast Chart */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0]">
              Freight Rate Forecast
            </h3>
            <p className="text-xs text-[#64748b] font-mono mt-0.5">
              Capesize · USD/day · Aug–Nov 2026 (Current: {currentWeekLabel})
            </p>
          </div>
          <div className="flex gap-4 text-[10px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#f59e0b] inline-block rounded" />
              Actuals
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#06b6d4] inline-block rounded border-dashed" />
              Forecast
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={rates} margin={{ left: -10, right: 10 }}>
            <defs>
              <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
            />
            <YAxis
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Real-time Indicator: Current Date */}
            <ReferenceLine
              x={currentWeekLabel}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              label={{
                value: `Today (${currentWeekLabel})`,
                fill: "#06b6d4",
                fontSize: 11,
                position: "top",
              }}
            />
            <Area
              type="monotone"
              dataKey="actual"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#gActual)"
              name="Actual Rate"
              dot={{ fill: "#f59e0b", r: 2 }}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fill="url(#gForecast)"
              strokeDasharray="5 3"
              name="Forecast"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cargo Volume */}
        <div className="glass rounded-xl p-5">
          <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0] mb-0.5">
            Cargo Demand by Type
          </h3>
          <p className="text-xs text-[#64748b] font-mono mb-4">
            Million MT · East Coast India ports (May–Oct 2026)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumes} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{
                  fill: "#64748b",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                }}
              />
              <YAxis
                tick={{
                  fill: "#64748b",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                }}
                tickFormatter={(v) => `${v}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="coal"
                name="Coal"
                fill="#f59e0b"
                radius={[2, 2, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="iron"
                name="Iron Ore"
                fill="#06b6d4"
                radius={[0, 0, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="fertilizer"
                name="Fertilizer"
                fill="#8b5cf6"
                stackId="a"
              />
              <Bar
                dataKey="grain"
                name="Grain"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live Alerts */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0]">
              Live Maritime Alerts
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onAddQuickAlert}
                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded font-mono text-[10px] text-[#06b6d4] transition-all"
                title="Post simulated live alert to backend"
              >
                + Broadcast Alert
              </button>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#10b981]">
                <span className="live-dot w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />{" "}
                LIVE FEED
              </span>
            </div>
          </div>
          <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
            {alerts.map((a, i) => {
              const c = alertColors[a.type] || alertColors.info
              return (
                <div key={i} className="flex gap-3 items-start p-2 rounded bg-white/[0.02]">
                  <div
                    className={`w-1 self-stretch rounded-full flex-shrink-0 ${c.bar}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#cbd5e1] leading-5">{a.msg}</p>
                    <p className="font-mono text-[10px] text-[#475569] mt-0.5">
                      {a.time}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ForecastTab({
  rates,
  liveTick,
}: {
  rates: FreightRatePoint[]
  liveTick: LiveMarketTick | null
}) {
  const currentWeek = liveTick?.current_week || getClientDateInfo().weekStr
  const [horizon, setHorizon] = useState<"4w" | "8w" | "12w">("8w")
  const [predictVessel, setPredictVessel] = useState("Capesize")
  const [predictRoute, setPredictRoute] = useState("Port Hedland → Vizag")
  const [predictFuel, setPredictFuel] = useState(642)
  const [predictResult, setPredictResult] = useState<ForecastPredictionResponse | null>(null)
  const [predictLoading, setPredictLoading] = useState(false)

  // Align horizon windows relative to W3 Oct:
  // 4w: W1 Oct -> W3 Nov (recent context + short forecast)
  // 8w: W1 Sep -> W3 Nov (medium horizon)
  // 12w: Full Aug -> Nov timeline
  const sliced =
    horizon === "4w"
      ? rates.slice(8)
      : horizon === "8w"
        ? rates.slice(4)
        : rates

  const handleRunPredictor = async () => {
    setPredictLoading(true)
    try {
      const res = await apiPredictRate({
        vessel_type: predictVessel,
        route: predictRoute,
        cargo: "Iron Ore / Bulk",
        bunker_fuel_price_usd: Number(predictFuel),
        season_factor: 1.08,
      })
      setPredictResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setPredictLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-['Outfit'] font-semibold text-lg text-[#e2e8f0]">
              Rate Forecast Model (Oct–Nov 2026 Horizon)
            </h3>
            <p className="text-xs text-[#64748b] font-mono mt-0.5">
              LSTM + XGBoost ensemble · Real-time forecast extending forward from Today ({currentWeek} 2026)
            </p>
          </div>
          <div className="flex gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {(["4w", "8w", "12w"] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-4 py-1.5 rounded-md font-mono text-xs transition-all ${
                  horizon === h
                    ? "bg-[#f59e0b] text-[#0f1829] font-bold"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sliced} margin={{ left: -5, right: 15 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="week"
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
            />
            <YAxis
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                color: "#64748b",
              }}
            />
            <ReferenceLine
              x={currentWeek}
              stroke="#06b6d4"
              strokeDasharray="4 4"
              label={{
                value: `Today (${currentWeek})`,
                fill: "#06b6d4",
                fontSize: 11,
                position: "top",
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#f59e0b"
              strokeWidth={2.5}
              name="Actual Rate"
              dot={{ fill: "#f59e0b", r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="6 3"
              name="ML Forecast"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Real-time Model Inputs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Model Accuracy (MAPE)",
            value: "4.8%",
            note: "Last 90 days backtest",
          },
          {
            label: "Live BDI Benchmark",
            value: liveTick ? `${liveTick.bdi}` : "2,760",
            note: liveTick ? `Trend: ${liveTick.trend} (${currentWeek})` : "Surging 4-wk streak",
          },
          {
            label: "Bunker (VLSFO)",
            value: liveTick ? `$${liveTick.bunker_vlsfo}/MT` : "$642/MT",
            note: "Singapore hub index",
          },
          {
            label: "Port Congestion Index",
            value: liveTick ? `${liveTick.port_congestion_index}` : "0.74",
            note: "Vizag + Chennai avg",
          },
        ].map(({ label, value, note }) => (
          <div
            key={label}
            className="freight-card glass glass-kpi rounded-xl p-4"
          >
            <p className="font-mono text-[10px] text-[#64748b] tracking-widest uppercase mb-2">
              {label}
            </p>
            <p className="font-['Outfit'] text-2xl font-bold text-[#e2e8f0]">
              {value}
            </p>
            <p className="text-[11px] text-[#475569] mt-1">{note}</p>
          </div>
        ))}
      </div>

      {/* Interactive AI Rate Simulator */}
      <div className="glass rounded-xl p-5 border border-[#06b6d4]/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0]">
              Interactive Rate Predictor (FastAPI ML Endpoint)
            </h3>
            <p className="text-xs text-[#64748b] font-mono mt-0.5">
              Simulate Q4 forward rates by adjusting route and bunker parameters
            </p>
          </div>
          <span className="font-mono text-[10px] text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/30 px-2 py-1 rounded">
            POST /api/forecast/predict
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block font-mono text-[10px] text-[#64748b] mb-1">
              Vessel Type
            </label>
            <select
              value={predictVessel}
              onChange={(e) => setPredictVessel(e.target.value)}
              className="w-full bg-[#0d1627] border border-white/10 rounded-lg p-2.5 text-xs text-[#e2e8f0] font-mono focus:outline-none focus:border-[#06b6d4]"
            >
              <option value="Capesize">Capesize (180,000 DWT)</option>
              <option value="Panamax">Panamax (75,000 DWT)</option>
              <option value="Supramax">Supramax (58,000 DWT)</option>
              <option value="Handysize">Handysize (38,000 DWT)</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] text-[#64748b] mb-1">
              Route Corridor
            </label>
            <select
              value={predictRoute}
              onChange={(e) => setPredictRoute(e.target.value)}
              className="w-full bg-[#0d1627] border border-white/10 rounded-lg p-2.5 text-xs text-[#e2e8f0] font-mono focus:outline-none focus:border-[#06b6d4]"
            >
              <option value="Port Hedland → Vizag">Port Hedland → Vizag</option>
              <option value="Newcastle → Paradip">Newcastle → Paradip</option>
              <option value="Richards Bay → Chennai">Richards Bay → Chennai</option>
              <option value="Tuticorin → Kolkata">Tuticorin → Kolkata</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] text-[#64748b] mb-1">
              Bunker Fuel Price ($/MT): {predictFuel}
            </label>
            <input
              type="range"
              min="500"
              max="800"
              value={predictFuel}
              onChange={(e) => setPredictFuel(Number(e.target.value))}
              className="w-full accent-[#06b6d4] mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRunPredictor}
            disabled={predictLoading}
            className="px-5 py-2.5 bg-[#06b6d4] hover:bg-[#06b6d4]/80 text-[#0f1829] font-mono text-xs font-bold rounded-lg transition-all"
          >
            {predictLoading ? "Querying AI Model..." : "⚡ Calculate Live Forecast"}
          </button>
        </div>

        {predictResult && (
          <div className="mt-4 p-4 rounded-lg bg-[#06b6d4]/10 border border-[#06b6d4]/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="font-mono text-[10px] text-[#64748b] uppercase">Predicted Rate</p>
              <p className="font-['Outfit'] text-2xl font-bold text-[#f59e0b]">
                ${predictResult.predicted_daily_rate.toLocaleString()} / day
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#64748b] uppercase">90% Confidence Interval</p>
              <p className="font-mono text-xs text-[#cbd5e1] mt-1">
                ${predictResult.confidence_interval.p10.toLocaleString()} – ${predictResult.confidence_interval.p90.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] text-[#64748b] uppercase">AI Action</p>
              <p className="text-xs text-[#10b981] mt-1">{predictResult.recommendation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Routes Comparison */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0] mb-4">
          Active Import Routes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e3050]">
                {[
                  "Origin",
                  "Destination",
                  "Cargo",
                  "Distance",
                  "Transit",
                  "Active Vessels",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left font-mono text-[10px] text-[#475569] tracking-widest uppercase py-2 pr-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routes.map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-[#162035] hover:bg-[#162035]/50 transition-colors"
                >
                  <td className="py-3 pr-4 text-[#e2e8f0] text-xs font-medium">
                    {r.from}
                  </td>
                  <td className="py-3 pr-4 text-[#06b6d4] text-xs font-medium">
                    {r.to}
                  </td>
                  <td className="py-3 pr-4 text-[#94a3b8] text-xs">
                    {r.cargo}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-[#94a3b8]">
                    {r.distance}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-[#94a3b8]">
                    {r.time}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 rounded">
                      {r.vessels} vessels
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function VesselsTab({
  vessels,
  onAddVessel,
}: {
  vessels: Vessel[]
  onAddVessel: (v: Vessel) => void
}) {
  const [filter, setFilter] = useState("All")
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState("Capesize")
  const [formDwt, setFormDwt] = useState("180,000")
  const [formRoute, setFormRoute] = useState("Port Hedland → Vizag")
  const [formCargo, setFormCargo] = useState("Iron Ore")
  const [formRate, setFormRate] = useState("$27,500")

  const types = ["All", "Capesize", "Panamax", "Supramax", "Handysize"]
  const filtered =
    filter === "All" ? vessels : vessels.filter((v) => v.type === filter)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    onAddVessel({
      name: formName,
      type: formType,
      dwt: formDwt,
      route: formRoute,
      cargo: formCargo,
      eta: "28 Oct 2026",
      rate: formRate,
      status: "En Route",
    })
    setShowModal(false)
    setFormName("")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div>
          <h3 className="font-['Outfit'] font-semibold text-lg text-[#e2e8f0]">
            Vessel Charter Schedule
          </h3>
          <p className="text-xs text-[#64748b] font-mono mt-0.5">
            {filtered.length} chartered vessels active ({vessels.length} total in fleet) · ETAs updated for late Oct / Nov 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-[#0f1829] font-mono text-xs font-bold rounded-lg transition-all"
          >
            + Register Vessel
          </button>
          <div className="flex gap-1 bg-white/5 backdrop-blur-sm rounded-lg p-1 border border-white/10">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded font-mono text-xs transition-all ${
                  filter === t
                    ? "bg-[#06b6d4] text-[#0f1829] font-bold"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for adding vessel */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="glass rounded-xl p-6 w-full max-w-md border border-white/20">
            <h4 className="font-['Outfit'] text-lg font-bold text-[#e2e8f0] mb-4">
              Register Vessel to Fleet (FastAPI API)
            </h4>
            <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[#94a3b8] block mb-1">Vessel Name</label>
                <input
                  required
                  placeholder="e.g. MV Bengal Carrier"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#0d1627] border border-white/10 rounded p-2 text-[#e2e8f0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#94a3b8] block mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-[#0d1627] border border-white/10 rounded p-2 text-[#e2e8f0]"
                  >
                    <option value="Capesize">Capesize</option>
                    <option value="Panamax">Panamax</option>
                    <option value="Supramax">Supramax</option>
                    <option value="Handysize">Handysize</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#94a3b8] block mb-1">DWT</label>
                  <input
                    value={formDwt}
                    onChange={(e) => setFormDwt(e.target.value)}
                    className="w-full bg-[#0d1627] border border-white/10 rounded p-2 text-[#e2e8f0]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#94a3b8] block mb-1">Route</label>
                <input
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  className="w-full bg-[#0d1627] border border-white/10 rounded p-2 text-[#e2e8f0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#94a3b8] block mb-1">Cargo</label>
                  <input
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    className="w-full bg-[#0d1627] border border-white/10 rounded p-2 text-[#e2e8f0]"
                  />
                </div>
                <div>
                  <label className="text-[#94a3b8] block mb-1">Rate</label>
                  <input
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    className="w-full bg-[#0d1627] border border-white/10 rounded p-2 text-[#e2e8f0]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-white/5 text-[#94a3b8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#f59e0b] text-[#0f1829] font-bold"
                >
                  Save Vessel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vessels table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1e3050] bg-white/[0.02]">
                {[
                  "Vessel",
                  "Type / DWT",
                  "Route",
                  "Cargo",
                  "ETA",
                  "Day Rate",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 font-mono text-[10px] text-[#475569] tracking-widest uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr
                  key={i}
                  className="border-b border-[#162035] hover:bg-[#162035]/60 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <p className="text-[#e2e8f0] text-sm font-medium">
                      {v.name}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-[#94a3b8] text-xs">{v.type}</p>
                    <p className="font-mono text-[10px] text-[#475569]">
                      {v.dwt} DWT
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-xs text-[#94a3b8]">{v.route}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#94a3b8]">
                    {v.cargo}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#cbd5e1]">
                    {v.eta}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#f59e0b] font-semibold">
                    {v.rate}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-1 rounded border ${statusColors[v.status] || statusColors["En Route"]}`}
                    >
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vessel utilization */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0] mb-4">
          Fleet Utilization by Vessel Type
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={vesselUtilizationData}
            layout="vertical"
            margin={{ left: 10, right: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
                fontFamily: "JetBrains Mono",
              }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="utilized"
              name="Utilized"
              fill="#06b6d4"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="idle"
              name="Idle"
              fill="#1e3050"
              stackId="a"
              radius={[2, 2, 2, 2]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function PortsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            name: "Visakhapatnam (Vizag)",
            code: "INVTZ",
            state: "Andhra Pradesh",
            cap: "90 MT/yr",
            draft: "17.5 m",
            congestion: "Medium",
            utilization: 74,
          },
          {
            name: "Paradip Port",
            code: "INPAQ",
            state: "Odisha",
            cap: "110 MT/yr",
            draft: "16.0 m",
            congestion: "Low",
            utilization: 61,
          },
          {
            name: "Chennai Port",
            code: "INMAA",
            state: "Tamil Nadu",
            cap: "78 MT/yr",
            draft: "14.5 m",
            congestion: "High",
            utilization: 89,
          },
          {
            name: "Kolkata / Haldia",
            code: "INCCU",
            state: "West Bengal",
            cap: "45 MT/yr",
            draft: "8.5 m",
            congestion: "Low",
            utilization: 52,
          },
          {
            name: "Krishnapatnam Port",
            code: "INKRI",
            state: "Andhra Pradesh",
            cap: "60 MT/yr",
            draft: "17.0 m",
            congestion: "Medium",
            utilization: 68,
          },
          {
            name: "Kamarajar Port",
            code: "INENS",
            state: "Tamil Nadu",
            cap: "35 MT/yr",
            draft: "15.5 m",
            congestion: "Low",
            utilization: 58,
          },
        ].map((p) => {
          const cColor =
            p.congestion === "High"
              ? "text-[#ef4444]"
              : p.congestion === "Medium"
                ? "text-[#f59e0b]"
                : "text-[#10b981]"
          const barColor =
            p.congestion === "High"
              ? "bg-[#ef4444]"
              : p.congestion === "Medium"
                ? "bg-[#f59e0b]"
                : "bg-[#10b981]"
          return (
            <div
              key={p.code}
              className="freight-card glass glass-kpi rounded-xl p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-['Outfit'] font-semibold text-[#e2e8f0] leading-5">
                    {p.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#475569] mt-0.5">
                    {p.code} · {p.state}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[10px] text-[#475569]">Capacity</p>
                  <p className="font-mono text-xs text-[#94a3b8]">{p.cap}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#475569]">Max Draft</p>
                  <p className="font-mono text-xs text-[#94a3b8]">{p.draft}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#475569]">Utilization</span>
                <span className="font-mono text-xs text-[#94a3b8]">
                  {p.utilization}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                <div
                  className={`h-1.5 rounded-full ${barColor}`}
                  style={{ width: `${p.utilization}%` }}
                />
              </div>
              <span className={`font-mono text-[10px] font-semibold ${cColor}`}>
                ● {p.congestion} Congestion
              </span>
            </div>
          )
        })}
      </div>

      {/* Port throughput chart */}
      <div className="glass rounded-xl p-5">
        <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0] mb-4">
          Vessel Traffic by Port · Oct 2026
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={portActivityData} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="port"
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
            />
            <YAxis
              tick={{
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "JetBrains Mono",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                color: "#64748b",
              }}
            />
            <Bar
              dataKey="inbound"
              name="Inbound"
              fill="#06b6d4"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="outbound"
              name="Outbound"
              fill="#8b5cf6"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="waiting"
              name="Waiting"
              fill="#f59e0b"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ProcurementTab() {
  const dateInfo = getClientDateInfo()
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Optimal Charter Window"
          value="Oct 20–28"
          sub="Save est. $2.6M vs Nov spot"
          change="9.2% vs next month"
          changeUp={false}
        />
        <KpiCard
          label="Q4 Coal Requirement"
          value="5.2 MT"
          sub="4 Capesize + 3 Panamax"
          change="8.5% vs Q3 plan"
          changeUp={true}
        />
        <KpiCard
          label="Supplier Risk Score"
          value="2.1 / 5"
          sub="Richards Bay, AUS"
          change="0.2 pts MoM"
          changeUp={false}
        />
        <KpiCard
          label="Estimated Freight Cost"
          value="$41.5M"
          sub="Q4 2026 total"
          change="$1.6M under cap"
          changeUp={true}
        />
      </div>

      <div className="glass rounded-xl p-5">
        <h3 className="font-['Outfit'] font-semibold text-[#e2e8f0] mb-1">
          AI Procurement Recommendations
        </h3>
        <p className="text-xs text-[#64748b] font-mono mb-5">
          Model confidence threshold: 82% · Real-time recommendation ({dateInfo.fullStr})
        </p>
        <div className="space-y-3">
          {[
            {
              priority: "HIGH",
              title:
                "Charter Capesize (180K DWT) immediately for Q4 Coal from Newcastle",
              detail:
                `Freight rates forecast to surge past $30,000/day by mid-November. Fixing today (${dateInfo.weekStr}) at $28,400/day vs projected $30,500/day saves approx. $2.6M over 30-day voyage.`,
              action: "Fix Charter",
              color: "border-l-[#f59e0b] bg-[#f59e0b]/5",
            },
            {
              priority: "MEDIUM",
              title: "Hedge 60% of Q4 iron ore volume via Time Charter",
              detail:
                "Richards Bay spot FFA for Nov delivery at $28,100 — 4% below model forecast of $29,200. Execute partial hedge to reduce forward exposure.",
              action: "Review FFA",
              color: "border-l-[#06b6d4] bg-[#06b6d4]/5",
            },
            {
              priority: "LOW",
              title:
                "Consolidate fertilizer parcels to Panamax at Paradip — Oct 28 laycan",
              detail:
                "Two small Handysize lots can be consolidated to improve per-MT cost by 12%. Coordinate with supplier on loading timeline.",
              action: "Schedule Call",
              color: "border-l-[#8b5cf6] bg-[#8b5cf6]/5",
            },
          ].map((r, i) => (
            <div
              key={i}
              className={`border-l-4 ${r.color} rounded-r-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`font-mono text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border
                    ${
                      r.priority === "HIGH"
                        ? "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10"
                        : "text-[#06b6d4] border-[#06b6d4]/30 bg-[#06b6d4]/10"
                    }`}
                  >
                    {r.priority}
                  </span>
                </div>
                <p className="font-['Outfit'] font-semibold text-[#e2e8f0] text-sm mb-1">
                  {r.title}
                </p>
                <p className="text-xs text-[#64748b] leading-5">{r.detail}</p>
              </div>
              <button className="flex-shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-[#94a3b8] hover:text-[#e2e8f0] rounded font-mono text-xs transition-all backdrop-blur-sm">
                {r.action} →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<NavTab>("overview")
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [liveStreaming, setLiveStreaming] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<string>("Connecting...")
  const [dateInfo, setDateInfo] = useState(getClientDateInfo())

  useEffect(() => {
    const timer = setInterval(() => {
      setDateInfo(getClientDateInfo())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Data states
  const [kpiData, setKpiData] = useState<KpiMetric[]>(defaultKpis)
  const [ratesData, setRatesData] = useState<FreightRatePoint[]>(defaultFreightRateData)
  const [cargoData, setCargoData] = useState<CargoVolumePoint[]>(defaultCargoVolumeData)
  const [vesselsData, setVesselsData] = useState<Vessel[]>(defaultVessels)
  const [alertsData, setAlertsData] = useState<MaritimeAlert[]>(defaultAlerts)
  const [liveTick, setLiveTick] = useState<LiveMarketTick | null>(null)

  const tabs: { id: NavTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "forecast", label: "Rate Forecast" },
    { id: "vessels", label: "Vessels" },
    { id: "ports", label: "Ports" },
    { id: "procurement", label: "Procurement" },
  ]

  // Fetch full data snapshot
  const loadFullSnapshot = useCallback(async () => {
    try {
      const [kpis, rates, volumes, vessels, alerts, tick] = await Promise.all([
        fetchKpiMetrics(),
        fetchFreightRates(),
        fetchCargoVolumes(),
        fetchVessels(),
        fetchAlerts(),
        fetchLiveTick(),
      ])
      setKpiData(kpis)
      setRatesData(rates)
      setCargoData(volumes)
      setVesselsData(vessels)
      setAlertsData(alerts)
      setLiveTick(tick)
      setBackendConnected(true)
      setLastSyncTime(tick.server_time || new Date().toLocaleTimeString())
    } catch (err) {
      console.warn("Backend not available, using offline preview data", err)
      setBackendConnected(false)
      setLastSyncTime("Offline (Cached)")
    }
  }, [])

  // Live polling for real-time market ticks & KPIs
  const pollLiveTick = useCallback(async () => {
    try {
      const [tick, kpis, alerts] = await Promise.all([
        fetchLiveTick(),
        fetchKpiMetrics(),
        fetchAlerts(),
      ])
      setLiveTick(tick)
      setKpiData(kpis)
      setAlertsData(alerts)
      setBackendConnected(true)
      setLastSyncTime(tick.server_time)
    } catch {
      // Don't flip status immediately on single dropped tick, but track state
    }
  }, [])

  useEffect(() => {
    loadFullSnapshot()
  }, [loadFullSnapshot])

  useEffect(() => {
    if (!liveStreaming) return
    const interval = setInterval(() => {
      pollLiveTick()
    }, 4000)
    return () => clearInterval(interval)
  }, [liveStreaming, pollLiveTick])

  const handleAddVessel = async (v: Vessel) => {
    try {
      const created = await apiAddVessel(v)
      setVesselsData((prev) => [created, ...prev])
      pollLiveTick()
    } catch {
      setVesselsData((prev) => [v, ...prev])
    }
  }

  const handleAddQuickAlert = async () => {
    const alertTypes: ("warning" | "info" | "success" | "danger")[] = [
      "warning",
      "info",
      "success",
    ]
    const sampleMsgs = [
      `${dateInfo.weekStr} surge: East Coast Capesize spot fixtures hitting $28,400/day`,
      "Visakhapatnam port berthing priority granted to MV Eastern Star — ETA confirmed 22 Oct",
      "Singapore Bunker VLSFO holding at $642/MT — optimal forward bunkering window open",
    ]
    const randomMsg = sampleMsgs[Math.floor(Math.random() * sampleMsgs.length)]
    const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    try {
      const newAlert = await apiAddAlert({
        type: randomType,
        msg: randomMsg,
        time: "Just now",
      })
      setAlertsData((prev) => [newAlert, ...prev])
    } catch {
      setAlertsData((prev) => [
        { type: randomType, msg: randomMsg, time: "Just now" },
        ...prev,
      ])
    }
  }

  return (
    <div
      className="min-h-screen text-[#e2e8f0] relative overflow-x-hidden"
      style={{
        background: [
          "radial-gradient(ellipse 70% 50% at 10% 5%,  rgba(245,158,11,0.18) 0%, transparent 55%)",
          "radial-gradient(ellipse 55% 45% at 90% 15%, rgba(6,182,212,0.16) 0%, transparent 50%)",
          "radial-gradient(ellipse 60% 60% at 80% 85%, rgba(139,92,246,0.12) 0%, transparent 55%)",
          "radial-gradient(ellipse 50% 40% at 20% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)",
          "radial-gradient(ellipse 40% 30% at 50% 45%, rgba(6,182,212,0.05) 0%, transparent 60%)",
          "#060c18",
        ].join(", "),
      }}
    >
      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 bg-[#f59e0b] rounded-sm flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#f59e0b]/20">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M2 13L5 7L8 10L11 5L16 13"
                  stroke="#0f1829"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="16" cy="13" r="1.5" fill="#0f1829" />
              </svg>
            </div>
            <div>
              <p className="font-['Outfit'] font-bold text-[#e2e8f0] leading-none tracking-tight">
                FreightIQ
              </p>
              <p className="font-mono text-[9px] text-[#475569] tracking-widest">
                EAST COAST INDIA · BULK CARGO
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-2 rounded font-mono text-xs tracking-wide transition-all ${
                  tab === t.id
                    ? "text-[#f59e0b] bg-[#f59e0b]/10"
                    : "text-[#64748b] hover:text-[#94a3b8]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Real-time dynamic date badge */}
            <div className="font-mono text-[10px] text-[#cbd5e1] hidden lg:block bg-white/5 border border-white/10 px-2.5 py-1 rounded">
              {dateInfo.dateStr} · <span className="text-[#f59e0b] font-semibold">{liveTick?.current_week || dateInfo.weekStr}</span>
            </div>

            {/* Live Data Connection Indicator */}
            {backendConnected ? (
              <div className="flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/30 px-3 py-1.5 rounded-full font-mono text-[11px] text-[#10b981]">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping inline-block" />
                <span className="font-bold">LIVE API</span>
                <span className="text-[#64748b] hidden sm:inline">|</span>
                <span className="text-[#cbd5e1] hidden sm:inline">{lastSyncTime}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/30 px-3 py-1.5 rounded-full font-mono text-[11px] text-[#ef4444]">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" />
                <span>OFFLINE PREVIEW</span>
                <button
                  onClick={loadFullSnapshot}
                  className="underline hover:text-white text-[10px]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Live Polling Toggle */}
            <button
              onClick={() => setLiveStreaming(!liveStreaming)}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded font-mono text-[10px] border transition-all ${
                liveStreaming
                  ? "border-[#06b6d4]/40 text-[#06b6d4] bg-[#06b6d4]/10"
                  : "border-white/10 text-[#64748b] bg-white/5"
              }`}
              title="Toggle automatic background sync"
            >
              {liveStreaming ? "● STREAM ON" : "○ PAUSED"}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 px-4 pb-3 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded font-mono text-[10px] tracking-wide transition-all ${
                tab === t.id
                  ? "text-[#f59e0b] bg-[#f59e0b]/10"
                  : "text-[#64748b]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Page */}
      <main className="max-w-screen-xl mx-auto px-5 py-6">
        {/* Offline notification banner if backend is not detected */}
        {backendConnected === false && (
          <div className="mb-5 p-3.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl flex items-center justify-between gap-3 text-xs text-[#fbbf24]">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <span>
                <strong>Backend not connected ({API_BASE_URL || window.location.origin}):</strong> Start or verify your FastAPI backend service to see live market data updates.
              </span>
            </div>
            <button
              onClick={loadFullSnapshot}
              className="px-3 py-1 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 rounded font-mono text-[11px] font-bold text-[#fbbf24]"
            >
              Connect Now
            </button>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#475569] tracking-widest uppercase">
              FreightIQ
            </span>
            <span className="text-[#1e3050]">/</span>
            <span className="font-mono text-[10px] text-[#64748b] tracking-widest uppercase">
              {tabs.find((t) => t.id === tab)?.label}
            </span>
          </div>

          <div className="font-mono text-[10px] text-[#64748b]">
            Current Date: <span className="text-[#f59e0b] font-semibold">{dateInfo.dateStr} ({liveTick?.current_week || dateInfo.weekStr})</span> · API: <span className="text-[#06b6d4]">{API_BASE_URL || window.location.origin}</span>
          </div>
        </div>

        {tab === "overview" && (
          <OverviewTab
            kpis={kpiData}
            rates={ratesData}
            volumes={cargoData}
            alerts={alertsData}
            liveTick={liveTick}
            onAddQuickAlert={handleAddQuickAlert}
          />
        )}
        {tab === "forecast" && (
          <ForecastTab rates={ratesData} liveTick={liveTick} />
        )}
        {tab === "vessels" && (
          <VesselsTab vessels={vesselsData} onAddVessel={handleAddVessel} />
        )}
        {tab === "ports" && <PortsTab />}
        {tab === "procurement" && <ProcurementTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-8 py-5 px-5 bg-black/20 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-mono text-[10px] text-[#334155]">
            FreightIQ · Intelligent Freight Forecasting · East Coast India Bulk
            Cargo Division
          </p>
          <p className="font-mono text-[10px] text-[#334155]">
            Data: Baltic Exchange · Port Authorities · Internal Procurement DB · {dateInfo.dateStr} ({liveTick?.current_week || dateInfo.weekStr})
          </p>
        </div>
      </footer>
    </div>
  )
}
