import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ActivityEvent } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { severityColor, severityBg, fmtTime, fmtBytes } from '../../utils/formatters'
import PanelHeader from '../ui/PanelHeader'

interface Props { data: ActivityEvent[] }

const ENTERPRISE: Record<string, string> = {
  Normal: 'Authorized Traffic', Fuzzers: 'Fuzzing Attack',
  Analysis: 'Traffic Analysis', Backdoors: 'Backdoor Intrusion',
  DoS: 'Denial of Service', Exploits: 'Exploitation Attempt',
  Generic: 'Generic Threat', Reconnaissance: 'Reconnaissance',
  Shellcode: 'Code Injection', Worms: 'Network Worm',
}

const SEV_LABEL: Record<number, string> = {
  0: 'INFO', 1: 'LOW', 2: 'MED', 3: 'HIGH', 4: 'CRIT', 5: 'X-TRM',
}

const COLS = ['Detection Time', 'Classification', 'Protocol', 'Risk Level', 'Outbound', 'Inbound', 'Packets']

export default function ActivityStream({ data }: Props) {
  const { t }      = useTranslation()
  const { isDark } = useTheme()

  const headBg  = isDark ? '#0C1121' : '#EEF3F8'
  const border  = isDark ? 'rgba(255,255,255,0.05)' : '#D9E2EF'
  const rowHov  = isDark ? 'rgba(88,101,197,0.06)' : '#EAF1FF'
  const textMut = isDark ? '#8B95B0' : '#526071'
  const textSoft = isDark ? '#8B95B0' : '#66758A'
  const textPri = isDark ? '#F1F5F9' : '#0F172A'
  const protoC  = isDark ? '#7B8FE8' : '#5865C5'

  return (
    <motion.div className="chart-panel"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
      <PanelHeader
        title={t('charts.activity_stream')}
        subtitle={t('charts.activity_stream_desc')}
        live
        count={`${data.length} events`}
      />

      <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto', borderRadius: 8, border: `1px solid ${border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          {/* Head */}
          <thead>
            <tr style={{ background: headBg }}>
              {COLS.map(col => (
                <th key={col} style={{
                  padding: '10px 14px', textAlign: 'left',
                  color: textMut, fontWeight: 700,
                  fontSize: 10, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderBottom: `1px solid ${border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: textMut }}>
                  {t('table.no_data')}
                </td>
              </tr>
            ) : data.slice(0, 50).map((ev, i) => (
              <motion.tr key={`${ev.ts}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.01, 0.3) }}
                style={{
                  borderBottom: `1px solid ${border}`,
                  cursor: 'default',
                  background: !isDark && i % 2 === 1 ? '#F6F8FC' : 'transparent',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = rowHov)}
                onMouseLeave={e => (e.currentTarget.style.background = !isDark && i % 2 === 1 ? '#F6F8FC' : 'transparent')}>

                {/* Time */}
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: textSoft, fontWeight: 650, whiteSpace: 'nowrap' }}>
                  {fmtTime(ev.ts)}
                </td>

                {/* Classification */}
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {ev.is_attack
                      ? <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '2px 6px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>THREAT</span>
                      : <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', padding: '2px 6px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>SAFE</span>
                    }
                    <span style={{ fontWeight: 600, color: ev.is_attack ? ev.color : textPri }}>
                      {ENTERPRISE[ev.predicted_cat] ?? ev.predicted_cat}
                    </span>
                  </div>
                </td>

                {/* Protocol */}
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: protoC, textTransform: 'uppercase' }}>
                  {ev.proto ?? '—'}
                </td>

                {/* Risk Level */}
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    background: severityBg(ev.severity),
                    color: severityColor(ev.severity),
                    padding: '3px 8px', borderRadius: 6,
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {SEV_LABEL[ev.severity] ?? ev.severity}
                  </span>
                </td>

                {/* Outbound */}
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: textSoft, fontWeight: 650 }}>
                  {fmtBytes(ev.sbytes)}
                </td>

                {/* Inbound */}
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: textSoft, fontWeight: 650 }}>
                  {fmtBytes(ev.dbytes)}
                </td>

                {/* Packets */}
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: textSoft, fontWeight: 650 }}>
                  {(ev.spkts ?? 0) + (ev.dpkts ?? 0)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
