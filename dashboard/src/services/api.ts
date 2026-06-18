import axios from 'axios'

const http = axios.create({ baseURL: '/api', timeout: 10000 })

export interface KpiSummary {
  total_events: number; threats_detected: number; attack_rate: number
  alerts_last_1h: number; total_24h: number; threats_24h: number
  avg_severity: number; avg_duration_ms: number; threat_index: number
  system_health: number; top_threat: string
  training_f1: number; training_accuracy: number
  training_precision: number; training_recall: number
  generated_at: string; window_hours?: number
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
export interface HeatmapPoint { hour: number; dow: number; total: number; attacks: number }
export interface ModelPerformance {
  active_model: string; training_f1: number; training_accuracy: number
  training_precision: number; training_recall: number
  live_accuracy: number; detection_rate: number; total_predictions: number
  recent_total: number; recent_attacks: number
  pipeline_stages: number; features: number; classes: number
  models: ModelEntry[]; category_accuracy: CategoryAccuracy[]
  generated_at: string
}
export interface ModelEntry {
  name: string; f1: number; accuracy: number; precision: number; recall: number; selected: boolean; params: string
}
export interface CategoryAccuracy { category: string; total: number; correct: number; accuracy: number; color: string }
export interface IncidentRow {
  threat_type: string; event_count: number; max_severity: number; avg_severity: number
  last_seen: string; first_seen: string; total_bytes: number; color: string; incident_id: string
}
export interface ActivityEvent {
  ts: string; proto: string; service: string; state: string; predicted_cat: string
  is_attack: number; severity: number; sbytes: number; dbytes: number; spkts: number; dpkts: number
  dur: number; color: string
}
export interface AlertItem {
  ts: string; proto: string; service: string; state: string; predicted_cat: string
  is_attack: number; severity: number; dur: number; sbytes: number; dbytes: number; spkts: number; dpkts: number
}
export interface HealthData { status: string; total_events: number; total_alerts: number }
export interface StatePoint { state: string; total_flows: number; attack_flows: number; avg_severity: number }

const call = async <T>(path: string, params?: Record<string, unknown>): Promise<T> => {
  const res = await http.get<T>(path, { params })
  return res.data
}

export const api = {
  health:        ()           => call<HealthData>('/health'),
  kpiSummary:    (h = 0)      => call<KpiSummary>('/kpi/summary', { hours: h }),
  timeseries:    (h: number)  => call<TimeSeriesPoint[]>('/powerbi/timeseries', { hours: h }),
  byCategory:    (h: number)  => call<CategoryPoint[]>('/powerbi/by_category', { hours: h }),
  byProtocol:    (h: number)  => call<ProtocolPoint[]>('/powerbi/by_protocol', { hours: h }),
  bySeverity:    (h: number)  => call<{ severity: number; event_count: number; attack_count: number }[]>('/powerbi/by_severity', { hours: h }),
  byState:       (h: number)  => call<StatePoint[]>('/powerbi/by_state', { hours: h }),
  networkLoad:   (h: number)  => call<{ ts_minute: string; total_network_bytes: number; attack_count: number }[]>('/powerbi/network_load', { hours: h }),
  heatmap:       (d: number)  => call<HeatmapPoint[]>('/heatmap', { days: d }),
  incidents:     (h = 0)      => call<IncidentRow[]>('/incidents', { hours: h }),
  activityStream:(n: number, h = 0) => call<ActivityEvent[]>('/activity/stream', { n, hours: h }),
  alerts:        (n: number, h = 0) => call<{ alerts: AlertItem[]; count: number }>('/alerts', { limit: n, hours: h }),
  modelPerf:     (h = 0)      => call<ModelPerformance>('/model/performance', { hours: h }),
}
