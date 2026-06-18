import { useState } from 'react'
import { Wifi, WifiOff, Sun, Moon, RefreshCw } from 'lucide-react'
import { HealthData } from '../api/client'
import { useTheme } from '../context/ThemeContext'

interface Props {
  health: HealthData | null
  error: string | null
  lastUpdated: Date | null
  timeWindow: number
  onTimeWindowChange: (h: number) => void
}

const TIME_OPTIONS = [
  { label: '1h', value: 1 }, { label: '2h', value: 2 }, { label: '6h', value: 6 },
  { label: '24h', value: 24 }, { label: '7d', value: 168 }, { label: '30d', value: 720 },
  { label: 'ALL', value: 99999 },
]

export default function Header({ health, error, lastUpdated, timeWindow, onTimeWindowChange }: Props) {
  const { theme, toggle } = useTheme()
  const [logoError, setLogoError] = useState(false)
  const online = !error && health?.status === 'ok'
  const dark = theme === 'dark'

  const bgPill = dark
    ? 'bg-[#0D0F1C] border-[#1F2340]'
    : 'bg-[#F2F4F8] border-[#E4E8F0]'

  return (
    <header className="panel rounded-xl px-5 py-3 flex items-center justify-between gap-4 mb-5 overflow-hidden relative">
      {/* DXC gradient top accent bar */}
      <div className="dxc-accent-bar absolute top-0 left-0 right-0" />

      {/* Logo + brand */}
      <div className="flex items-center gap-4 min-w-0 pt-0.5">
        {/* Real DXC logo — user saves to dashboard/public/dxc-logo.png */}
        {!logoError ? (
          <img
            src="/dxc-logo.png"
            alt="DXC Technology"
            className="h-10 w-auto object-contain flex-shrink-0"
            onError={() => setLogoError(true)}
          />
        ) : (
          /* Fallback SVG gradient mark if PNG not found */
          <svg width="52" height="34" viewBox="0 0 156 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="156" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#7B8FE8"/>
                <stop offset="48%"  stopColor="#E8A87C"/>
                <stop offset="100%" stopColor="#E8623A"/>
              </linearGradient>
            </defs>
            {/* D */}
            <rect x="0"  y="8"  width="36" height="9" rx="4.5" fill="url(#lg)"/>
            <rect x="0"  y="83" width="36" height="9" rx="4.5" fill="url(#lg)"/>
            <path d="M2 17 Q2 70 26 70 L36 70 L36 61 L26 61 Q11 61 11 17Z" fill="url(#lg)"/>
            {/* X */}
            <path d="M58 8 L78 50 L98 8"  stroke="url(#lg)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M58 92 L78 50 L98 92" stroke="url(#lg)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            {/* C */}
            <rect x="120" y="8"  width="36" height="9" rx="4.5" fill="url(#lg)"/>
            <rect x="120" y="83" width="36" height="9" rx="4.5" fill="url(#lg)"/>
            <path d="M154 17 Q154 70 130 70 L120 70 L120 61 L130 61 Q145 61 145 17Z" fill="url(#lg)"/>
          </svg>
        )}

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight dxc-gradient-text leading-none">
              DXC Detection
            </h1>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
              dark ? 'border-[#1F2340] text-[#6B7194]' : 'border-[#E4E8F0] text-[#9098BB]'
            }`}>IDS v1.0</span>
          </div>
          <p className="text-label mt-0.5 text-[10px] leading-none">
            UNSW-NB15 · Real-Time Intrusion Detection System
          </p>
        </div>
      </div>

      {/* Center — total event counters */}
      {health && (
        <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
          <div className="text-center">
            <div className={`text-xl font-bold tabular-nums ${dark ? 'text-white' : 'text-[#1A1F36]'}`}>
              {health.total_events.toLocaleString()}
            </div>
            <div className="text-label text-[10px]">Total Events</div>
          </div>
          <div className="divider w-px h-8" />
          <div className="text-center">
            <div className="text-xl font-bold tabular-nums text-[#E8623A]">
              {health.total_alerts.toLocaleString()}
            </div>
            <div className="text-label text-[10px]">Total Alerts</div>
          </div>
        </div>
      )}

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        {/* Time window pills */}
        <div className={`flex items-center gap-0.5 rounded-lg p-1 border ${bgPill}`}>
          {TIME_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => onTimeWindowChange(o.value)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                timeWindow === o.value ? 'tw-pill-active' : 'tw-pill'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title="Toggle theme"
          className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
            dark
              ? 'border-[#1F2340] text-yellow-400 hover:border-yellow-400/40'
              : 'border-[#E4E8F0] text-[#5865C5] hover:border-[#5865C5]/50'
          }`}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Online/offline badge */}
        <div className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border ${
          online
            ? 'bg-green-500/10 text-green-600 border-green-500/25'
            : 'bg-red-500/10 text-red-500 border-red-500/25'
        }`}>
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className={`w-1.5 h-1.5 rounded-full status-dot ${online ? 'bg-green-500' : 'bg-red-500'}`} />
          {online ? 'ONLINE' : 'OFFLINE'}
        </div>

        {/* Last updated clock */}
        {lastUpdated && (
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-muted tabular-nums">
            <RefreshCw className="w-3 h-3" />
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>
    </header>
  )
}
