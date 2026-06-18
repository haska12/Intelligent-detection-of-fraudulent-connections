import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { StatePoint } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from './TimeSeriesChart'

interface Props { data: StatePoint[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as StatePoint
  const rate = d.total_flows > 0 ? ((d.attack_flows / d.total_flows) * 100).toFixed(1) : '0'
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl space-y-1">
      <p className="font-bold text-[#7B5BC4] mb-1">{label}</p>
      <p className="text-muted">Total flows: <span className="font-semibold">{Number(d.total_flows).toLocaleString()}</span></p>
      <p className="text-muted">Attack flows: <span className="font-semibold text-[#E8623A]">{Number(d.attack_flows).toLocaleString()}</span></p>
      <p className="text-muted">Attack rate: <span className="font-semibold text-[#F5A623]">{rate}%</span></p>
    </div>
  )
}

export default function StateChart({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tickColor = dark ? '#6B7194' : '#9098BB'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'
  const sorted = [...data].sort((a, b) => b.total_flows - a.total_flows).slice(0, 10)

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Connection States</h2>
        <span className="text-muted text-xs">{data.length} states</span>
      </div>
      {data.length === 0 ? <EmptyState dark={dark} message="No connection state data" /> : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 60, left: 50, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="state" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total_flows" radius={[0, 4, 4, 0]}>
              {sorted.map((d, i) => {
                const rate = d.total_flows > 0 ? d.attack_flows / d.total_flows : 0
                // Blend DXC blue → orange based on attack rate
                const r = Math.round(88  + rate * (232 - 88))
                const g = Math.round(101 + rate * (98  - 101))
                const b = Math.round(197 + rate * (58  - 197))
                return <Cell key={i} fill={`rgb(${r},${g},${b})`} />
              })}
              <LabelList dataKey="attack_flows" position="right"
                style={{ fill: '#E8623A', fontSize: 10, fontWeight: 700 }}
                formatter={(v: number) => v > 0 ? `⚠ ${v.toLocaleString()}` : ''} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
