import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HeatmapPoint, TimeSeriesPoint } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import PanelHeader from '../ui/PanelHeader'

interface Props {
  data: HeatmapPoint[]          // depuis /api/heatmap (si disponible)
  fallback?: TimeSeriesPoint[]  // depuis /api/timeseries (toujours disponible)
}

const HOURS    = Array.from({ length: 24 }, (_, i) => i)
const DAYS_IDX = [0, 1, 2, 3, 4, 5, 6]
const DOW_EN   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DOW_FR   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function cellColor(intensity: number, isDark: boolean): string {
  if (intensity <= 0)    return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'
  if (intensity < 0.15)  return isDark ? 'rgba(88,101,197,0.30)'  : 'rgba(88,101,197,0.22)'
  if (intensity < 0.35)  return isDark ? 'rgba(88,101,197,0.55)'  : 'rgba(88,101,197,0.42)'
  if (intensity < 0.55)  return isDark ? 'rgba(249,115,22,0.65)'  : 'rgba(249,115,22,0.58)'
  if (intensity < 0.75)  return isDark ? 'rgba(239,68,68,0.78)'   : 'rgba(239,68,68,0.72)'
  return                                 isDark ? 'rgba(239,68,68,0.97)'   : 'rgba(185,28,28,0.94)'
}

export default function ThreatHeatmap({ data, fallback = [] }: Props) {
  const { t, i18n } = useTranslation()
  const { isDark }  = useTheme()
  const DOW  = i18n.language === 'fr' ? DOW_FR : DOW_EN
  const tick = isDark ? '#4B5470' : '#94A3B8'

  // ── Calcul de la grille ──────────────────────────────────────────────────
  // Priorité 1 : données de /api/heatmap
  // Priorité 2 : dériver depuis les données timeseries (toujours disponibles)
  const lookup = useMemo(() => {
    const map: Record<string, { attacks: number; total: number }> = {}

    if (data.length > 0) {
      // Utilise les données heatmap si disponibles
      data.forEach(r => {
        map[`${r.dow}-${r.hour}`] = { attacks: r.attacks, total: r.total }
      })
    } else if (fallback.length > 0) {
      // Dérive depuis timeseries : ts_minute = "2026-05-18T10:30"
      fallback.forEach(point => {
        try {
          const dt = new Date(point.ts_minute)
          const hour = dt.getHours()
          const dow  = dt.getDay()
          const key  = `${dow}-${hour}`
          const existing = map[key] ?? { attacks: 0, total: 0 }
          map[key] = {
            attacks: existing.attacks + (point.attack_events ?? 0),
            total:   existing.total   + (point.total_events  ?? 0),
          }
        } catch { /* ignore bad timestamps */ }
      })
    }

    return map
  }, [data, fallback])

  const maxAttacks = useMemo(() => {
    const vals = Object.values(lookup).map(v => v.attacks)
    return Math.max(...vals, 1)
  }, [lookup])

  const hasData = Object.keys(lookup).length > 0
  const source  = data.length > 0 ? 'live' : fallback.length > 0 ? 'derived' : 'empty'

  return (
    <motion.div
      className="chart-panel h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <PanelHeader
        title={t('charts.threat_heatmap')}
        subtitle={t('charts.threat_heatmap_desc')}
        right={
          source === 'derived' ? (
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: '#F59E0B',
              background: 'rgba(245,158,11,0.12)',
              padding: '2px 8px', borderRadius: 20,
            }}>
              Computed from timeline
            </span>
          ) : source === 'live' ? (
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: '#22C55E',
              background: 'rgba(34,197,94,0.12)',
              padding: '2px 8px', borderRadius: 20,
            }}>
              Live
            </span>
          ) : null
        }
      />

      {!hasData ? (
        /* Message d'aide actionnable */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 8, height: 220,
          color: tick, fontSize: 13,
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
          </svg>
          <p style={{ margin: 0, fontWeight: 600 }}>Heatmap data loading…</p>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.6 }}>
            Restart FastAPI to activate live heatmap endpoint
          </p>
          <code style={{
            fontSize: 10, padding: '4px 10px', borderRadius: 6, marginTop: 4,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#7B8FE8' : '#5865C5',
          }}>
            uvicorn api.main:app --port 8000 --reload
          </code>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>

          {/* Labels heures */}
          <div style={{ display: 'flex', marginLeft: 44, marginBottom: 4 }}>
            {HOURS.map(h => (
              <div key={h} style={{
                width: 26, flexShrink: 0, textAlign: 'center',
                color: tick, fontSize: 9, fontWeight: 600,
              }}>
                {h % 4 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* Grille jours × heures */}
          {DAYS_IDX.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
              {/* Label jour */}
              <div style={{
                width: 40, flexShrink: 0, textAlign: 'right', paddingRight: 8,
                color: tick, fontSize: 11, fontWeight: 700,
              }}>
                {DOW[d]}
              </div>

              {/* Cellules */}
              <div style={{ display: 'flex', gap: 3 }}>
                {HOURS.map(h => {
                  const cell      = lookup[`${d}-${h}`]
                  const attacks   = cell?.attacks ?? 0
                  const total     = cell?.total   ?? 0
                  const intensity = attacks / maxAttacks
                  const bg        = cellColor(intensity, isDark)

                  return (
                    <div
                      key={h}
                      title={`${DOW[d]} ${String(h).padStart(2, '0')}:00\n${attacks.toLocaleString()} threats · ${total.toLocaleString()} events`}
                      style={{
                        width: 26, height: 22,
                        backgroundColor: bg,
                        borderRadius: 4,
                        cursor: 'default',
                        transition: 'transform 0.12s',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.3)'; (e.currentTarget as HTMLElement).style.zIndex = '10' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)';   (e.currentTarget as HTMLElement).style.zIndex = '1' }}
                    />
                  )
                })}
              </div>
            </div>
          ))}

          {/* Légende */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, marginLeft: 44 }}>
            <span style={{ color: tick, fontSize: 10, fontWeight: 600 }}>Low</span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
              <div key={v} style={{
                width: 22, height: 11, borderRadius: 3,
                backgroundColor: cellColor(v, isDark),
              }} />
            ))}
            <span style={{ color: tick, fontSize: 10, fontWeight: 600 }}>Critical</span>
          </div>

        </div>
      )}
    </motion.div>
  )
}
