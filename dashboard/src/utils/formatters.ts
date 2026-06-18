export const fmtNumber = (n: number) => n?.toLocaleString() ?? '—'

export const fmtBytes = (b: number): string => {
  if (!b || b === 0) return '0 B'
  if (b >= 1e9) return `${(b / 1e9).toFixed(2)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(2)} MB`
  if (b >= 1e3) return `${(b / 1e3).toFixed(1)} KB`
  return `${b} B`
}

export const fmtMs = (ms: number): string => {
  if (!ms) return '—'
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${ms.toFixed(1)}ms`
}

export const fmtPct = (n: number, dec = 1): string =>
  n != null ? `${n.toFixed(dec)}%` : '—'

export const fmtTime = (ts: string): string => {
  if (!ts) return '—'
  return ts.slice(11, 19)
}

export const fmtDateTime = (ts: string): string => {
  if (!ts) return '—'
  return ts.replace('T', ' ').slice(0, 19)
}

export const fmtHour = (h: number): string => {
  const period = h >= 12 ? 'PM' : 'AM'
  const hour   = h % 12 || 12
  return `${hour}${period}`
}

export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DOW_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export const severityColor = (s: number): string => {
  if (s >= 5) return '#991B1B'
  if (s >= 4) return '#EF4444'
  if (s >= 3) return '#F97316'
  if (s >= 2) return '#EAB308'
  if (s >= 1) return '#22C55E'
  return '#6B7280'
}

export const severityBg = (s: number): string => {
  if (s >= 5) return 'rgba(153,27,27,0.2)'
  if (s >= 4) return 'rgba(239,68,68,0.15)'
  if (s >= 3) return 'rgba(249,115,22,0.15)'
  if (s >= 2) return 'rgba(234,179,8,0.15)'
  if (s >= 1) return 'rgba(34,197,94,0.15)'
  return 'rgba(107,114,128,0.15)'
}

export const threatIndexColor = (v: number): string => {
  if (v >= 80) return '#EF4444'
  if (v >= 60) return '#F97316'
  if (v >= 40) return '#EAB308'
  if (v >= 20) return '#3B82F6'
  return '#22C55E'
}

export const exportCSV = <T extends object>(rows: T[], filename: string): void => {
  if (!rows.length) return
  const headers = Object.keys(rows[0]) as Array<keyof T>
  const csv = [headers.join(','), ...rows.map(r =>
    headers.map(h => JSON.stringify(r[h] ?? '')).join(',')
  )].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `${filename}_${Date.now()}.csv`
  a.click(); URL.revokeObjectURL(url)
}
