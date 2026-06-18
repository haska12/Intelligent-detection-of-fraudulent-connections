import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, ChevronUp, ChevronDown, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { AlertItem } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import { severityColor, severityBg, fmtBytes, fmtDateTime, exportCSV } from '../../utils/formatters'
import PanelHeader from '../ui/PanelHeader'

interface Props { data: AlertItem[] }

const ENTERPRISE: Record<string,string> = {
  Normal:'Authorized Traffic',Fuzzers:'Fuzzing Attack',Analysis:'Traffic Analysis',
  Backdoors:'Backdoor Intrusion',DoS:'Denial of Service',Exploits:'Exploitation Attempt',
  Generic:'Generic Threat',Reconnaissance:'Reconnaissance',Shellcode:'Code Injection',
  Worms:'Network Worm',
}
const SEV_LABEL: Record<number,string> = { 0:'Informational',1:'Low',2:'Medium',3:'High',4:'Critical',5:'Extreme' }
type SK = keyof AlertItem

export default function ThreatIntelTable({ data }: Props) {
  const { t }    = useTranslation()
  const { isDark } = useTheme()
  const [search, setSearch]   = useState('')
  const [cat, setCat]         = useState('all')
  const [sk, setSk]           = useState<SK>('ts')
  const [sd, setSd]           = useState<'asc'|'desc'>('desc')
  const [page, setPage]       = useState(0)
  const PAGE = 12

  const cats = useMemo(() => ['all', ...Array.from(new Set(data.map(d => d.predicted_cat))).sort()], [data])

  const filtered = useMemo(() => data
    .filter(d => {
      const mCat = cat === 'all' || d.predicted_cat === cat
      const q = search.toLowerCase()
      const mQ = !q || [d.predicted_cat, d.proto, d.service, d.state].some(v => v?.toLowerCase().includes(q))
      return mCat && mQ
    })
    .sort((a, b) => {
      const av = a[sk] ?? ''; const bv = b[sk] ?? ''
      return av < bv ? (sd === 'asc' ? -1 : 1) : av > bv ? (sd === 'asc' ? 1 : -1) : 0
    }), [data, search, cat, sk, sd])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE)

  function sort(k: SK) {
    if (sk === k) setSd(d => d === 'asc' ? 'desc' : 'asc')
    else { setSk(k); setSd('desc') }
    setPage(0)
  }

  const COLS: { key: SK; label: string; right?: boolean }[] = [
    { key:'ts',            label: t('table.timestamp')       },
    { key:'predicted_cat', label: t('table.threat_category') },
    { key:'proto',         label: t('table.protocol')        },
    { key:'service',       label: t('table.service')         },
    { key:'state',         label: t('table.state')           },
    { key:'severity',      label: t('table.severity')        },
    { key:'sbytes',        label: t('table.outbound'), right: true },
    { key:'dbytes',        label: t('table.inbound'),  right: true },
  ]

  const border = isDark ? 'rgba(255,255,255,0.05)' : '#D5DEEA'
  const inputCls = `ent-input text-[12px] ${isDark ? '' : ''}`
  const btnCls = (dis: boolean) => `px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
    dis ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
  } ${isDark ? 'border-white/08 text-[#8B95B0] hover:text-white hover:border-white/15' : 'border-slate-200 text-slate-500 hover:text-slate-800'}`

  return (
    <motion.div className="table-panel" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
      <div className="p-4">
        <PanelHeader
          title={t('table.threat_intel')}
          subtitle={t('table.threat_intel_desc')}
          count={`${filtered.length.toLocaleString()} ${t('table.records')}`}
          onExport={() => exportCSV(filtered.map(r => ({
            timestamp:    r.ts,
            classification: ENTERPRISE[r.predicted_cat] ?? r.predicted_cat,
            protocol:     r.proto,
            service:      r.service,
            state:        r.state,
            risk_score:   r.severity,
            outbound_bytes: r.sbytes,
            inbound_bytes:  r.dbytes,
          })), 'threat_intelligence')}
        />

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#4B5470' : '#94A3B8' }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder={t('table.search')} className={`${inputCls} pl-8 pr-3 py-1.5 w-48`} />
          </div>
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#4B5470' : '#94A3B8' }} />
            <select value={cat} onChange={e => { setCat(e.target.value); setPage(0) }}
              className={`${inputCls} pl-8 pr-3 py-1.5 appearance-none cursor-pointer min-w-[160px]`}>
              <option value="all">{t('table.filter_all')}</option>
              {cats.filter(c => c !== 'all').map(c => (
                <option key={c} value={c}>{ENTERPRISE[c] ?? c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="enterprise-table w-full text-xs">
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.key} onClick={() => sort(col.key)}
                  className={`table-header whitespace-nowrap ${col.right ? 'text-right' : 'text-left'}`}>
                  <div className={`flex items-center gap-1 ${col.right ? 'justify-end' : ''}`}>
                    {col.label}
                    {sk === col.key
                      ? sd === 'asc' ? <ChevronUp className="w-3 h-3 text-[#5865C5]" /> : <ChevronDown className="w-3 h-3 text-[#5865C5]" />
                      : <ChevronUp className="w-3 h-3 opacity-20" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 panel-subtitle">{t('table.no_data')}</td></tr>
            ) : paged.map((row, i) => (
              <tr key={i} className="table-row" style={{ borderBottom: `1px solid ${border}` }}>
                <td className="py-2.5 px-3 tabular-nums font-mono text-[11px]" style={{ color: isDark ? '#4B5470' : '#94A3B8' }}>
                  {fmtDateTime(row.ts)}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    {row.is_attack ? <span className="badge badge-threat">THREAT</span> : <span className="badge badge-safe">SAFE</span>}
                    <span className="font-semibold text-[11px]" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                      {ENTERPRISE[row.predicted_cat] ?? row.predicted_cat}
                    </span>
                  </div>
                </td>
                <td className={`py-2.5 px-3 uppercase font-mono font-bold text-[11px] ${isDark ? 'text-[#7B8FE8]' : 'text-[#5865C5]'}`}>
                  {row.proto ?? '—'}
                </td>
                <td className="py-2.5 px-3 panel-subtitle">{row.service || '—'}</td>
                <td className="py-2.5 px-3 panel-subtitle">{row.state || '—'}</td>
                <td className="py-2.5 px-3">
                  <span className="sev-chip font-bold text-[10px]"
                    style={{ backgroundColor: severityBg(row.severity), color: severityColor(row.severity) }}>
                    {SEV_LABEL[row.severity] ?? row.severity}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums panel-subtitle">{fmtBytes(row.sbytes)}</td>
                <td className="py-2.5 px-3 text-right tabular-nums panel-subtitle">{fmtBytes(row.dbytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={`flex items-center justify-between px-4 py-3 border-t text-xs`} style={{ borderColor: border }}>
        <span className="panel-subtitle">
          {t('table.showing')} {Math.min(page*PAGE+1, filtered.length)}–{Math.min((page+1)*PAGE, filtered.length)} {t('table.of')} {filtered.length.toLocaleString()} {t('table.records')}
        </span>
        <div className="flex gap-1.5">
          {['First','Prev','Next','Last'].map((sym, i) => {
            const dis = i < 2 ? page === 0 : page >= totalPages - 1
            return (
              <button key={sym} disabled={dis} className={btnCls(dis)}
                onClick={() => {
                  if (i===0) setPage(0)
                  else if (i===1) setPage(p => Math.max(0,p-1))
                  else if (i===2) setPage(p => Math.min(totalPages-1,p+1))
                  else setPage(totalPages-1)
                }}>
                {sym}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
