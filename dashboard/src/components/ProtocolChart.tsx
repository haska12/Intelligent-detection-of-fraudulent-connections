import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { ProtocolPoint } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from './TimeSeriesChart'

interface Props { data: ProtocolPoint[] }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as ProtocolPoint
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl space-y-1">
      <p className="font-bold text-[#5865C5] mb-1">{label}</p>
      <p className="text-muted">Total flows: <span className="font-semibold">{Number(d.total_flows).toLocaleString()}</span></p>
      <p className="text-muted">Attack flows: <span className="font-semibold text-[#E8623A]">{Number(d.attack_flows).toLocaleString()}</span></p>
      <p className="text-muted">Total bytes: <span className="font-semibold">{(d.total_bytes / 1e6).toFixed(2)} MB</span></p>
    </div>
  )
}

const DXC_BLUES = ['#5865C5','#6572CC','#727ED2','#7F8BD8','#8C97DF','#99A3E5','#A6AFEB','#B3BBF2','#C0C7F8','#CDD3FF','#D9DFFF','#E6ECFF']

export default function ProtocolChart({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tickColor = dark ? '#6B7194' : '#9098BB'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'
  const top = data.slice(0, 12)

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Top Protocols</h2>
        <span className="text-muted text-xs">{data.length} protocols</span>
      </div>
      {data.length === 0 ? <EmptyState dark={dark} message="No protocol data" /> : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="protocol" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={(v) => <span style={{ color: tickColor }}>{v}</span>} />
            <Bar dataKey="total_flows" name="Total Flows" radius={[4, 4, 0, 0]}>
              {top.map((_, i) => <Cell key={i} fill={DXC_BLUES[i % DXC_BLUES.length]} />)}
            </Bar>
            <Bar dataKey="attack_flows" name="Attack Flows" fill="#E8623A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
