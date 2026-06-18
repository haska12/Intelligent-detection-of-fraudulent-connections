import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { CategoryPoint } from '../api/client'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from './TimeSeriesChart'

interface Props { data: CategoryPoint[] }

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{(percent * 100).toFixed(0)}%</text>
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl">
      <p className="font-bold mb-1.5" style={{ color: d.color }}>{d.category}</p>
      <p className="text-muted">Count: <span className="font-semibold">{Number(d.category_count).toLocaleString()}</span></p>
      <p className="text-muted">Avg Severity: <span className="font-semibold">{Number(d.avg_severity).toFixed(2)}</span></p>
      <p className="text-muted">Share: <span className="font-semibold">{d.total_events > 0 ? ((d.category_count / d.total_events) * 100).toFixed(1) : 0}%</span></p>
    </div>
  )
}

export default function CategoryChart({ data }: Props) {
  const [mode, setMode] = useState<'pie' | 'bar'>('pie')
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tickColor = dark ? '#6B7194' : '#9098BB'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Attack Categories</h2>
        <div className={`flex gap-0.5 rounded-lg p-1 border ${dark ? 'bg-[#0D0F1C] border-[#1F2340]' : 'bg-[#F2F4F8] border-[#E4E8F0]'}`}>
          {(['pie', 'bar'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-0.5 rounded text-xs font-bold transition-all ${mode === m ? 'tw-pill-active' : 'tw-pill'}`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? <EmptyState dark={dark} message="No category data" /> : mode === 'pie' ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={105} innerRadius={50}
              dataKey="category_count" nameKey="category" labelLine={false} label={renderLabel}>
              {data.map((d, i) => <Cell key={i} fill={d.color} stroke={dark ? '#141626' : '#fff'} strokeWidth={2} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ color: tickColor, fontSize: 11 }}>{v}</span>} wrapperStyle={{ paddingTop: 8 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 75, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="category" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} width={75} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="category_count" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
