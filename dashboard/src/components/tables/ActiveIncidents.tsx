import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { IncidentRow } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { severityColor, severityBg, fmtDateTime, fmtNumber, fmtBytes, exportCSV } from '../../utils/formatters'
import PanelHeader from '../ui/PanelHeader'

interface Props { data: IncidentRow[] }

const ENTERPRISE: Record<string,string> = {
  Normal:'Authorized Traffic',Fuzzers:'Fuzzing Attack',Analysis:'Traffic Analysis',
  Backdoors:'Backdoor Intrusion',DoS:'Denial of Service',Exploits:'Exploitation Attempt',
  Generic:'Generic Threat',Reconnaissance:'Reconnaissance',Shellcode:'Code Injection',
  Worms:'Network Worm',
}

const STATUS_LABELS = ['Active','Investigating','Contained','Monitoring']
const PRIORITY_LABELS = ['Critical','High','Medium','Low']

function statusBadge(sev: number) {
  if (sev >= 4) return { label: 'Active',        cls: 'badge-threat' }
  if (sev >= 3) return { label: 'Investigating', cls: 'badge-warn'   }
  if (sev >= 2) return { label: 'Monitoring',    cls: 'badge-info'   }
  return              { label: 'Contained',      cls: 'badge-safe'   }
}

function priorityLabel(sev: number) {
  if (sev >= 4) return { label: 'Critical', color: '#EF4444' }
  if (sev >= 3) return { label: 'High',     color: '#F97316' }
  if (sev >= 2) return { label: 'Medium',   color: '#EAB308' }
  return              { label: 'Low',       color: '#22C55E' }
}

export default function ActiveIncidents({ data }: Props) {
  const { t }    = useTranslation()
  const { isDark } = useTheme()
  const border   = isDark ? 'rgba(255,255,255,0.05)' : '#EEF2F8'

  return (
    <motion.div className="table-panel" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
      <div className="p-4">
        <PanelHeader
          title={t('table.incidents')}
          subtitle={t('table.incidents_desc')}
          count={`${data.length} active`}
          onExport={() => exportCSV(data.map(r => ({
            incident_id:  r.incident_id,
            threat_type:  ENTERPRISE[r.threat_type] ?? r.threat_type,
            event_count:  r.event_count,
            max_severity: r.max_severity,
            last_seen:    r.last_seen,
            first_seen:   r.first_seen,
            total_bytes:  r.total_bytes,
          })), 'active_incidents')}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {[t('table.incident_id'), t('table.threat_type'), t('table.status'), t('table.event_count'), t('table.risk_score'), t('table.last_seen'), 'Priority', 'Volume'].map(h => (
                <th key={h} className="table-header text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 panel-subtitle">{t('table.no_data')}</td></tr>
            ) : data.map((row, i) => {
              const { label: stLabel, cls: stCls } = statusBadge(row.max_severity)
              const { label: prLabel, color: prColor } = priorityLabel(row.max_severity)
              return (
                <motion.tr key={row.incident_id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="table-row" style={{ borderBottom: `1px solid ${border}` }}>
                  <td className={`py-2.5 px-3 font-mono font-semibold text-[11px] ${isDark ? 'text-[#7B8FE8]' : 'text-[#5865C5]'}`}>
                    {row.incident_id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[11px]" style={{ color: row.color }}>
                    {ENTERPRISE[row.threat_type] ?? row.threat_type}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${stCls}`}>{stLabel}</span>
                  </td>
                  <td className={`py-2.5 px-3 tabular-nums font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                    {fmtNumber(row.event_count)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="sev-chip font-bold text-[10px]"
                      style={{ backgroundColor: severityBg(row.max_severity), color: severityColor(row.max_severity) }}>
                      {row.max_severity}/5
                    </span>
                  </td>
                  <td className="py-2.5 px-3 panel-subtitle tabular-nums">{fmtDateTime(row.last_seen)}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-bold" style={{ color: prColor }}>{prLabel}</span>
                  </td>
                  <td className="py-2.5 px-3 panel-subtitle tabular-nums">{fmtBytes(row.total_bytes)}</td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
