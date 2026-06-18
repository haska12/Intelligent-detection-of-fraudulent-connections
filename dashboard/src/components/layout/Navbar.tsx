import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Globe, Moon, RefreshCw, Shield, Sun, Wifi, WifiOff } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { AlertItem, HealthData } from '../../services/api'

interface Props {
  health: HealthData | null
  lastUpdated: Date | null
  alertsCount: number
  recentAlerts?: AlertItem[]
}

function DXCLogo({ isDark }: { isDark: boolean }) {
  const [err, setErr] = useState(false)

  if (!err) {
    return (
      <div style={{
        background: 'transparent',
        borderRadius: 0,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
      }}>
        <img
          src="/dxc-logo-png-4x.png"
          alt="DXC Technology"
          style={{ height: 52, objectFit: 'contain', display: 'block', userSelect: 'none' }}
          onError={() => setErr(true)}
        />
      </div>
    )
  }

  return <span style={{ fontWeight: 900, fontSize: 32, color: '#5865C5' }}>DXC</span>
}

export default function Navbar({ health, lastUpdated, alertsCount, recentAlerts = [] }: Props) {
  const { t, i18n } = useTranslation()
  const { isDark, toggle } = useTheme()
  const [showNotif, setShowNotif] = useState(false)
  const online = health?.status === 'ok'

  const bg = isDark ? '#080D1C' : '#F5F7FB'
  const border = isDark ? 'rgba(255,255,255,0.06)' : '#CBD5E1'
  const textPri = isDark ? '#F1F5F9' : '#182033'
  const textMut = isDark ? '#4B5470' : '#7C8A9D'

  const iconBtnStyle: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid transparent',
    cursor: 'pointer',
    color: textMut,
    transition: 'all 0.15s',
  }

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'fr' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('dxc-lang', next)
  }

  return (
    <nav style={{
      minHeight: 94,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 24px',
      background: bg,
      borderBottom: `1px solid ${border}`,
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <DXCLogo isDark={isDark} />
        <div style={{ width: 1, height: 42, background: border }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="#5865C5" />
            <span style={{
              fontSize: 19,
              fontWeight: 850,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(90deg, #5865C5, #E8623A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {t('nav.platform')}
            </span>
          </div>
          <p style={{ fontSize: 11, color: textMut, margin: 0, letterSpacing: '0.13em', textTransform: 'uppercase' }}>
            Real-time UNSW-NB15 fraudulent connection detection
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          padding: '6px 11px',
          borderRadius: 10,
          background: online ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
          color: online ? '#22C55E' : '#EF4444',
          border: `1px solid ${online ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          {online ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: online ? '#22C55E' : '#EF4444',
            animation: 'livePulse 2s ease-in-out infinite',
          }} />
          {t(`status.${online ? 'online' : 'offline'}`)}
        </div>

        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: textMut }}>
            <RefreshCw size={12} />
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        <button style={iconBtnStyle} onClick={toggleLang} title="Toggle language">
          <Globe size={16} />
        </button>

        <button style={{ ...iconBtnStyle, color: isDark ? '#FCD34D' : textMut }} onClick={toggle} title="Toggle theme">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {alertsCount > 0 && (
          <div style={{ position: 'relative' }}>
            <button style={{ ...iconBtnStyle, position: 'relative' }} onClick={() => setShowNotif(v => !v)}>
              <Bell size={16} />
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 17,
                height: 17,
                borderRadius: 999,
                background: '#EF4444',
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {alertsCount > 99 ? '99+' : alertsCount}
              </span>
            </button>

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: 360,
                    zIndex: 999,
                    background: isDark ? '#111827' : '#FAFBFD',
                    border: `1px solid ${border}`,
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.3)' : '0 20px 50px rgba(58,75,108,0.16)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: textPri }}>{t('notifications.title')}</span>
                    <span style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                      {alertsCount} active
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {recentAlerts.slice(0, 5).map((alert, index) => (
                      <div key={`${alert.ts}-${index}`} style={{
                        background: 'rgba(239,68,68,0.08)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}>
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: alert.severity >= 4 ? '#EF4444' : '#F97316',
                          animation: 'livePulse 2s ease-in-out infinite',
                          flexShrink: 0,
                        }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 750, color: alert.severity >= 4 ? '#EF4444' : '#F97316', margin: 0 }}>
                            {alert.predicted_cat} on {alert.proto?.toUpperCase() || 'network'} connection
                          </p>
                          <p style={{ fontSize: 11, color: textMut, margin: 0 }}>
                            Severity {alert.severity}/5 - {alert.ts?.slice(11, 19) || 'live'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </nav>
  )
}
