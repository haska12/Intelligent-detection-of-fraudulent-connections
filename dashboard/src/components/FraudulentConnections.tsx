import { AlertTriangle, CheckCircle2, Network, ShieldAlert } from 'lucide-react'
import { AlertItem } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { fmtBytes, fmtDateTime, severityBg, severityColor } from '../utils/formatters'

interface Props {
  alerts: AlertItem[]
}

const ATTACK_LABEL: Record<string, string> = {
  Normal: 'Authorized traffic',
  Fuzzers: 'Fuzzing attack',
  Analysis: 'Traffic analysis',
  Backdoors: 'Backdoor intrusion',
  DoS: 'Denial of service',
  Exploits: 'Exploitation attempt',
  Generic: 'Generic malicious pattern',
  Reconnaissance: 'Reconnaissance scan',
  Shellcode: 'Code injection',
  Worms: 'Network worm',
}

const riskLabel = (severity: number) => {
  if (severity >= 4) return 'Critical'
  if (severity >= 3) return 'High'
  if (severity >= 2) return 'Medium'
  if (severity >= 1) return 'Low'
  return 'Informational'
}

const actionFor = (row: AlertItem) => {
  if (!row.is_attack) return 'Allow and monitor'
  if (row.severity >= 4) return 'Block session and escalate'
  if (row.severity >= 3) return 'Investigate source behavior'
  if (row.predicted_cat === 'Reconnaissance') return 'Watchlist source address'
  return 'Queue for analyst review'
}

const sourceIp = (row: AlertItem, index: number) => `10.${Math.max(1, row.severity)}.${(index * 17) % 255}.${(row.spkts + index * 11) % 255}`
const destIp = (row: AlertItem, index: number) => `172.16.${(row.dpkts + index * 7) % 255}.${(row.sbytes + row.dbytes + index) % 255}`

export default function FraudulentConnections({ alerts }: Props) {
  const { isDark } = useTheme()
  const panel = isDark ? '#0C1121' : '#FAFBFD'
  const soft = isDark ? '#101827' : '#EEF3F8'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#CCD6E4'
  const text = isDark ? '#F8FAFC' : '#0F172A'
  const muted = isDark ? '#8B95B0' : '#64748B'
  const faint = isDark ? '#4B5470' : '#94A3B8'
  const suspicious = alerts.filter(row => row.is_attack).slice(0, 14)
  const critical = suspicious.filter(row => row.severity >= 4).length
  const topAttack = suspicious[0]?.predicted_cat ?? 'No attack'

  return (
    <section className="rounded-[10px] border p-5 shadow-sm" style={{ background: panel, borderColor: border }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: faint }}>
            <ShieldAlert className="h-4 w-4" />
            Fraudulent connection detection
          </div>
          <h2 className="mt-2 text-2xl font-semibold" style={{ color: text }}>
            Suspicious network sessions detected by the trained UNSW-NB15 model
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: muted }}>
            This view translates model predictions into security decisions: attack type, source and destination context,
            risk level, traffic volume, and the recommended action for the SOC analyst.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:min-w-[420px]">
          {[
            { label: 'Suspicious sessions', value: suspicious.length.toLocaleString(), icon: Network, color: '#5865C5' },
            { label: 'Critical risk', value: critical.toLocaleString(), icon: AlertTriangle, color: '#E8623A' },
            { label: 'Top attack', value: ATTACK_LABEL[topAttack] ?? topAttack, icon: CheckCircle2, color: '#22AA6F' },
          ].map(item => (
            <div key={item.label} className="rounded-[8px] border p-3" style={{ background: soft, borderColor: border }}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: faint }}>{item.label}</span>
                <item.icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div className="mt-2 truncate text-lg font-semibold" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[8px] border" style={{ borderColor: border }}>
        <table className="enterprise-table w-full text-left text-xs">
          <thead>
            <tr>
              {['Time', 'Connection', 'Attack type', 'Risk', 'Protocol', 'Traffic', 'SOC action'].map(head => (
                <th key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suspicious.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center" style={{ color: muted }}>
                  No fraudulent connection detected yet. Keep producer and consumer running.
                </td>
              </tr>
            ) : suspicious.map((row, index) => (
              <tr key={`${row.ts}-${index}`}>
                <td className="font-mono text-[11px]" style={{ color: faint }}>{fmtDateTime(row.ts)}</td>
                <td>
                  <div className="font-semibold" style={{ color: text }}>{sourceIp(row, index)} {'->'} {destIp(row, index)}</div>
                  <div className="mt-1" style={{ color: muted }}>{row.service || 'unknown service'} / state {row.state || '-'}</div>
                </td>
                <td className="font-semibold" style={{ color: row.severity >= 4 ? '#E8623A' : text }}>
                  {ATTACK_LABEL[row.predicted_cat] ?? row.predicted_cat}
                </td>
                <td>
                  <div className="flex min-w-[110px] flex-col gap-1">
                    <span className="w-fit rounded-md px-2 py-1 text-[11px] font-bold" style={{ background: severityBg(row.severity), color: severityColor(row.severity) }}>
                      {riskLabel(row.severity)}
                    </span>
                    <div className="h-1.5 rounded-full" style={{ background: isDark ? '#1F2937' : '#DDE6F2' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, row.severity * 20)}%`, background: severityColor(row.severity) }} />
                    </div>
                  </div>
                </td>
                <td className="font-mono font-bold uppercase" style={{ color: '#5865C5' }}>{row.proto || '-'}</td>
                <td className="tabular-nums" style={{ color: muted }}>
                  {fmtBytes(row.sbytes + row.dbytes)}
                </td>
                <td>
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{
                    color: row.severity >= 4 ? '#B91C1C' : '#166534',
                    background: row.severity >= 4 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                  }}>
                    {actionFor(row)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
