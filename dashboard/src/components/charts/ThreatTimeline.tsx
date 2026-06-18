import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { motion } from 'framer-motion'
import { TimeSeriesPoint } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import PanelHeader from '../ui/PanelHeader'
import EmptyState from '../ui/EmptyState'

interface Props { data: TimeSeriesPoint[] }

const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (!active || !payload?.length) return null
  const bg = isDark ? '#1F2937' : '#FFFFFF'
  const bo = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F4'
  return (
    <div style={{ background: bg, border: `1px solid ${bo}`, borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: isDark ? '#8B95B0' : '#64748B', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display:'flex', justifyContent:'space-between', gap:20, color: p.color, marginBottom: 2 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 700 }}>{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function ThreatTimeline({ data }: Props) {
  const { t }      = useTranslation()
  const { isDark } = useTheme()
  const grid  = isDark ? 'rgba(255,255,255,0.05)' : '#EEF2F8'
  const tick  = isDark ? '#4B5470' : '#94A3B8'

  const chartData = data.map(d => ({
    ...d,
    time: d.ts_minute.slice(11, 16),
  }))

  const avgAttacks = chartData.length
    ? Math.round(chartData.reduce((s, d) => s + d.attack_events, 0) / chartData.length)
    : 0

  return (
    <motion.div className="chart-panel h-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
      <PanelHeader
        title={t('charts.threat_timeline')}
        subtitle={t('charts.threat_timeline_desc')}
        count={`${data.length} pts`}
        live
      />
      {data.length === 0
        ? <EmptyState height={260} />
        : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#5865C5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#5865C5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAttack" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} />
              <XAxis dataKey="time" tick={{ fill: tick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: tick, fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
              <Tooltip content={(p) => <CustomTooltip {...p} isDark={isDark} />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={v => <span style={{ color: tick }}>{v}</span>}
              />
              {avgAttacks > 0 && (
                <ReferenceLine y={avgAttacks} stroke="#EF4444" strokeDasharray="4 4" strokeOpacity={0.4}
                  label={{ value: 'avg', fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }} />
              )}
              <Area type="monotone" dataKey="total_events"  name={t('charts.total_traffic')} stroke="#5865C5" fill="url(#gTotal)"  strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="attack_events" name={t('charts.threats')}       stroke="#EF4444" fill="url(#gAttack)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="normal_events" name={t('charts.legitimate')}    stroke="#22C55E" fill="url(#gNormal)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )
      }
    </motion.div>
  )
}
