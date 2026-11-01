import { daysInMonth, utcDate } from './calendar'

export type Importance = 0 | 1 | 2

// start and end are the UTC midnights of the first and last day; end is inclusive.
export type Task = { id: string; title: string; start: number; end: number; importance: Importance; urgency: number; notes: string; projectId: string | null }
export type NewTask = Omit<Task, 'id'>

export const IMPORTANCE = [
  { name: 'Low', hue: 168, saturation: 48, lightness: 42 },
  { name: 'Medium', hue: 38, saturation: 84, lightness: 50 },
  { name: 'High', hue: 357, saturation: 78, lightness: 56 },
] as const

// Urgency (0–100) scales saturation: relaxed tasks fade toward grey, urgent ones are fully saturated.
export function taskColor(importance: Importance, urgency: number): string {
  const { hue, saturation, lightness } = IMPORTANCE[importance]
  const s = saturation * (0.15 + 0.85 * Math.min(100, Math.max(0, urgency)) / 100)
  return `hsl(${hue} ${s.toFixed(1)}% ${lightness}%)`
}

export const urgencyLabel = (urgency: number) => urgency < 34 ? 'Relaxed' : urgency < 67 ? 'Soon' : 'Urgent'

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

// Conversions for <input type="date"> values (YYYY-MM-DD).
export function toDayInput(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function fromDayInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1]), month = Number(match[2]) - 1, day = Number(match[3])
  if (year < 1 || month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) return null
  return utcDate(year, month, day).getTime()
}
