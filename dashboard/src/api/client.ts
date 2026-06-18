const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export interface HealthData {
  status: string; database: string; total_events: number; total_alerts: number
}
export interface StatsData {
  total: number; attacks: number; normal: number; attack_rate: number; window_hours: number
  by_category: { name: string; count: number; color: string }[]
  by_protocol:  { proto: string; count: number }[]
  by_severity:  { severity: number; count: number }[]
}
export interface TimeSeriesPoint {
  ts_minute: string; total_events: number; attack_events: number; normal_events: number; avg_severity: number
}
export interface CategoryPoint {
  category: string; category_count: number; total_events: number; avg_severity: number; color: string
}
export interface ProtocolPoint {
  protocol: string; total_flows: number; attack_flows: number; total_bytes: number; avg_duration: number
}
export interface SeverityPoint {
  severity: number; event_count: number; attack_count: number
}
export interface NetworkLoadPoint {
  ts_minute: string; total_network_bytes: number; avg_source_load: number; attack_count: number
}
export interface StatePoint {
  state: string; total_flows: number; attack_flows: number; avg_severity: number
}
export interface LiveTickerItem {
  ts: string; category: string; severity: number; protocol: string
  duration: number; source_bytes: number; dest_bytes: number; color: string
}
export interface AlertItem {
  ts: string; proto: string; service: string; state: string
  attack_cat: string; predicted_cat: string; is_attack: number; severity: number
  dur: number; sbytes: number; dbytes: number; sload: number; dload: number; spkts: number; dpkts: number
}
export interface ModelMetric {
  name: string; f1: number; accuracy: number; precision: number; recall: number
  selected: boolean; params: string
}
export interface CategoryAccuracy {
  category: string; total: number; correct: number; accuracy: number; color: string
}
export interface ModelPerformanceData {
  active_model: string; training_f1: number; training_accuracy: number
  live_accuracy: number; detection_rate: number; total_predictions: number
  pipeline_stages: number; features: number; classes: number
  models: ModelMetric[]; category_accuracy: CategoryAccuracy[]
}

export const api = {
  health:       ()           => get<HealthData>('/health'),
  stats:        (h = 2)      => get<StatsData>(`/stats?hours=${h}`),
  timeseries:   (h = 2)      => get<TimeSeriesPoint[]>(`/powerbi/timeseries?hours=${h}`),
  byCategory:   (h = 2)      => get<CategoryPoint[]>(`/powerbi/by_category?hours=${h}`),
  byProtocol:   (h = 2)      => get<ProtocolPoint[]>(`/powerbi/by_protocol?hours=${h}`),
  bySeverity:   (h = 2)      => get<SeverityPoint[]>(`/powerbi/by_severity?hours=${h}`),
  networkLoad:  (h = 2)      => get<NetworkLoadPoint[]>(`/powerbi/network_load?hours=${h}`),
  byState:      (h = 2)      => get<StatePoint[]>(`/powerbi/by_state?hours=${h}`),
  liveTicker:   ()           => get<LiveTickerItem[]>('/powerbi/live_ticker'),
  alerts:       (n = 500)    => get<{ alerts: AlertItem[]; count: number }>(`/alerts?limit=${n}`),
  modelPerf:    ()           => get<ModelPerformanceData>('/model/performance'),
}
