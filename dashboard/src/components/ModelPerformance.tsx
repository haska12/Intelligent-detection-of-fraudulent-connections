import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts'
import { Brain, Target, Layers, Cpu, TrendingUp, CheckCircle2, Clock, Zap } from 'lucide-react'
import { ModelPerformance as ModelPerformanceData } from '../services/api'
import { useTheme } from '../context/ThemeContext'

interface Props {
  data: ModelPerformanceData | null
  loading: boolean
}

// ── Static training results (always visible, never depend on API) ──────────
const STATIC_MODELS = [
  { name: 'Random Forest',      shortName: 'Rand. Forest', f1: 0.7583, accuracy: 0.8612, precision: 0.8134, recall: 0.7583, selected: true,  params: '200 trees · maxDepth=20',   color: '#5865C5' },
  { name: 'Decision Tree',      shortName: 'Dec. Tree',    f1: 0.7353, accuracy: 0.8401, precision: 0.7890, recall: 0.7353, selected: false, params: 'maxDepth=12',                color: '#7B5BC4' },
  { name: 'Naive Bayes',        shortName: 'Naive Bayes',  f1: 0.4666, accuracy: 0.6210, precision: 0.5532, recall: 0.4666, selected: false, params: 'smoothing=0.001',            color: '#B05CA0' },
  { name: 'Logistic Regression',shortName: 'Log. Reg.',    f1: 0.4499, accuracy: 0.5987, precision: 0.5421, recall: 0.4499, selected: false, params: 'regParam=0.01',              color: '#D45E72' },
  { name: 'Neural Net (MLP)',   shortName: 'Neural Net',   f1: 0.3695, accuracy: 0.5142, precision: 0.4830, recall: 0.3695, selected: false, params: '2-layer · 100 units',        color: '#E8623A' },
]

const PIPELINE_INFO = [
  { label: 'StringIndexer ×3',   desc: 'Encode categorical: proto, service, state' },
  { label: 'OneHotEncoder ×3',   desc: 'Sparse vector encoding' },
  { label: 'VectorAssembler',    desc: '195 features assembled into dense vector' },
  { label: 'StandardScaler',     desc: 'Z-score normalization across all features' },
  { label: 'Label StringIndexer',desc: 'Attack category → numeric label' },
  { label: 'RandomForestClassifier', desc: '200 trees, 10 classes, maxDepth=20' },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function Gauge({ value, label, color, live }: { value: number; label: string; color: string; live?: boolean }) {
  const data = [{ value: Math.min(100, Math.max(0, value)), fill: color }]
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="68%" outerRadius="100%" data={data}
            startAngle={210} endAngle={-30} cx="50%" cy="55%">
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: '#E4E8F0' }} dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-2 gap-0.5">
          <span className="text-xl font-bold tabular-nums leading-none" style={{ color }}>
            {value > 0 ? `${value.toFixed(1)}%` : '—'}
          </span>
          {live && value > 0 && (
            <span className="text-[8px] font-bold text-[#E8623A] tracking-widest">LIVE</span>
          )}
        </div>
      </div>
      <span className="text-label text-[10px] text-center leading-tight max-w-[90px]">{label}</span>
    </div>
  )
}

const ModelBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl min-w-[200px]">
      <p className="font-bold mb-2" style={{ color: d?.color }}>{d?.name}</p>
      <div className="space-y-1">
        <p className="text-muted">F1 Score:  <span className="font-bold">{(d?.f1 * 100).toFixed(1)}%</span></p>
        <p className="text-muted">Accuracy:  <span className="font-bold">{(d?.accuracy * 100).toFixed(1)}%</span></p>
        <p className="text-muted">Precision: <span className="font-bold">{(d?.precision * 100).toFixed(1)}%</span></p>
        <p className="text-muted">Recall:    <span className="font-bold">{(d?.recall * 100).toFixed(1)}%</span></p>
        <p className="text-muted text-[10px] mt-1 pt-1 border-t border-dashed">{d?.params}</p>
      </div>
      {d?.selected && (
        <p className="text-[#5865C5] font-bold mt-1.5 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Active Production Model
        </p>
      )}
    </div>
  )
}

const CatTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="panel border rounded-xl p-3 text-xs shadow-xl space-y-1">
      <p className="font-bold mb-1" style={{ color: d?.color }}>{label}</p>
      <p className="text-muted">Detected: <span className="font-bold">{Number(d?.correct).toLocaleString()}</span></p>
      <p className="text-muted">Total:    <span className="font-bold">{Number(d?.total).toLocaleString()}</span></p>
      <p className="text-muted">Accuracy: <span className="font-bold">{d?.accuracy}%</span></p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ModelPerformance({ data, loading }: Props) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const tickColor = dark ? '#6B7194' : '#9098BB'
  const gridColor = dark ? '#1F2340' : '#EEF0F8'
  const bgTrack   = dark ? '#1F2340' : '#EEF0F8'
  const cardBg    = dark ? 'bg-[#0F1120]' : 'bg-[#F8F9FC]'

  // Live values from API (fall back to 0 if not yet loaded)
  const liveAccuracy    = data?.live_accuracy    ?? 0
  const detectionRate   = data?.detection_rate   ?? 0
  const totalPredictions= data?.total_predictions ?? 0
  const recentAttacks   = data?.recent_attacks   ?? 0
  const recentTotal     = data?.recent_total     ?? 0
  const categoryAcc     = data?.category_accuracy ?? []
  const generatedAt     = data?.generated_at

  const recentRate = recentTotal > 0 ? ((recentAttacks / recentTotal) * 100).toFixed(1) : '—'

  return (
    <div className="space-y-4">

      {/* ── Row 1: 4 stat cards + live badge ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pipeline Stages',   value: '10',          icon: Layers,    color: '#5865C5', static: true  },
          { label: 'Input Features',    value: '195',         icon: Cpu,       color: '#7B5BC4', static: true  },
          { label: 'Attack Classes',    value: '10',          icon: Target,    color: '#E8623A', static: true  },
          { label: 'Total Predictions', value: totalPredictions > 0 ? totalPredictions.toLocaleString() : '…', icon: TrendingUp, color: '#22AA6F', static: false },
        ].map(item => (
          <div key={item.label} className={`panel rounded-xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: item.color + '18' }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
                {!item.static && (
                  <span className="text-[8px] font-bold text-[#E8623A] tracking-widest">LIVE</span>
                )}
              </div>
              <div className="text-label text-[10px]">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Gauges + Model Ranking + Last-hour card ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Gauges — training static + live dynamic */}
        <div className="panel rounded-xl p-5 flex flex-col gap-3 xl:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="section-title text-xs">Performance Metrics</h3>
            {generatedAt && (
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(generatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1 place-items-center">
            <div className="flex flex-col items-center">
              <Gauge value={0.7583 * 100} label="Training F1 Score"    color="#5865C5" />
              <span className="text-[9px] text-muted mt-1">Fixed · from training</span>
            </div>
            <div className="flex flex-col items-center">
              <Gauge value={0.8612 * 100} label="Training Accuracy"    color="#7B5BC4" />
              <span className="text-[9px] text-muted mt-1">Fixed · from training</span>
            </div>
            <div className="flex flex-col items-center">
              <Gauge value={detectionRate} label="Live Detection Rate"  color="#E8623A" live />
              <span className="text-[9px] text-muted mt-1">Updates every 10s</span>
            </div>
            <div className="flex flex-col items-center">
              <Gauge value={liveAccuracy}  label="Live Prediction Acc." color="#22AA6F" live />
              <span className="text-[9px] text-muted mt-1">Updates every 10s</span>
            </div>
          </div>
        </div>

        {/* Model ranking list */}
        <div className="panel rounded-xl p-5 flex flex-col gap-3">
          <h3 className="section-title text-xs">Model Comparison (F1 Score)</h3>
          <div className="space-y-2.5 flex-1">
            {STATIC_MODELS.map((m, i) => (
              <div key={m.name}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  m.selected ? (dark ? 'bg-[#5865C5]/12' : 'bg-[#5865C5]/07') : ''
                }`}>
                <span className={`text-xs font-bold w-4 text-center ${dark ? 'text-[#4A5080]' : 'text-[#C0C6D8]'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${dark ? 'text-white' : 'text-[#1A1F36]'}`}>{m.name}</span>
                      {m.selected && (
                        <span className="model-badge text-[9px] px-1.5 py-0.5">ACTIVE</span>
                      )}
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: m.color }}>
                      {(m.f1 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: bgTrack }}>
                    <div className="h-full rounded-full" style={{ width: `${m.f1 * 100}%`, background: m.color }} />
                  </div>
                  <div className="text-[10px] text-muted mt-0.5">{m.params}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last-hour live summary + pipeline stages */}
        <div className="flex flex-col gap-4">
          {/* Last hour card */}
          <div className="panel rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#E8623A]" />
              <h3 className="section-title text-xs">Last Hour Activity</h3>
              <span className="ml-auto text-[8px] font-bold text-[#E8623A] tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8623A] status-dot" />
                LIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Events',       value: recentTotal > 0   ? recentTotal.toLocaleString()   : '—', color: '#5865C5' },
                { label: 'Attacks',      value: recentAttacks > 0 ? recentAttacks.toLocaleString() : '—', color: '#E8623A' },
                { label: 'Attack Rate',  value: recentRate !== '—' ? `${recentRate}%`              : '—', color: '#F5A623' },
                { label: 'Normal',       value: recentTotal > 0   ? (recentTotal - recentAttacks).toLocaleString() : '—', color: '#22AA6F' },
              ].map(item => (
                <div key={item.label} className={`${cardBg} rounded-xl p-3`}>
                  <div className="text-xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</div>
                  <div className="text-label text-[10px]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="panel rounded-xl p-5 flex flex-col gap-2 flex-1">
            <h3 className="section-title text-xs">Pipeline Stages</h3>
            {PIPELINE_INFO.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                  style={{ background: `hsl(${225 + i * 12}, 65%, 55%)` }}>
                  {i + 1}
                </div>
                <div>
                  <div className={`text-[11px] font-semibold ${dark ? 'text-white' : 'text-[#1A1F36]'}`}>{step.label}</div>
                  <div className="text-[10px] text-muted">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Model bar chart + category accuracy ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* F1 vs Accuracy bar chart */}
        <div className="panel rounded-xl p-5 flex flex-col gap-3">
          <h3 className="section-title text-xs">F1 Score vs Accuracy — All Models</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={STATIC_MODELS} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="shortName" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
              <Tooltip content={<ModelBarTooltip />} />
              <Bar dataKey={(d) => +(d.f1 * 100).toFixed(1)} name="F1 Score" radius={[4, 4, 0, 0]}>
                {STATIC_MODELS.map((m, i) => (
                  <Cell key={i} fill={m.color} opacity={m.selected ? 1 : 0.55} />
                ))}
              </Bar>
              <Bar dataKey={(d) => +(d.accuracy * 100).toFixed(1)} name="Accuracy" fill={dark ? '#2A3060' : '#DDE2F5'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-category detection accuracy — LIVE */}
        <div className="panel rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="section-title text-xs">Detection Rate by Attack Category</h3>
            <span className="text-[8px] font-bold text-[#E8623A] tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8623A] status-dot" />LIVE
            </span>
          </div>
          {categoryAcc.length === 0 ? (
            <div className={`flex flex-col items-center justify-center flex-1 gap-2 rounded-xl border-2 border-dashed h-44 ${
              dark ? 'border-[#1F2340] text-[#3A3F60]' : 'border-[#DDE2F5] text-[#9098BB]'
            }`}>
              {loading ? (
                <>
                  <div className="w-6 h-6 border-2 border-[#5865C5] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Loading live data…</p>
                </>
              ) : (
                <>
                  <Brain className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No category accuracy data yet</p>
                  <p className="text-xs opacity-60">Start streaming to populate this chart</p>
                </>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={categoryAcc} layout="vertical" margin={{ top: 0, right: 50, left: 90, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="category" tick={{ fill: tickColor, fontSize: 11 }} tickLine={false} width={90} />
                <Tooltip content={<CatTooltip />} />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                  {categoryAcc.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
