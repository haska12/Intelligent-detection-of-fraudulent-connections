import { useTheme } from '../../context/ThemeContext'
import { Download } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  right?: React.ReactNode
  onExport?: () => void
  live?: boolean
  count?: string
}

export default function PanelHeader({ title, subtitle, right, onExport, live, count }: Props) {
  const { isDark } = useTheme()
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="panel-title">{title}</h3>
          {live && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#E8623A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8623A] live-dot" />
              LIVE
            </div>
          )}
          {count && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${isDark ? 'bg-white/05 text-[#8B95B0]' : 'bg-slate-100 text-slate-500'}`}>
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="panel-subtitle mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {onExport && (
          <button onClick={onExport}
            className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
              isDark
                ? 'border-white/08 text-[#8B95B0] hover:text-white hover:border-white/15'
                : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}>
            <Download className="w-3 h-3" />
            CSV
          </button>
        )}
      </div>
    </div>
  )
}
