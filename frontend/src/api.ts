export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) !== undefined
    ? (import.meta.env.VITE_API_BASE_URL as string)
    : (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")

export interface KpiMetric {
  label: string
  value: string
  sub: string
  change: string
  changeUp: boolean
  updatedAt?: string
}

export interface FreightRatePoint {
  week: string
  actual: number | null
  forecast: number
  bdi: number | null
}

export interface CargoVolumePoint {
  month: string
  coal: number
  iron: number
  fertilizer: number
  grain: number
}

export interface Vessel {
  name: string
  type: string
  dwt: string
  route: string
  cargo: string
  eta: string
  rate: string
  status: string
}

export interface PortActivity {
  port: string
  inbound: number
  outbound: number
  waiting: number
}

export interface MaritimeAlert {
  type: "warning" | "success" | "danger" | "info"
  msg: string
  time: string
}

export interface LiveMarketTick {
  timestamp: string
  server_time: string
  current_week?: string
  current_date?: string
  bdi: number
  capesize_rate: number
  panamax_rate: number
  bunker_vlsfo: number
  port_congestion_index: number
  active_charters: number
  change_pct: number
  trend: string
}

export interface ForecastPredictionRequest {
  route: string
  vessel_type: string
  cargo: string
  bunker_fuel_price_usd?: number
  season_factor?: number
}

export interface ForecastPredictionResponse {
  predicted_daily_rate: number
  currency: string
  confidence_interval: {
    p10: number
    p90: number
    confidence: string
  }
  bdi_equivalent: number
  recommendation: string
}

export async function checkBackendHealth(): Promise<{ status: string; server_time?: string }> {
  const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) })
  if (!res.ok) throw new Error("Backend responded with error")
  return res.json()
}

export async function fetchLiveTick(): Promise<LiveMarketTick> {
  const res = await fetch(`${API_BASE_URL}/api/live/tick`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error("Failed to fetch live tick")
  return res.json()
}

export async function fetchKpiMetrics(): Promise<KpiMetric[]> {
  const res = await fetch(`${API_BASE_URL}/api/kpi`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error("Failed to fetch KPIs")
  return res.json()
}

export async function fetchFreightRates(): Promise<FreightRatePoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/forecast/rates`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error("Failed to fetch freight rates")
  return res.json()
}

export async function fetchCargoVolumes(): Promise<CargoVolumePoint[]> {
  const res = await fetch(`${API_BASE_URL}/api/cargo/volumes`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error("Failed to fetch cargo volumes")
  return res.json()
}

export async function fetchVessels(): Promise<Vessel[]> {
  const res = await fetch(`${API_BASE_URL}/api/fleet/vessels`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error("Failed to fetch vessels")
  return res.json()
}

export async function addVessel(vessel: Vessel): Promise<Vessel> {
  const res = await fetch(`${API_BASE_URL}/api/fleet/vessels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vessel),
  })
  if (!res.ok) throw new Error("Failed to add vessel")
  return res.json()
}

export async function fetchAlerts(): Promise<MaritimeAlert[]> {
  const res = await fetch(`${API_BASE_URL}/api/alerts`, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error("Failed to fetch alerts")
  return res.json()
}

export async function addAlert(alert: MaritimeAlert): Promise<MaritimeAlert> {
  const res = await fetch(`${API_BASE_URL}/api/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  })
  if (!res.ok) throw new Error("Failed to post alert")
  return res.json()
}

export async function predictRate(req: ForecastPredictionRequest): Promise<ForecastPredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/api/forecast/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error("Failed to run prediction")
  return res.json()
}
