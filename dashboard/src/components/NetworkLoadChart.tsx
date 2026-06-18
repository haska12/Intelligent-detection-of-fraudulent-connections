import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { NetworkLoadPoint } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from './TimeSeriesChart'

interface Props { data: NetworkLoadPoint[] }

function fmtTime(ts: string) { return ts.slice(11, 16) }
function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)}GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)}MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)}KB`
  return `${b}B`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl space-y-1">
      <p className="text-muted font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-bold tabular-nums">
            {p.name === 'Network Bytes' ? fmtBytes(p.value) : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function NetworkLoadChart({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tickColor = dark ? '#6B7194' : '#9098BB'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'
  const formatted = data.map(d => ({ ...d, time: fmtTime(d.ts_minute) }))

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Network Load vs Attacks</h2>
        <span className="text-muted text-xs">{data.length} points</span>
      </div>
      {data.length === 0 ? <EmptyState dark={dark} message="No network load data" /> : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={formatted} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} />
            <YAxis yAxisId="bytes" orientation="left" tick={{ fill: tickColor, fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtBytes} />
            <YAxis yAxisId="attacks" orientation="right" tick={{ fill: tickColor, fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v) => <span style={{ color: tickColor }}>{v}</span>} />
            <Bar yAxisId="bytes" dataKey="total_network_bytes" name="Network Bytes" fill="#5865C5" fillOpacity={dark ? 0.4 : 0.6} radius={[2, 2, 0, 0]} />
            <Line yAxisId="attacks" type="monotone" dataKey="attack_count" name="Attacks" stroke="#E8623A" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
