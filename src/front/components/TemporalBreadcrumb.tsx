import { Level } from '../../back/engine/levels'
import { isoWeek } from '../../back/lib/calendar'
import { formatDayAccessible, formatMonth, formatWeekdayLong } from '../../back/lib/formatting'

type Props = {
  focusMs: number
  level: Level
  onLevel: (level: Level, anchorMs: number) => void
}

type Segment = { level: Level; text: string; label: string }

function BreadcrumbButton({ segment, focusMs, onLevel }: { segment: Segment; focusMs: number; onLevel: Props['onLevel'] }) {
  const navigate = () => onLevel(segment.level, focusMs)
  return <button type="button" className="temporal-crumb"
    aria-label={segment.label} onClick={navigate}>
    <span>{segment.text}</span>
  </button>
}

export function TemporalBreadcrumb({ focusMs, level, onLevel }: Props) {
  const date = new Date(focusMs)
  const week = isoWeek(focusMs)
  const segments: Segment[] = [
    { level: 0, text: String(date.getUTCFullYear()), label: `View year ${date.getUTCFullYear()}` },
  ]
  if (level >= 1) segments.push({ level: 1, text: formatMonth(focusMs).toUpperCase(), label: `View ${formatMonth(focusMs)} ${date.getUTCFullYear()}` })
  if (level >= 2) segments.push({ level: 2, text: `WEEK ${week.week}`, label: `View ISO week ${week.week}` })
  if (level >= 3) segments.push({ level: 3, text: `${formatWeekdayLong(focusMs).toUpperCase()} ${date.getUTCDate()}`, label: `View ${formatDayAccessible(focusMs)}` })

  return <nav className="temporal-breadcrumb" aria-label="Current temporal focus">
    {segments.map((segment, index) => <span className="crumb-slot" key={segment.level}>
      {index > 0 && <b aria-hidden="true">/</b>}
      <BreadcrumbButton segment={segment} focusMs={focusMs} onLevel={onLevel} />
    </span>)}
  </nav>
}
