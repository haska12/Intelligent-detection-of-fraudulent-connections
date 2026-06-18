import { useState } from 'react'
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react'
import { AlertItem } from '../api/client'
import { useTheme } from '../context/ThemeContext'

interface Props { data: AlertItem[] }

const SEV_COLOR: Record<number, string> = { 0:'#9098BB', 1:'#22AA6F', 2:'#F5A623', 3:'#E8623A', 4:'#DC2626', 5:'#991B1B' }
const CAT_COLOR: Record<string, string> = {
  Normal:'#22AA6F', Fuzzers:'#E8623A', Analysis:'#5865C5', Backdoors:'#7B5BC4',
  DoS:'#DC2626', Exploits:'#B91C1C', Generic:'#9098BB', Reconnaissance:'#F5A623',
  Shellcode:'#EC4899', Worms:'#FF6B35',
}

function fmtBytes(b: number) {
  if (!b) return '0'
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)}M`
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)}K`
  return `${b}`
}

type SortKey = keyof AlertItem

const COLS: { key: string; label: string }[] = [
  { key:'ts',            label:'TIMESTAMP'  },
  { key:'predicted_cat', label:'CATEGORY'   },
  { key:'proto',         label:'PROTO'      },
  { key:'service',       label:'SERVICE'    },
  { key:'state',         label:'STATE'      },
  { key:'severity',      label:'SEV'        },
  { key:'sbytes',        label:'SRC BYTES'  },
  { key:'dbytes',        label:'DST BYTES'  },
  { key:'spkts',         label:'SPKTS'      },
  { key:'dpkts',         label:'DPKTS'      },
]

export default function AlertsTable({ data }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [sortKey, setSortKey]     = useState<SortKey>('ts')
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('desc')
  const [page, setPage]           = useState(0)
  const PAGE = 15

  const categories = ['all', ...Array.from(new Set(data.map(d => d.predicted_cat))).sort()]

  const filtered = data
    .filter(d => {
      const matchCat = catFilter === 'all' || d.predicted_cat === catFilter
      const q = search.toLowerCase()
      const matchQ = !q || [d.predicted_cat, d.proto, d.service, d.state].some(v => v?.toLowerCase().includes(q))
      return matchCat && matchQ
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? ''
      return av < bv ? (sortDir === 'asc' ? -1 : 1) : av > bv ? (sortDir === 'asc' ? 1 : -1) : 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const paged = filtered.slice(page * PAGE, (page + 1) * PAGE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(0)
  }

  const borderCls = dark ? 'border-[#1F2340]' : 'border-[#E4E8F0]'
  const btnCls = `px-3 py-1 rounded-lg border text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'border-[#1F2340] text-[#6B7194] hover:border-[#5865C5] hover:text-white' : 'border-[#E4E8F0] text-[#6B7194] hover:border-[#5865C5] hover:text-[#1A1F36]'}`

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Alerts Log</h2>
          <p className="text-muted text-xs mt-0.5">{filtered.length.toLocaleString()} records · {totalPages} pages</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} placeholder="Search…"
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="input-field rounded-lg pl-8 pr-3 py-1.5 text-xs w-36" />
          </div>
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(0) }}
              className="select-field border rounded-lg pl-8 pr-4 py-1.5 text-xs appearance-none cursor-pointer">
              {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={`overflow-x-auto rounded-xl border ${borderCls}`}>
        <table className="w-full text-xs">
          <thead>
            <tr>
              {COLS.map(col => (
                <th key={col.key} onClick={() => toggleSort(col.key as SortKey)}
                  className={`tbl-head text-left py-2.5 px-3 font-semibold tracking-wider cursor-pointer select-none whitespace-nowrap border-b ${borderCls} hover:text-[#5865C5] transition-colors`}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key
                      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-[#5865C5]" /> : <ChevronDown className="w-3 h-3 text-[#5865C5]" />
                      : <ChevronUp className="w-3 h-3 opacity-20" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-muted">No matching records</td></tr>
            ) : paged.map((row, i) => (
              <tr key={i} className={`tbl-row border-t transition-colors ${dark ? 'border-[#1F2340]/40' : 'border-[#F2F4F8]'}`}>
                <td className="py-2 px-3 tabular-nums whitespace-nowrap text-muted">{row.ts?.slice(0, 19)}</td>
                <td className="py-2 px-3 font-semibold" style={{ color: CAT_COLOR[row.predicted_cat] ?? '#9098BB' }}>{row.predicted_cat}</td>
                <td className={`py-2 px-3 uppercase font-mono font-semibold ${dark ? 'text-[#7B8FE8]' : 'text-[#5865C5]'}`}>{row.proto ?? '—'}</td>
                <td className="py-2 px-3 text-muted">{row.service || '—'}</td>
                <td className="py-2 px-3 text-muted">{row.state || '—'}</td>
                <td className="py-2 px-3">
                  <span className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                    style={{ backgroundColor: (SEV_COLOR[row.severity] ?? '#9098BB') + '20', color: SEV_COLOR[row.severity] ?? '#9098BB' }}>
                    {row.severity}
                  </span>
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-muted">{fmtBytes(row.sbytes)}</td>
                <td className="py-2 px-3 text-right tabular-nums text-muted">{fmtBytes(row.dbytes)}</td>
                <td className="py-2 px-3 text-right tabular-nums text-muted">{row.spkts ?? '—'}</td>
                <td className="py-2 px-3 text-right tabular-nums text-muted">{row.dpkts ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Showing {Math.min(page * PAGE + 1, filtered.length)}–{Math.min((page + 1) * PAGE, filtered.length)} of {filtered.length.toLocaleString()}</span>
        <div className="flex gap-1.5">
          <button className={btnCls} onClick={() => setPage(0)} disabled={page === 0}>«</button>
          <button className={btnCls} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Prev</button>
          <button className={btnCls} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</button>
          <button className={btnCls} onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>»</button>
        </div>
      </div>
    </div>
  )
}
