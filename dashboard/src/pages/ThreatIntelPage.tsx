import { AlertItem, CategoryPoint, ProtocolPoint } from '../services/api'
import ThreatIntelTable from '../components/tables/ThreatIntelTable'
import ThreatDonut from '../components/charts/ThreatDonut'
import ProtocolAnalytics from '../components/charts/ProtocolAnalytics'
import FraudulentConnections from '../components/FraudulentConnections'

interface Props {
  alerts:  AlertItem[]
  cats:    CategoryPoint[]
  protos:  ProtocolPoint[]
}

export default function ThreatIntelPage({ alerts, cats, protos }: Props) {
  return (
    <div className="space-y-6 page-enter">
      <FraudulentConnections alerts={alerts} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ThreatDonut    data={cats}   />
        <ProtocolAnalytics data={protos} />
      </div>
      <ThreatIntelTable data={alerts} />
    </div>
  )
}
