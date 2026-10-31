import { describe, expect, it } from 'vitest'
import { fromDayInput, toDayInput } from './tasks'
import { utcDate } from './calendar'

describe('task date boundaries', () => {
  it('round-trips a leap day exactly in UTC', () => {
    const leapDay = utcDate(2028, 1, 29).getTime()
    expect(toDayInput(leapDay)).toBe('2028-02-29')
    expect(fromDayInput('2028-02-29')).toBe(leapDay)
  })

  it('rejects invalid and non-leap dates', () => {
    expect(fromDayInput('2027-02-29')).toBeNull()
    expect(fromDayInput('2026-13-01')).toBeNull()
  })
})

