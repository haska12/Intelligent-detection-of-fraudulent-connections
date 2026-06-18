import { useTranslation } from 'react-i18next'
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { ModelPerformance } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import PanelHeader from '../ui/PanelHeader'
import EmptyState from '../ui/EmptyState'

interface Props { data: ModelPerformance | null }

function Gauge({ value, label, color }: { value: number; label: string; color: string }) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'rgba(255,255,255,0.035)' : '#F1F5FA'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#D8E0EA'
  const text = isDark ? '#F1F5F9' : '#182033'
  const muted = isDark ? '#8B95B0' : '#64748B'

  return (
    <div
      className="min-h-[128px] rounded-[10px] border p-4 flex items-center justify-between gap-4"
      style={{ background: cardBg, borderColor: border }}
    >
      <div className="min-w-0">
        <p className="section-label mb-2">{label}</p>
        <p className="text-[11px] leading-5" style={{ color: muted }}>Offline benchmark</p>
        <p className="text-sm font-semibold" style={{ color: text }}>Random Forest</p>
      </div>
      <div className="relative flex-shrink-0" style={{ width: 116, height: 116 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="92%"
            data={[{ value: Math.min(100, value), fill: color }]}
            startAngle={210}
            endAngle={-30}
            cx="50%"
            cy="56%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }}
              dataKey="value"
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-[16px] font-bold leading-none tabular-nums tracking-normal" style={{ color }}>
            {value > 0 ? `${value.toFixed(1)}%` : '-'}
          </span>
        </div>
      </div>
    </div>
  )
}

const MODEL_COLORS = ['#5865C5', '#7B5BC4', '#B05CA0', '#D45E72', '#E8623A']
const STATIC_MODELS = [
  { name: 'Behavioral RF', f1Pct: 75.8, accPct: 86.1, selected: true },
  { name: 'Decision Tree', f1Pct: 73.5, accPct: 84.0, selected: false },
  { name: 'Naive Bayes', f1Pct: 46.7, accPct: 62.1, selected: false },
  { name: 'Log. Regression', f1Pct: 45.0, accPct: 59.9, selected: false },
  { name: 'Neural Network', f1Pct: 37.0, accPct: 51.4, selected: false },
]

export default function ModelMetrics({ data }: Props) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const grid = isDark ? 'rgba(255,255,255,0.05)' : '#EEF2F8'
  const tick = isDark ? '#4B5470' : '#94A3B8'
  const bgT = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'

  return (
    <div className="space-y-4">
      <motion.div className="chart-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <PanelHeader
          title={t('model.engine')}
          subtitle={t('model.engine_desc')}
          right={<span className="badge badge-info">{t('status.active')}</span>}
        />
        <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_0.75fr] gap-4 items-stretch">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Gauge value={86.1} label={t('model.accuracy')} color="#5865C5" />
            <Gauge value={81.3} label={t('model.precision')} color="#7B5BC4" />
            <Gauge value={75.8} label={t('model.recall')} color="#E8623A" />
            <Gauge value={75.8} label={t('model.f1_score')} color="#22C55E" />
          </div>
          {data && (
            <div
              className="rounded-[10px] border p-4 flex flex-col justify-between"
              style={{
                background: isDark ? 'rgba(255,255,255,0.025)' : '#EEF3F8',
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#D8E0EA',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="section-label mb-1">Live telemetry</p>
                  <p className="text-sm font-semibold" style={{ color: isDark ? '#F1F5F9' : '#182033' }}>
                    Current detection window
                  </p>
                </div>
                <span className="badge badge-warn">LIVE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
                {[
                  { label: t('model.total_analyzed'), value: Number(data.total_predictions).toLocaleString(), color: '#5865C5' },
                  { label: t('model.detection_rate'), value: `${data.detection_rate?.toFixed(1)}%`, color: '#E8623A' },
                  { label: t('model.live_accuracy'), value: data.live_accuracy > 0 ? `${data.live_accuracy?.toFixed(1)}%` : '-', color: '#22C55E' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="rounded-[8px] border px-3 py-3"
                    style={{
                      background: isDark ? 'rgba(12,17,33,0.65)' : '#FAFBFD',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                      <span className="text-[9px] font-bold text-[#E8623A]">LIVE</span>
                    </div>
                    <p className="section-label">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <motion.div className="chart-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <PanelHeader title={t('model.active_model')} subtitle="F1 Score benchmark - all evaluated engines" />
          <div className="space-y-2.5">
            {STATIC_MODELS.map((m, i) => (
              <div key={m.name} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                m.selected ? (isDark ? 'bg-[#5865C5]/12' : 'bg-[#5865C5]/08') : ''
              }`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MODEL_COLORS[i] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{m.name}</span>
                      {m.selected && <CheckCircle2 className="w-3 h-3" style={{ color: MODEL_COLORS[i] }} />}
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: MODEL_COLORS[i] }}>{m.f1Pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bgT }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: MODEL_COLORS[i] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${m.f1Pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div className="chart-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <PanelHeader title={t('model.per_category')} subtitle="Live detection accuracy by threat vector" live />
          {!data || data.category_accuracy.length === 0 ? (
            <EmptyState message="Category accuracy loading..." hint="Start streaming to populate" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.category_accuracy} layout="vertical" margin={{ top: 0, right: 50, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: tick, fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: tick, fontSize: 11 }}
                  tickLine={false}
                  width={80}
                  tickFormatter={v => {
                    const map: Record<string, string> = {
                      Normal: 'Authorized',
                      Fuzzers: 'Fuzzing',
                      Analysis: 'Analysis',
                      Backdoors: 'Backdoor',
                      DoS: 'DoS',
                      Exploits: 'Exploit',
                      Generic: 'Generic',
                      Reconnaissance: 'Recon',
                      Shellcode: 'Shellcode',
                      Worms: 'Worm',
                    }
                    return map[v] ?? v
                  }}
                />
                <Tooltip contentStyle={{ background: isDark ? '#111827' : '#fff', border: `1px solid ${grid}`, borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                  {data.category_accuracy.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  )
}
