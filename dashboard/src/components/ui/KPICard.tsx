import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

interface Props {
  title:    string
  subtitle: string
  value:    string | number
  icon:     LucideIcon
  color:    string
  trend?:   number
  badge?:   string
  pulse?:   boolean
}

export default function KPICard({ title, subtitle, value, icon: Icon, color, trend, badge, pulse }: Props) {
  const { isDark } = useTheme()
  const bgEl  = isDark ? '#111827' : '#FFFFFF'
  const textM = isDark ? '#4B5470' : '#94A3B8'
  const textP = isDark ? '#F1F5F9' : '#0F172A'

  return (
    <motion.div
      className="kpi-card"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ backgroundColor: bgEl }}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1">
          <p className="section-label truncate" style={{ color: textM }}>{title}</p>
          {badge && (
            <span className="badge badge-threat mt-1 inline-block">{badge}</span>
          )}
        </div>
        <div className="relative ml-3 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '1A' }}>
          <Icon className="w-5 h-5" style={{ color }} />
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full live-dot"
              style={{ backgroundColor: color }} />
          )}
        </div>
      </div>

      {/* Value */}
      <p className="text-3xl font-bold tabular-nums leading-none mb-2"
        style={{ color }}>
        {value}
      </p>

      {/* Subtitle + trend */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs leading-snug truncate" style={{ color: textM }}>{subtitle}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-bold flex-shrink-0 ${
            trend > 0 ? 'text-red-400' : 'text-green-400'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
    </motion.div>
  )
}
