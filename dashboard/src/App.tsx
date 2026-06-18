import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, AlertTriangle, BrainCircuit, CalendarDays, LayoutDashboard, ShieldAlert } from 'lucide-react'
import Navbar from './components/layout/Navbar'
import OverviewPage from './pages/OverviewPage'
import ThreatIntelPage from './pages/ThreatIntelPage'
import AnalyticsPage from './pages/AnalyticsPage'
import IncidentsPage from './pages/IncidentsPage'
import ActivityPage from './pages/ActivityPage'
import DashboardAssistant from './components/DashboardAssistant'
import {
  api,
  ActivityEvent,
  AlertItem,
  CategoryPoint,
  HealthData,
  HeatmapPoint,
  IncidentRow,
  KpiSummary,
  ModelPerformance,
  ProtocolPoint,
  TimeSeriesPoint,
} from './services/api'

type Page = 'overview' | 'threats' | 'analytics' | 'incidents' | 'activity'

const TABS: { key: Page; labelKey: string; fallback: string; icon: React.ElementType }[] = [
  { key: 'overview', labelKey: 'nav.overview', fallback: 'Executive overview', icon: LayoutDashboard },
  { key: 'threats', labelKey: 'nav.threats', fallback: 'Fraudulent connections', icon: ShieldAlert },
  { key: 'analytics', labelKey: 'nav.analytics', fallback: 'Model analytics', icon: BrainCircuit },
  { key: 'incidents', labelKey: 'nav.incidents', fallback: 'Incidents', icon: AlertTriangle },
  { key: 'activity', labelKey: 'nav.activity', fallback: 'Live activity', icon: Activity },
]

const TIME_WINDOWS = [
  { label: '1h', value: 1 },
  { label: '6h', value: 6 },
  { label: '24h', value: 24 },
  { label: '7d', value: 168 },
  { label: '30d', value: 720 },
  { label: 'All', value: 99999 },
]

const heatmapDaysFor = (hours: number) => {
  if (hours >= 99999) return 30
  return Math.max(1, Math.min(30, Math.ceil(hours / 24)))
}

export default function App() {
  const { t } = useTranslation()
  const [activePage, setActivePage] = useState<Page>('overview')
  const [timeWindow, setTimeWindow] = useState(24)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [kpi, setKpi] = useState<KpiSummary | null>(null)
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([])
  const [categories, setCategories] = useState<CategoryPoint[]>([])
  const [protocols, setProtocols] = useState<ProtocolPoint[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([])
  const [stream, setStream] = useState<ActivityEvent[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [incidents, setIncidents] = useState<IncidentRow[]>([])
  const [model, setModel] = useState<ModelPerformance | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      const healthData = await api.health()
      setHealth(healthData)
      setLastUpdated(new Date())

      const [
        kpiData,
        timeseriesData,
        categoryData,
        protocolData,
        heatmapData,
        streamData,
        alertsData,
        incidentsData,
        modelData,
      ] = await Promise.allSettled([
        api.kpiSummary(timeWindow),
        api.timeseries(timeWindow),
        api.byCategory(timeWindow),
        api.byProtocol(timeWindow),
        api.heatmap(heatmapDaysFor(timeWindow)),
        api.activityStream(timeWindow >= 720 ? 300 : 100, timeWindow),
        api.alerts(timeWindow >= 720 ? 1000 : 500, timeWindow),
        api.incidents(timeWindow),
        api.modelPerf(timeWindow),
      ])

      if (kpiData.status === 'fulfilled') setKpi(kpiData.value)
      if (timeseriesData.status === 'fulfilled') setTimeseries(timeseriesData.value)
      if (categoryData.status === 'fulfilled') setCategories(categoryData.value)
      if (protocolData.status === 'fulfilled') setProtocols(protocolData.value)
      if (heatmapData.status === 'fulfilled') setHeatmap(heatmapData.value)
      if (streamData.status === 'fulfilled') setStream(streamData.value)
      if (alertsData.status === 'fulfilled') setAlerts(alertsData.value.alerts)
      if (incidentsData.status === 'fulfilled') setIncidents(incidentsData.value)
      if (modelData.status === 'fulfilled') setModel(modelData.value)
    } catch (error) {
      console.error('Dashboard health check failed:', error)
      setHealth(null)
    }
  }, [timeWindow])

  useEffect(() => {
    loadData()
    const timer = window.setInterval(loadData, 10000)
    return () => window.clearInterval(timer)
  }, [loadData])

  const renderPage = () => {
    switch (activePage) {
      case 'threats':
        return <ThreatIntelPage alerts={alerts} cats={categories} protos={protocols} />
      case 'analytics':
        return <AnalyticsPage model={model} kpi={kpi} />
      case 'incidents':
        return <IncidentsPage incidents={incidents} />
      case 'activity':
        return <ActivityPage stream={stream} />
      case 'overview':
      default:
        return (
          <OverviewPage
            kpi={kpi}
            ts={timeseries}
            cats={categories}
            protos={protocols}
            heatmap={heatmap}
            stream={stream}
          />
        )
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Navbar
        health={health}
        lastUpdated={lastUpdated}
        alertsCount={kpi?.alerts_last_1h ?? alerts.filter(row => row.is_attack).length}
        recentAlerts={alerts.filter(row => row.is_attack)}
      />

      <div className="sticky top-[94px] z-40 border-b px-4 py-3 backdrop-blur-xl lg:px-6" style={{
        borderColor: 'var(--border-subtle)',
        background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
      }}>
        <div className="mx-auto grid max-w-[1600px] grid-cols-1 items-center gap-3 xl:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center justify-center gap-2 xl:justify-start">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold" style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}>
              <CalendarDays className="h-4 w-4 text-[#5865C5]" />
              History
            </div>
            <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
              {TIME_WINDOWS.map(option => {
                const active = timeWindow === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setTimeWindow(option.value)}
                    className="px-3 py-2 text-xs font-bold transition-all"
                    style={{
                      background: active ? '#5865C5' : 'var(--bg-elevated)',
                      color: active ? '#FFFFFF' : 'var(--text-secondary)',
                      borderRight: '1px solid var(--border-subtle)',
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 overflow-x-auto">
            {TABS.map(({ key, labelKey, fallback, icon: Icon }) => {
              const active = activePage === key
              return (
                <button
                  key={key}
                  onClick={() => setActivePage(key)}
                  className="flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: active ? 'rgba(88,101,197,0.35)' : 'var(--border-subtle)',
                    background: active ? 'linear-gradient(90deg, rgba(88,101,197,0.16), rgba(232,98,58,0.10))' : 'var(--bg-surface)',
                    color: active ? '#5865C5' : 'var(--text-secondary)',
                    boxShadow: active ? '0 12px 28px rgba(88,101,197,0.12)' : 'none',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {t(labelKey, fallback)}
                </button>
              )
            })}
          </div>

          <div className="hidden justify-end text-xs font-semibold xl:flex" style={{ color: 'var(--text-muted)' }}>
            Showing {TIME_WINDOWS.find(option => option.value === timeWindow)?.label ?? '24h'} history
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6">
        {renderPage()}
      </main>
      <DashboardAssistant page={activePage} kpi={kpi} model={model} alerts={alerts} />
    </div>
  )
}
