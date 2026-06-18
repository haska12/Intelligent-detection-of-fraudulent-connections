import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { BarChart2 } from 'lucide-react'

interface Props { message?: string; hint?: string; height?: number }

export default function EmptyState({ message, hint, height = 180 }: Props) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed ${
      isDark ? 'border-white/06 text-[#2A3050]' : 'border-slate-200 text-slate-300'
    }`} style={{ height }}>
      <BarChart2 className="w-7 h-7 opacity-40" />
      <p className="text-sm font-medium">{message ?? t('charts.no_data')}</p>
      <p className="text-xs opacity-60">{hint ?? t('charts.widen_window')}</p>
    </div>
  )
}
