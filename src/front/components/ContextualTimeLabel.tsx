import { Level } from '../../back/engine/levels'
import { DAY_MS, isoWeek, startOfISOWeek } from '../../back/lib/calendar'
import { formatDayRange, formatDayShort, formatMonth, formatWeekdayLong } from '../../back/lib/formatting'

type Props = {
  focusMs: number
  level: Level
  onToday?: () => void
  style: React.CSSProperties
}

function contextualText(level: Level, focusMs: number) {
  if (level === 0) return formatDayShort(focusMs).toUpperCase()
  if (level === 1) return formatMonth(focusMs).toUpperCase()
  if (level === 2) {
    const start = startOfISOWeek(focusMs)
    return `WEEK ${isoWeek(focusMs).week} · ${formatDayRange(start, start + 6 * DAY_MS).toUpperCase()}`
  }
  return `${formatWeekdayLong(focusMs).toUpperCase()}, ${formatDayShort(focusMs).toUpperCase()}`
}

export function ContextualTimeLabel({ focusMs, level, onToday, style }: Props) {
  const label = contextualText(level, focusMs)
  if (!onToday) return <div className="contextual-time-label decorative" style={style}>{label}</div>
  return <button type="button" className="contextual-time-label"
    style={style} aria-label={`Return to today from ${label}`} onClick={onToday}>
    <span>{label}</span>
  </button>
}
