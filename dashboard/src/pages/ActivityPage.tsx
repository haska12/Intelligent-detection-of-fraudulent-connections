import { ActivityEvent } from '../services/api'
import ActivityStream from '../components/charts/ActivityStream'

interface Props { stream: ActivityEvent[] }

export default function ActivityPage({ stream }: Props) {
  return (
    <div className="space-y-4 page-enter">
      <ActivityStream data={stream} />
    </div>
  )
}
