import { DAY_MS, MAX_DATE_MS, MIN_DATE_MS, startOfISOWeek, startOfUTCDay, startOfUTCMonth, startOfUTCYear, utcDate } from '../lib/calendar'
import { formatDayAccessible, formatDayRange, formatDayShort, formatMonthShort, formatMonthYear, formatWeekdayLong, formatWeekdayShort } from '../lib/formatting'

export type Level = 0 | 1 | 2 | 3
export const LEVEL_NAMES = ['Years', 'Months', 'Weeks', 'Days'] as const
// Zoom steps between these scales instead of scaling continuously.
export const LEVEL_PX_PER_DAY = [0.42, 6, 24, 64] as const

export const clampLevel = (n: number): Level => Math.min(3, Math.max(0, Math.round(n))) as Level

// weekday sits above the label (day level); sublabel sits below it (week level).
export type Span = { start: number; end: number; label: string; long: string; weekday?: string; sublabel?: string; weekend?: boolean }

const END_MS = MAX_DATE_MS + 1
const MAX_SPANS = 800

function floor(level: Level, ms: number): number {
  if (level === 0) return startOfUTCYear(ms)
  if (level === 1) return startOfUTCMonth(ms)
  if (level === 2) return startOfISOWeek(ms)
  return startOfUTCDay(ms)
}

function next(level: Level, ms: number): number {
  const d = new Date(ms)
  if (level === 0) return utcDate(d.getUTCFullYear() + 1).getTime()
  if (level === 1) return utcDate(d.getUTCFullYear(), d.getUTCMonth() + 1).getTime()
  return ms + (level === 2 ? 7 : 1) * DAY_MS
}

function describe(level: Level, start: number, end: number): Omit<Span, 'start' | 'end'> {
  const d = new Date(start)
  if (level === 0) return { label: String(d.getUTCFullYear()), long: String(d.getUTCFullYear()) }
  if (level === 1) return { label: formatMonthShort(start), long: formatMonthYear(start) }
  if (level === 2) return { label: formatDayShort(start), long: formatDayRange(start, end - DAY_MS), sublabel: formatWeekdayLong(start) }
  const wd = d.getUTCDay()
  return { label: String(d.getUTCDate()), long: formatDayAccessible(start), weekday: formatWeekdayShort(start), weekend: wd === 0 || wd === 6 }
}

// Calendar units of one level overlapping [startMs, endMs), clipped to the supported range.
// ISO weeks start Monday and are not clipped to month boundaries.
export function spans(level: Level, startMs: number, endMs: number): Span[] {
  const out: Span[] = []
  for (let s = floor(level, startMs); s < endMs && out.length < MAX_SPANS; s = next(level, s)) {
    const a = Math.max(s, MIN_DATE_MS), b = Math.min(next(level, s), END_MS)
    if (b > a) out.push({ start: a, end: b, ...describe(level, a, b) })
  }
  return out
}
