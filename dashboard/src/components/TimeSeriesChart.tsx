import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TimeSeriesPoint } from '../api/client'
import { useTheme } from '../context/ThemeContext'

interface Props { data: TimeSeriesPoint[] }

function fmtTime(ts: string) { return ts.slice(11, 16) }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl">
      <p className="text-muted mb-2 font-semibold">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-6" style={{ color: p.color }}>
          <span>{p.name}</span>
          <span className="font-bold tabular-nums">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ dark, message }: { dark: boolean; message: string }) {
  return (
    <div className={`flex flex-col items-center justify-center h-44 gap-2 rounded-xl border-2 border-dashed ${dark ? 'border-[#1F2340] text-[#3A3F60]' : 'border-[#DDE2F5] text-[#9098BB]'}`}>
      <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs opacity-60">Try a wider time window (7d · 30d · ALL)</p>
    </div>
  )
}

export default function TimeSeriesChart({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'
  const tickColor = dark ? '#6B7194' : '#9098BB'

  const formatted = data.map(d => ({ ...d, time: fmtTime(d.ts_minute) }))

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Traffic Timeline</h2>
        <span className="text-muted text-xs">{data.length} data points</span>
      </div>
      {data.length === 0 ? <EmptyState dark={dark} message="No traffic data in this time window" /> : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={formatted} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gTotal"  x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#5865C5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#5865C5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gAttack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#E8623A" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#E8623A" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="gNormal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22AA6F" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#22AA6F" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(v) => <span style={{ color: tickColor }}>{v}</span>} />
            <Area type="monotone" dataKey="total_events"  name="Total"   stroke="#5865C5" fill="url(#gTotal)"  strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="attack_events" name="Attacks" stroke="#E8623A" fill="url(#gAttack)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="normal_events" name="Normal"  stroke="#22AA6F" fill="url(#gNormal)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
