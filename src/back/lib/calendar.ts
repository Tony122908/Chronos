export const DAY_MS = 86_400_000

export function utcDate(year: number, month = 0, day = 1): Date {
  const date = new Date(0)
  date.setUTCFullYear(year, month, day)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

// Date.UTC maps years 0–99 to 1900–1999, so year 1 must go through setUTCFullYear.
export const MIN_DATE_MS = utcDate(1).getTime()
export const MAX_DATE_MS = Date.UTC(9999, 11, 31, 23, 59, 59, 999)

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function daysInMonth(year: number, month: number): number {
  return Math.round((utcDate(year, month + 1).getTime() - utcDate(year, month).getTime()) / DAY_MS)
}

export function startOfUTCYear(ms: number): number {
  return utcDate(new Date(ms).getUTCFullYear()).getTime()
}

export function startOfUTCMonth(ms: number): number {
  const d = new Date(ms)
  return utcDate(d.getUTCFullYear(), d.getUTCMonth()).getTime()
}

export function startOfUTCDay(ms: number): number {
  const d = new Date(ms)
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime()
}

export function startOfISOWeek(ms: number): number {
  const day = startOfUTCDay(ms)
  const weekday = new Date(day).getUTCDay() || 7
  return day - (weekday - 1) * DAY_MS
}

export function isoWeek(ms: number): { week: number; year: number } {
  const d = new Date(startOfUTCDay(ms))
  const weekday = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - weekday)
  const year = d.getUTCFullYear()
  const yearStart = utcDate(year).getTime()
  return { year, week: Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7) }
}

// Local wall-clock time in the UTC coordinate space, so "now" lands on the user's calendar day.
export function localNowMs(): number {
  const n = new Date()
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours(), n.getMinutes())
}

export function clampTime(ms: number): number {
  return Math.min(MAX_DATE_MS, Math.max(MIN_DATE_MS, ms))
}
