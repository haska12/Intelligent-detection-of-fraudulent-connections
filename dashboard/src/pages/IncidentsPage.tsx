import { IncidentRow } from '../services/api'
import ActiveIncidents from '../components/tables/ActiveIncidents'

interface Props { incidents: IncidentRow[] }

export default function IncidentsPage({ incidents }: Props) {
  return (
    <div className="space-y-6 page-enter">
      <ActiveIncidents data={incidents} />
    </div>
  )
}
