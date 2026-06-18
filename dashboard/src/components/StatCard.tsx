import { LucideIcon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'orange' | 'green' | 'yellow' | 'purple'
  badge?: string
}

const palette = {
  blue:   { light: { icon: 'text-[#5865C5]', bg: 'bg-[#5865C5]/10', val: 'text-[#5865C5]' }, dark: { icon: 'text-[#7B8FE8]', bg: 'bg-[#5865C5]/15', val: 'text-[#7B8FE8]' } },
  orange: { light: { icon: 'text-[#E8623A]', bg: 'bg-[#E8623A]/10', val: 'text-[#E8623A]' }, dark: { icon: 'text-[#F0845E]', bg: 'bg-[#E8623A]/15', val: 'text-[#F0845E]' } },
  green:  { light: { icon: 'text-[#22AA6F]', bg: 'bg-[#22AA6F]/10', val: 'text-[#22AA6F]' }, dark: { icon: 'text-[#2ECC85]', bg: 'bg-[#22AA6F]/15', val: 'text-[#2ECC85]' } },
  yellow: { light: { icon: 'text-[#D4800A]', bg: 'bg-[#F59E0B]/10', val: 'text-[#D4800A]' }, dark: { icon: 'text-[#F5A623]', bg: 'bg-[#F59E0B]/15', val: 'text-[#F5A623]' } },
  purple: { light: { icon: 'text-[#7B5BC4]', bg: 'bg-[#7B5BC4]/10', val: 'text-[#7B5BC4]' }, dark: { icon: 'text-[#9B7FE0]', bg: 'bg-[#7B5BC4]/15', val: 'text-[#9B7FE0]' } },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color, badge }: Props) {
  const { theme } = useTheme()
  const c = palette[color][theme]

  return (
    <div className="panel rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.015] cursor-default">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-label">{title}</div>
          {badge && <span className="model-badge mt-1 inline-block">{badge}</span>}
        </div>
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
        </div>
      </div>
      <div>
        <div className={`text-3xl font-bold tabular-nums leading-none ${c.val}`}>{value}</div>
        {subtitle && <div className="text-muted text-xs mt-1.5">{subtitle}</div>}
      </div>
    </div>
  )
}
