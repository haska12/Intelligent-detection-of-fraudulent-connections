import { useEffect, useMemo, useState } from 'react'
import { Bot, MessageCircle, Send, ShieldAlert, X } from 'lucide-react'
import { AlertItem, KpiSummary, ModelPerformance } from '../services/api'
import { useTheme } from '../context/ThemeContext'

type Page = 'overview' | 'threats' | 'analytics' | 'incidents' | 'activity'

interface Props {
  page: Page
  kpi: KpiSummary | null
  model: ModelPerformance | null
  alerts: AlertItem[]
}

const pageGuide: Record<Page, string> = {
  overview: 'Use this page as the executive summary: threat index, attack trend, main drivers, and what action should be taken first.',
  threats: 'Use this page to review fraudulent connections: source/destination context, attack family, risk level, protocol, traffic volume, and SOC action.',
  analytics: 'Use this page to justify the trained model: algorithm comparison, Random Forest decision, live accuracy, and per-category detection quality.',
  incidents: 'Use this page to prioritize response work. It groups repeated detections into incidents by threat type and severity.',
  activity: 'Use this page when streaming is running. It shows the live detection feed coming from Kafka and the Spark consumer.',
}

export default function DashboardAssistant({ page, kpi, model, alerts }: Props) {
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(pageGuide[page])

  const palette = {
    panel: isDark ? '#111827' : '#FFFFFF',
    soft: isDark ? '#0C1121' : '#F8FAFC',
    border: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
    text: isDark ? '#F8FAFC' : '#0F172A',
    muted: isDark ? '#8B95B0' : '#64748B',
  }

  const context = useMemo(() => {
    const latest = alerts.find(row => row.is_attack)
    return {
      threatIndex: kpi?.threat_index?.toFixed(0) ?? 'not loaded',
      totalEvents: kpi?.total_events?.toLocaleString() ?? 'not loaded',
      alerts: alerts.length.toLocaleString(),
      model: model?.active_model ?? 'Random Forest',
      latestAttack: latest ? `${latest.predicted_cat} severity ${latest.severity}/5 on ${latest.proto?.toUpperCase() || 'network'} traffic` : 'no active attack in latest sample',
      critical: alerts.filter(row => row.is_attack && row.severity >= 4).length,
    }
  }, [alerts, kpi, model])

  useEffect(() => {
    setAnswer(pageGuide[page])
  }, [page])

  const respond = (forcedQuestion?: string) => {
    const q = (forcedQuestion ?? question).toLowerCase()
    if (q.includes('random') || q.includes('model') || q.includes('algorithm')) {
      setAnswer(`${context.model} is selected because it gives the best balance between F1 score and accuracy in your benchmark. Go to Model & Algorithms to show the comparison table and explain why simpler models underperform on UNSW-NB15 network behavior.`)
    } else if (q.includes('attack') || q.includes('fraud') || q.includes('connexion') || q.includes('connection')) {
      setAnswer(`Go to Fraudulent Connections. Start with critical rows, then check protocol, service/state, traffic volume, and SOC action. Latest signal: ${context.latestAttack}. Critical detections loaded: ${context.critical}.`)
    } else if (q.includes('health') || q.includes('status')) {
      setAnswer(`Current platform context: ${context.totalEvents} events analyzed, ${context.alerts} alerts loaded, threat index ${context.threatIndex}/100.`)
    } else if (q.includes('page') || q.includes('explain') || q.includes('help')) {
      setAnswer(pageGuide[page])
    } else {
      setAnswer(`${pageGuide[page]} Current context: ${context.totalEvents} events analyzed, ${context.alerts} alerts loaded, active model ${context.model}, latest signal: ${context.latestAttack}.`)
    }
    setQuestion('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-2xl"
        style={{ background: 'linear-gradient(90deg, #5865C5, #E8623A)' }}
      >
        <MessageCircle className="h-4 w-4" />
        SOC guide
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] overflow-hidden rounded-[12px] border shadow-2xl" style={{ background: palette.panel, borderColor: palette.border }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: palette.border }}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#5865C5]" />
              <div>
                <div className="text-sm font-bold" style={{ color: palette.text }}>SOC decision guide</div>
                <div className="text-[11px]" style={{ color: palette.muted }}>Contextual help, based on live dashboard data</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: palette.muted }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-[10px] border p-3 text-sm leading-6" style={{ background: palette.soft, borderColor: palette.border, color: palette.text }}>
              {answer}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Events', value: context.totalEvents },
                { label: 'Alerts', value: context.alerts },
                { label: 'Critical', value: `${context.critical}` },
              ].map(item => (
                <div key={item.label} className="rounded-lg border p-2" style={{ borderColor: palette.border, background: palette.soft }}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: palette.muted }}>{item.label}</div>
                  <div className="mt-1 truncate text-sm font-bold" style={{ color: palette.text }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Explain this page', 'Why Random Forest?', 'Investigate attacks', 'Health summary'].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => respond(prompt)}
                  className="rounded-lg border px-2 py-2 text-left text-[11px] font-semibold"
                  style={{ borderColor: palette.border, color: palette.muted }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={question}
                onChange={event => setQuestion(event.target.value)}
                onKeyDown={event => { if (event.key === 'Enter') respond() }}
                placeholder="Ask: what should I check first?"
                className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs outline-none"
                style={{ background: palette.soft, borderColor: palette.border, color: palette.text }}
              />
              <button onClick={() => respond()} className="rounded-lg bg-[#5865C5] px-3 text-white">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-start gap-2 rounded-lg p-2 text-[11px]" style={{ color: palette.muted, background: palette.soft }}>
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E8623A]" />
              This guide is rule-based inside the dashboard. It explains and orients; it does not replace a full LLM backend.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
