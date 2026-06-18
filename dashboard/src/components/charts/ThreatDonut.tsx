import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { CategoryPoint } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import PanelHeader from '../ui/PanelHeader'
import EmptyState from '../ui/EmptyState'
import { exportCSV } from '../../utils/formatters'

interface Props { data: CategoryPoint[] }

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle"
      dominantBaseline="central" fontSize={12} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  )
}

const ENTERPRISE: Record<string, string> = {
  Normal: 'Authorized', Fuzzers: 'Fuzzing', Analysis: 'Analysis',
  Backdoors: 'Backdoor', DoS: 'DoS', Exploits: 'Exploitation',
  Generic: 'Generic', Reconnaissance: 'Recon.', Shellcode: 'Injection',
  Worms: 'Net. Worm',
}

export default function ThreatDonut({ data }: Props) {
  const { t }      = useTranslation()
  const { isDark } = useTheme()
  const tick  = isDark ? '#6B7194' : '#94A3B8'
  const bg    = isDark ? '#1F2937' : '#FFFFFF'
  const bo    = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F4'
  const stroke = isDark ? '#111827' : '#FFFFFF'

  const enriched = data.map(d => ({
    ...d,
    name: t(`threat_types.${d.category}`, ENTERPRISE[d.category] ?? d.category),
  }))

  return (
    <motion.div className="chart-panel h-full"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
      <PanelHeader
        title={t('charts.threat_distribution')}
        subtitle={t('charts.threat_distribution_desc')}
        onExport={() => exportCSV(enriched, 'threat_distribution')}
      />
      {enriched.length === 0
        ? <EmptyState height={280} />
        : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={enriched} cx="50%" cy="46%"
                outerRadius={110} innerRadius={55}
                dataKey="category_count" nameKey="name"
                labelLine={false} label={renderLabel}>
                {enriched.map((d, i) => (
                  <Cell key={i} fill={d.color} stroke={stroke} strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: bg, border: `1px solid ${bo}`, borderRadius: 10, fontSize: 12 }}
                formatter={(v: any, name: string) => [Number(v).toLocaleString(), name]}
              />
              <Legend
                formatter={v => <span style={{ color: tick, fontSize: 11 }}>{v}</span>}
                wrapperStyle={{ paddingTop: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )
      }
    </motion.div>
  )
}
