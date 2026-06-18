import { useMemo } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Activity, AlertTriangle, ArrowUpRight, Brain, CheckCircle2, Gauge,
  Network, Radar, ShieldAlert, Sparkles, Target, Zap,
} from 'lucide-react'
import {
  KpiSummary, TimeSeriesPoint, CategoryPoint,
  ProtocolPoint, HeatmapPoint, ActivityEvent,
} from '../services/api'
import { fmtBytes, fmtNumber, fmtPct, threatIndexColor } from '../utils/formatters'
import { useTheme } from '../context/ThemeContext'

interface Props {
  kpi: KpiSummary | null
  ts: TimeSeriesPoint[]
  cats: CategoryPoint[]
  protos: ProtocolPoint[]
  heatmap: HeatmapPoint[]
  stream: ActivityEvent[]
}

type ExecutiveTone = 'stable' | 'elevated' | 'critical'

const safePct = (value: number, digits = 1) => `${Number.isFinite(value) ? value.toFixed(digits) : '0.0'}%`

function movingAverage(points: TimeSeriesPoint[], index: number, key: keyof TimeSeriesPoint, span = 5) {
  const start = Math.max(0, index - span + 1)
  const sample = points.slice(start, index + 1)
  const total = sample.reduce((sum, row) => sum + Number(row[key] || 0), 0)
  return sample.length ? Math.round(total / sample.length) : 0
}

function samplePoints<T>(points: T[], maxPoints = 180) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  return points.filter((_, index) => index % step === 0 || index === points.length - 1)
}

function fmtAxisTime(ts: string, totalPoints: number) {
  if (!ts) return ''
  if (totalPoints > 96) return ts.slice(5, 16).replace('T', ' ')
  return ts.slice(11, 16)
}

function getTone(kpi: KpiSummary | null): ExecutiveTone {
  if (!kpi) return 'stable'
  if (kpi.threat_index >= 70 || kpi.avg_severity >= 4) return 'critical'
  if (kpi.threat_index >= 45 || kpi.alerts_last_1h > 0) return 'elevated'
  return 'stable'
}

export default function OverviewPage({ kpi, ts, cats, protos, heatmap, stream }: Props) {
  const { isDark } = useTheme()
  const tone = getTone(kpi)

  const palette = {
    text: isDark ? '#F8FAFC' : '#111827',
    muted: isDark ? '#8B95B0' : '#64748B',
    faint: isDark ? '#4B5470' : '#94A3B8',
    panel: isDark ? '#0C1121' : '#FAFBFD',
    panelSoft: isDark ? '#101827' : '#EEF3F8',
    border: isDark ? 'rgba(255,255,255,0.07)' : '#CCD6E4',
    grid: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
  }

  const trendData = useMemo(() => {
    const sampled = samplePoints(ts)
    return sampled.map((row, index, arr) => ({
      time: fmtAxisTime(row.ts_minute, sampled.length) || `${index}`,
      total: row.total_events,
      attacks: row.attack_events,
      normal: row.normal_events,
      severity: row.avg_severity,
      forecast: movingAverage(arr, index, 'attack_events'),
    }))
  }, [ts])

  const topCategory = cats[0]
  const topProtocol = protos[0]
  const attackRate = kpi?.attack_rate ?? 0
  const health = kpi?.system_health ?? 0
  const decisionColor = tone === 'critical' ? '#DC2626' : tone === 'elevated' ? '#D97706' : '#059669'
  const decisionLabel = tone === 'critical' ? 'Board attention required' : tone === 'elevated' ? 'Heightened monitoring' : 'Controlled posture'
  const decisionCopy = tone === 'critical'
    ? 'Threat pressure is materially above tolerance. Prioritize containment and protocol-level investigation.'
    : tone === 'elevated'
      ? 'Activity is rising but manageable. Focus analyst time on the leading drivers before escalation.'
      : 'Security operations are stable. Continue monitoring high-signal segments and preserve response capacity.'

  const categoryDrivers = useMemo(() => cats.slice(0, 6), [cats])
  const protocolDrivers = useMemo(() => protos.slice(0, 7), [protos])

  const anomaly = useMemo(() => {
    if (!trendData.length) return { label: 'No active anomaly', value: 0, color: '#059669' }
    const latest = trendData[trendData.length - 1]
    const recent = samplePoints(ts)
    const baseline = Math.max(1, movingAverage(recent, Math.max(0, recent.length - 2), 'attack_events', 8))
    const lift = Math.round(((latest.attacks - baseline) / baseline) * 100)
    if (lift > 40) return { label: 'Attack spike vs baseline', value: lift, color: '#DC2626' }
    if (lift > 15) return { label: 'Moderate variance detected', value: lift, color: '#D97706' }
    return { label: 'Within operating range', value: Math.max(0, lift), color: '#059669' }
  }, [trendData, ts])

  const exposure = useMemo(() => {
    const busiest = heatmap.reduce((best, row) => row.attacks > best.attacks ? row : best, { hour: 0, dow: 0, total: 0, attacks: 0 })
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return {
      window: `${days[busiest.dow] ?? 'Day'} ${String(busiest.hour).padStart(2, '0')}:00`,
      attacks: busiest.attacks,
      intensity: busiest.total ? Math.round((busiest.attacks / busiest.total) * 100) : 0,
    }
  }, [heatmap])

  const recommendations = [
    {
      title: topProtocol ? `Inspect ${topProtocol.protocol.toUpperCase()} traffic path` : 'Confirm protocol telemetry coverage',
      detail: topProtocol
        ? `${fmtNumber(topProtocol.attack_flows)} threat flows observed across ${fmtBytes(topProtocol.total_bytes)}.`
        : 'Protocol distribution is not yet populated.',
      priority: topProtocol && topProtocol.attack_flows > 0 ? 'High' : 'Medium',
    },
    {
      title: topCategory ? `Prioritize ${topCategory.category} investigation` : 'Build category baseline',
      detail: topCategory
        ? `${fmtNumber(topCategory.category_count)} events with average severity ${topCategory.avg_severity.toFixed(1)}.`
        : 'No category driver is currently dominant.',
      priority: topCategory && topCategory.avg_severity >= 4 ? 'High' : 'Medium',
    },
    {
      title: attackRate > 10 ? 'Escalate response capacity' : 'Maintain monitoring cadence',
      detail: attackRate > 10
        ? `Attack rate is ${safePct(attackRate)}, above standard SOC tolerance.`
        : `Attack rate is ${safePct(attackRate)}, suitable for normal queue discipline.`,
      priority: attackRate > 10 ? 'High' : 'Low',
    },
  ]

  return (
    <div className="page-enter space-y-5">
      <section
        className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-4"
        aria-label="Executive summary"
      >
        <div
          className="rounded-[8px] border p-5"
          style={{ background: palette.panel, borderColor: palette.border }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>
                <Sparkles className="h-4 w-4" />
                Executive risk narrative
              </div>
              <h2 className="mt-3 text-[28px] font-semibold leading-tight" style={{ color: palette.text }}>
                {decisionLabel}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: palette.muted }}>
                {decisionCopy}
              </p>
            </div>

            <div className="min-w-[260px] rounded-[8px] border p-4" style={{ borderColor: palette.border, background: palette.panelSoft }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.faint }}>Threat index</span>
                <Gauge className="h-4 w-4" style={{ color: decisionColor }} />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl font-semibold tabular-nums" style={{ color: decisionColor }}>
                  {(kpi?.threat_index ?? 0).toFixed(0)}
                </span>
                <span className="pb-1 text-sm" style={{ color: palette.muted }}>/ 100</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: isDark ? '#1F2937' : '#E5E7EB' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, kpi?.threat_index ?? 0)}%`, background: decisionColor }} />
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Events analyzed', value: fmtNumber(kpi?.total_events ?? 0), icon: Activity, color: '#2563EB' },
              { label: 'Threats detected', value: fmtNumber(kpi?.threats_detected ?? 0), icon: ShieldAlert, color: '#DC2626' },
              { label: 'Attack rate', value: safePct(attackRate), icon: Target, color: threatIndexColor(kpi?.threat_index ?? 0) },
              { label: 'System health', value: `${health.toFixed(0)}%`, icon: CheckCircle2, color: health >= 80 ? '#059669' : health >= 60 ? '#D97706' : '#DC2626' },
            ].map(item => (
              <div key={item.label} className="rounded-[8px] border px-4 py-3" style={{ borderColor: palette.border, background: palette.panelSoft }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold" style={{ color: palette.muted }}>{item.label}</span>
                  <item.icon className="h-4 w-4" style={{ color: item.color }} />
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: palette.text }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border p-5" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>AI insight panel</div>
              <h3 className="mt-2 text-lg font-semibold" style={{ color: palette.text }}>What changed</h3>
            </div>
            <Brain className="h-5 w-5" style={{ color: '#7C3AED' }} />
          </div>
          <div className="mt-5 space-y-4">
            {[
              { label: anomaly.label, value: `${anomaly.value}%`, color: anomaly.color },
              { label: 'Peak exposure window', value: exposure.window, color: '#2563EB' },
              { label: 'Top business driver', value: topCategory?.category ?? 'N/A', color: topCategory?.color ?? '#64748B' },
            ].map(item => (
              <div key={item.label} className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: palette.border }}>
                <span className="text-sm" style={{ color: palette.muted }}>{item.label}</span>
                <span className="text-right text-sm font-semibold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.55fr] gap-4">
        <div className="rounded-[8px] border p-5" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Trend and forecast analysis</div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Threat flow trajectory</h3>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: palette.muted }}>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#DC2626]" />Attacks</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#2563EB]" />Total traffic</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#D97706]" />Forecast</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <ComposedChart data={trendData} margin={{ top: 8, right: 18, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: palette.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: palette.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: palette.panel, border: `1px solid ${palette.border}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: palette.text }}
              />
              <Area type="monotone" dataKey="total" name="Total traffic" stroke="#2563EB" fill="url(#trafficFill)" strokeWidth={2} />
              <Bar dataKey="attacks" name="Attacks" fill="#DC2626" radius={[3, 3, 0, 0]} maxBarSize={18} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#D97706" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[8px] border p-5" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Strategic KPI area</div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Operating scorecard</h3>
            </div>
            <Radar className="h-5 w-5" style={{ color: '#2563EB' }} />
          </div>
          <div className="mt-5 space-y-4">
            {[
              { label: 'Model accuracy', value: (kpi?.training_accuracy ?? 0) * 100, target: 85, color: '#2563EB' },
              { label: 'Threat containment capacity', value: kpi?.system_health ?? 0, target: 80, color: '#059669' },
              { label: 'Detection pressure', value: Math.min(100, attackRate * 5), target: 50, color: '#DC2626' },
              { label: 'Recent alert load', value: Math.min(100, (kpi?.alerts_last_1h ?? 0) / 10), target: 60, color: '#D97706' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: palette.muted }}>{item.label}</span>
                  <span className="font-semibold tabular-nums" style={{ color: palette.text }}>{item.value.toFixed(1)}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full" style={{ background: isDark ? '#1F2937' : '#E5E7EB' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.value)}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="rounded-[8px] border p-5 xl:col-span-1" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Segmentation</div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Threat portfolio mix</h3>
            </div>
            <Network className="h-5 w-5" style={{ color: '#0F766E' }} />
          </div>
          <div className="mt-5 space-y-3">
            {categoryDrivers.map(row => {
              const width = row.total_events ? Math.max(3, (row.category_count / row.total_events) * 100) : 0
              return (
                <div key={row.category}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span style={{ color: palette.muted }}>{row.category}</span>
                    <span className="font-semibold" style={{ color: palette.text }}>{fmtNumber(row.category_count)}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: isDark ? '#1F2937' : '#E5E7EB' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, width)}%`, background: row.color || '#2563EB' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[8px] border p-5 xl:col-span-1" style={{ background: palette.panel, borderColor: palette.border }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Network exposure map</div>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Protocol concentration</h3>
          </div>
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={protocolDrivers} layout="vertical" margin={{ top: 12, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="protocol" tick={{ fill: palette.faint, fontSize: 11 }} width={72} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: palette.panel, border: `1px solid ${palette.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="attack_flows" name="Threat flows" radius={[0, 4, 4, 0]}>
                {protocolDrivers.map((_, index) => (
                  <Cell key={index} fill={index === 0 ? '#DC2626' : index < 3 ? '#D97706' : '#2563EB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[8px] border p-5 xl:col-span-1" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Action recommendations</div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Next best actions</h3>
            </div>
            <Zap className="h-5 w-5" style={{ color: '#D97706' }} />
          </div>
          <div className="mt-5 space-y-3">
            {recommendations.map(item => (
              <div key={item.title} className="border-b pb-3 last:border-b-0 last:pb-0" style={{ borderColor: palette.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: palette.text }}>{item.title}</div>
                  <span
                    className="rounded-full px-2 py-1 text-[10px] font-bold uppercase"
                    style={{
                      color: item.priority === 'High' ? '#DC2626' : item.priority === 'Medium' ? '#D97706' : '#059669',
                      background: item.priority === 'High' ? 'rgba(220,38,38,0.10)' : item.priority === 'Medium' ? 'rgba(217,119,6,0.10)' : 'rgba(5,150,105,0.10)',
                    }}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5" style={{ color: palette.muted }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="rounded-[8px] border p-5" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Drill-down analysis</div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Recent events requiring review</h3>
            </div>
            <ArrowUpRight className="h-5 w-5" style={{ color: '#2563EB' }} />
          </div>
          <div className="mt-4 max-h-[260px] overflow-y-auto pr-1">
            {stream.slice(0, 8).map((event, index) => (
              <div key={`${event.ts}-${index}`} className="grid grid-cols-[88px_1fr_54px] gap-3 border-b py-3 text-xs last:border-b-0" style={{ borderColor: palette.border }}>
                <span style={{ color: palette.faint }}>{event.ts?.slice(11, 19) || '--:--:--'}</span>
                <div>
                  <div className="font-semibold" style={{ color: event.color || palette.text }}>{event.predicted_cat || 'Unknown'}</div>
                  <div className="mt-1" style={{ color: palette.muted }}>{event.proto?.toUpperCase()} / {event.service || '-'} / {event.state || '-'}</div>
                </div>
                <span className="text-right font-semibold" style={{ color: event.severity >= 4 ? '#DC2626' : event.severity >= 2 ? '#D97706' : '#059669' }}>
                  S{event.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border p-5" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: palette.faint }}>Performance drivers and anomalies</div>
              <h3 className="mt-1 text-lg font-semibold" style={{ color: palette.text }}>Severity and exposure relationship</h3>
            </div>
            <AlertTriangle className="h-5 w-5" style={{ color: anomaly.color }} />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="severityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
              <XAxis dataKey="time" tick={{ fill: palette.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: palette.faint, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: palette.panel, border: `1px solid ${palette.border}`, borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="severity" name="Avg severity" stroke="#7C3AED" fill="url(#severityFill)" strokeWidth={2} />
              <Line type="monotone" dataKey="attacks" name="Attack events" stroke="#DC2626" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
