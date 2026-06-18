import { useTranslation } from 'react-i18next'
import { LayoutDashboard, ShieldAlert, BrainCircuit, ScrollText, AlertTriangle } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export type Page = 'overview' | 'threats' | 'analytics' | 'activity' | 'incidents'

const LINKS: { key: Page; icon: React.ElementType; badge?: string }[] = [
  { key: 'overview',  icon: LayoutDashboard },
  { key: 'threats',   icon: ShieldAlert      },
  { key: 'analytics', icon: BrainCircuit     },
  { key: 'incidents', icon: AlertTriangle    },
  { key: 'activity',  icon: ScrollText       },
]

interface Props { active: Page; onChange: (p: Page) => void }

export default function Sidebar({ active, onChange }: Props) {
  const { t }      = useTranslation()
  const { isDark } = useTheme()

  const bg      = isDark ? '#080D1C' : '#FFFFFF'
  const border  = isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F4'
  const textMut = isDark ? '#3A4060' : '#CBD5E1'

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      background: bg,
      borderRight: `1px solid ${border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      zIndex: 40,
    }}>
      {/* Top spacer for navbar */}
      <div style={{ height: 56, borderBottom: `1px solid ${border}`, flexShrink: 0 }} />

      {/* Section label */}
      <div style={{ padding: '20px 16px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: textMut }}>
          {t('nav.overview')}
        </p>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {LINKS.map(({ key, icon: Icon }) => {
          const isActive = active === key
          const itemBg   = isActive
            ? (isDark ? 'rgba(88,101,197,0.20)' : 'rgba(88,101,197,0.10)')
            : 'transparent'
          const itemColor = isActive
            ? (isDark ? '#7B8FE8' : '#5865C5')
            : (isDark ? '#6B7194' : '#64748B')

          return (
            <button key={key} onClick={() => onChange(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: itemBg, color: itemColor,
                fontSize: 13, fontWeight: isActive ? 600 : 500,
                border: 'none', cursor: 'pointer',
                textAlign: 'left', width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span>{t(`nav.${key}`)}</span>
              {key === 'activity' && (
                <span style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: '#22C55E',
                  animation: 'livePulse 2s ease-in-out infinite',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '16px', borderTop: `1px solid ${border}` }}>
        <div style={{ fontSize: 10, color: textMut, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, letterSpacing: '0.06em' }}>DXC Technology</div>
          <div>Cyber Intelligence Platform</div>
          <div>v2.0 · Enterprise Edition</div>
        </div>
      </div>
    </aside>
  )
}
