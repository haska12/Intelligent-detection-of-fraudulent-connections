import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { ProtocolPoint } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import PanelHeader from '../ui/PanelHeader'
import EmptyState from '../ui/EmptyState'
import { fmtBytes, exportCSV } from '../../utils/formatters'

interface Props { data: ProtocolPoint[] }

const COLORS = [
  '#5865C5','#6B79D8','#7B8FEB','#6366F1','#8B5CF6',
  '#7C3AED','#4F46E5','#3B82F6','#0EA5E9','#06B6D4',
  '#0891B2','#0E7490',
]

export default function ProtocolAnalytics({ data }: Props) {
  const { t }      = useTranslation()
  const { isDark } = useTheme()
  const grid  = isDark ? 'rgba(255,255,255,0.05)' : '#EEF2F8'
  const tick  = isDark ? '#4B5470' : '#94A3B8'
  const bg    = isDark ? '#1F2937' : '#FFFFFF'
  const bo    = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F4'
  const top   = data.slice(0, 12)

  return (
    <motion.div className="chart-panel h-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
      <PanelHeader
        title={t('charts.protocol_analytics')}
        subtitle={t('charts.protocol_analytics_desc')}
        count={`${data.length} protocols`}
        onExport={() => exportCSV(top, 'protocol_analytics')}
      />
      {top.length === 0
        ? <EmptyState height={260} />
        : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
              <XAxis dataKey="protocol" tick={{ fill: tick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: tick, fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: bg, border: `1px solid ${bo}`, borderRadius: 10, fontSize: 12 }}
                formatter={(v: any, name: string, props: any) => {
                  const d = props.payload as ProtocolPoint
                  if (name === 'Total Flows') return [Number(v).toLocaleString(), name]
                  return [Number(v).toLocaleString(), name]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={v => <span style={{ color: tick }}>{v}</span>}
              />
              <Bar dataKey="total_flows" name="Total Flows" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {top.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="attack_flows" name="Threat Flows" fill="#EF4444" fillOpacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    </motion.div>
  )
}
