const monthLong = new Intl.DateTimeFormat(undefined, { month: 'long', timeZone: 'UTC' })
const monthShort = new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' })
const rangeLong = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric', timeZone: 'UTC' })
const dayShort = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
const dayFull = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const weekdayShort = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })
const weekdayLong = new Intl.DateTimeFormat(undefined, { weekday: 'long', timeZone: 'UTC' })

export const formatMonth = (ms: number) => monthLong.format(ms)
export const formatMonthShort = (ms: number) => monthShort.format(ms)
export const formatMonthYear = (ms: number) => rangeLong.format(ms)
export const formatDayShort = (ms: number) => dayShort.format(ms)
export const formatWeekdayShort = (ms: number) => weekdayShort.format(ms)
export const formatWeekdayLong = (ms: number) => weekdayLong.format(ms)
export const formatDayRange = (start: number, end: number) => dayFull.formatRange(start, end)
export const formatDayAccessible = (ms: number) => new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
}).format(ms)
