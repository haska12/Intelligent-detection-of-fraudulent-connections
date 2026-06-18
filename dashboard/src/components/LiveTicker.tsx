import { AlertTriangle } from 'lucide-react'
import { LiveTickerItem } from '../api/client'
import { useTheme } from '../context/ThemeContext'

interface Props { data: LiveTickerItem[] }

const SEV_LABEL: Record<number, string> = { 0:'NONE', 1:'LOW', 2:'MED', 3:'HIGH', 4:'CRIT', 5:'X-TRM' }
const SEV_COLOR: Record<number, string> = { 0:'#9098BB', 1:'#22AA6F', 2:'#F5A623', 3:'#E8623A', 4:'#DC2626', 5:'#991B1B' }

function fmtBytes(b: number) {
  if (!b) return '—'
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)}M`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)}K`
  return `${b}`
}

export default function LiveTicker({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3" style={{ height: 320 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#E8623A]" />
          <h2 className="section-title">Live Attack Ticker</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#E8623A]">
          <span className="w-2 h-2 rounded-full bg-[#E8623A] status-dot" />
          LIVE
        </div>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-xs">
          <thead className={`sticky top-0 tbl-head`}>
            <tr>
              {['TIME', 'CATEGORY', 'PROTO', 'SEV', 'SRC', 'DST'].map(h => (
                <th key={h} className={`text-left py-2 px-2 font-semibold tracking-wider border-b ${dark ? 'border-[#1F2340]' : 'border-[#EEF0F8]'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-muted">No attacks detected</td></tr>
            ) : data.map((item, i) => (
              <tr key={i} className={`tbl-row border-t transition-colors ${dark ? 'border-[#1F2340]/50' : 'border-[#F2F4F8]'}`}>
                <td className="py-1.5 px-2 tabular-nums text-muted">{item.ts?.slice(11, 19) ?? '—'}</td>
                <td className="py-1.5 px-2 font-semibold" style={{ color: item.color }}>{item.category}</td>
                <td className={`py-1.5 px-2 uppercase font-mono font-semibold ${dark ? 'text-[#7B8FE8]' : 'text-[#5865C5]'}`}>{item.protocol ?? '—'}</td>
                <td className="py-1.5 px-2">
                  <span className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                    style={{ backgroundColor: (SEV_COLOR[item.severity] ?? '#9098BB') + '20', color: SEV_COLOR[item.severity] ?? '#9098BB' }}>
                    {SEV_LABEL[item.severity] ?? item.severity}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums text-muted">{fmtBytes(item.source_bytes)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums text-muted">{fmtBytes(item.dest_bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
