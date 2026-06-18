import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BrainCircuit, CheckCircle2, Cpu, Target, TrendingUp } from 'lucide-react'
import { KpiSummary, ModelPerformance } from '../services/api'
import { useTheme } from '../context/ThemeContext'

interface Props {
  model: ModelPerformance | null
  kpi: KpiSummary | null
}

const FALLBACK_MODEL_RESULTS = [
  { name: 'Random Forest', f1: 75.8, accuracy: 86.1, precision: 81.3, recall: 75.8, selected: true, reason: 'Best balance between precision, recall, and stability on multi-class attacks.' },
  { name: 'Decision Tree', f1: 73.5, accuracy: 84.0, precision: 78.9, recall: 73.5, selected: false, reason: 'Strong baseline but less robust than the ensemble model.' },
  { name: 'Naive Bayes', f1: 46.7, accuracy: 62.1, precision: 55.3, recall: 46.7, selected: false, reason: 'Too simple for correlated network features.' },
  { name: 'Logistic Regression', f1: 45.0, accuracy: 59.9, precision: 54.2, recall: 45.0, selected: false, reason: 'Linear boundary underfits complex intrusion patterns.' },
  { name: 'Neural Net', f1: 37.0, accuracy: 51.4, precision: 48.3, recall: 37.0, selected: false, reason: 'Lower result in this experiment and harder to justify operationally.' },
]

const COLORS = ['#5865C5', '#7B5BC4', '#B05CA0', '#D45E72', '#E8623A']

const reasonFor = (name: string, selected: boolean) => {
  if (selected) return 'Best balance between precision, recall, and stability on multi-class attacks.'
  if (name.includes('Decision')) return 'Strong baseline but less robust than the ensemble model.'
  if (name.includes('Bayes')) return 'Too simple for correlated network features.'
  if (name.includes('Logistic')) return 'Linear boundary underfits complex intrusion patterns.'
  if (name.includes('Neural') || name.includes('MLP')) return 'Lower result in this experiment and harder to justify operationally.'
  return 'Lower operational score than the selected production model.'
}

export default function ModelDecisionPanel({ model, kpi }: Props) {
  const { isDark } = useTheme()
  const panel = isDark ? '#0C1121' : '#FAFBFD'
  const soft = isDark ? '#101827' : '#EEF3F8'
  const border = isDark ? 'rgba(255,255,255,0.07)' : '#CCD6E4'
  const text = isDark ? '#F8FAFC' : '#0F172A'
  const muted = isDark ? '#8B95B0' : '#64748B'
  const faint = isDark ? '#4B5470' : '#94A3B8'
  const grid = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB'
  const modelResults = model?.models?.length
    ? model.models.map(entry => ({
        name: entry.name,
        f1: entry.f1 * 100,
        accuracy: entry.accuracy * 100,
        precision: entry.precision * 100,
        recall: entry.recall * 100,
        selected: entry.selected,
        reason: reasonFor(entry.name, entry.selected),
      }))
    : FALLBACK_MODEL_RESULTS

  const sorted = [...modelResults].sort((a, b) => b.f1 - a.f1)
  const selected = modelResults.find(row => row.selected) ?? sorted[0]
  const runnerUp = sorted.find(row => row.name !== selected.name) ?? sorted[1] ?? selected
  const f1Lift = selected.f1 - runnerUp.f1
  const accLift = selected.accuracy - runnerUp.accuracy

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]" aria-label="Model decision panel">
      <div className="rounded-[8px] border p-5" style={{ background: panel, borderColor: border }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: faint }}>
              <BrainCircuit className="h-4 w-4" />
              Model selection evidence
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight" style={{ color: text }}>
              Random Forest selected for production detection
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: muted }}>
              The selected model gives the strongest operational trade-off: high accuracy, strong F1 score,
              and better resilience for mixed attack categories in UNSW-NB15 traffic.
            </p>
          </div>
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white" style={{ background: '#5865C5' }}>
            Active
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Training accuracy', value: `${selected.accuracy.toFixed(1)}%`, icon: Target, color: '#5865C5' },
            { label: 'F1 score', value: `${selected.f1.toFixed(1)}%`, icon: TrendingUp, color: '#22AA6F' },
            { label: 'Predictions live', value: model?.total_predictions ? model.total_predictions.toLocaleString() : 'Waiting', icon: Cpu, color: '#E8623A' },
            { label: 'Threat index', value: kpi ? `${kpi.threat_index.toFixed(0)}/100` : 'Waiting', icon: CheckCircle2, color: '#7B5BC4' },
          ].map(item => (
            <div key={item.label} className="rounded-[8px] border p-3" style={{ background: soft, borderColor: border }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold" style={{ color: muted }}>{item.label}</span>
                <item.icon className="h-4 w-4" style={{ color: item.color }} />
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums" style={{ color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[8px] border p-4" style={{ background: soft, borderColor: border }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: faint }}>Decision summary</div>
          <p className="mt-2 text-sm leading-6" style={{ color: muted }}>
            Random Forest beats the closest alternative by <strong style={{ color: text }}>{f1Lift.toFixed(1)} F1 points</strong>
            {' '}and <strong style={{ color: text }}>{accLift.toFixed(1)} accuracy points</strong>, while remaining interpretable enough
            for an enterprise SOC dashboard.
          </p>
        </div>
      </div>

      <div className="rounded-[8px] border p-5" style={{ background: panel, borderColor: border }}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: faint }}>Algorithm benchmark</div>
            <h3 className="mt-1 text-lg font-semibold" style={{ color: text }}>Tested models: F1 and accuracy comparison</h3>
          </div>
          <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ color: '#22AA6F', background: 'rgba(34,197,94,0.12)' }}>
            Best overall: Random Forest
          </div>
        </div>

        <ResponsiveContainer width="100%" height={245}>
          <BarChart data={modelResults} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: faint, fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
            <YAxis tick={{ fill: faint, fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ background: panel, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: text }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="f1" name="F1 score" radius={[4, 4, 0, 0]}>
              {modelResults.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Bar>
            <Bar dataKey="accuracy" name="Accuracy" fill={isDark ? '#27324F' : '#CBD5E1'} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 overflow-hidden rounded-[8px] border" style={{ borderColor: border }}>
          <table className="w-full text-left text-xs">
            <thead style={{ background: soft, color: faint }}>
              <tr>
                <th className="px-3 py-2 font-bold uppercase tracking-[0.12em]">Algorithm</th>
                <th className="px-3 py-2 font-bold uppercase tracking-[0.12em]">F1</th>
                <th className="px-3 py-2 font-bold uppercase tracking-[0.12em]">Why not selected</th>
              </tr>
            </thead>
            <tbody>
              {modelResults.map(row => (
                <tr key={row.name} className="border-t" style={{ borderColor: border }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: row.selected ? '#5865C5' : text }}>
                    {row.name}{row.selected ? ' - chosen' : ''}
                  </td>
                  <td className="px-3 py-2 tabular-nums" style={{ color: text }}>{row.f1.toFixed(1)}%</td>
                  <td className="px-3 py-2" style={{ color: muted }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
