import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { SeverityPoint } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from './TimeSeriesChart'

interface Props { data: SeverityPoint[] }

const SEV_LABELS: Record<number, string> = { 0:'None', 1:'Low', 2:'Medium', 3:'High', 4:'Critical', 5:'Extreme' }
const SEV_COLORS: Record<number, string> = { 0:'#9098BB', 1:'#22AA6F', 2:'#F5A623', 3:'#E8623A', 4:'#DC2626', 5:'#991B1B' }

export default function SeverityChart({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'
  const tickColor = dark ? '#6B7194' : '#9098BB'

  const radarData = data.map(d => ({
    severity: SEV_LABELS[d.severity] ?? `Sev ${d.severity}`,
    Events: d.event_count, Attacks: d.attack_count,
  }))

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3">
      <h2 className="section-title">Severity Distribution</h2>
      {data.length === 0 ? <EmptyState dark={dark} message="No severity data" /> : (
        <>
          <ResponsiveContainer width="100%" height={195}>
            <RadarChart data={radarData} cx="50%" cy="50%">
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis dataKey="severity" tick={{ fill: tickColor, fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: tickColor, fontSize: 9 }} />
              <Radar name="Events"  dataKey="Events"  stroke="#5865C5" fill="#5865C5" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Attacks" dataKey="Attacks" stroke="#E8623A" fill="#E8623A" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ background: dark ? '#141626' : '#fff', border: `1px solid ${dark ? '#1F2340' : '#E4E8F0'}`, borderRadius: 10, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5">
            {data.map(d => (
              <div key={d.severity} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border"
                style={{ borderColor: SEV_COLORS[d.severity] + '40', backgroundColor: SEV_COLORS[d.severity] + '14' }}>
                <span style={{ color: SEV_COLORS[d.severity] }}>{SEV_LABELS[d.severity]}</span>
                <span className="text-muted">{Number(d.event_count).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
