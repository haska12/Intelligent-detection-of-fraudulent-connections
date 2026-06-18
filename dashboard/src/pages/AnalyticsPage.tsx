import { KpiSummary, ModelPerformance } from '../services/api'
import ModelMetrics from '../components/charts/ModelMetrics'
import ModelDecisionPanel from '../components/ModelDecisionPanel'

interface Props {
  model: ModelPerformance | null
  kpi: KpiSummary | null
}

export default function AnalyticsPage({ model, kpi }: Props) {
  return (
    <div className="space-y-6 page-enter">
      <ModelDecisionPanel model={model} kpi={kpi} />
      <ModelMetrics data={model} />
    </div>
  )
}
