import { describe, expect, it } from 'vitest'
import { activeTasks, completeTask, completionDelay, fromDayInput, restoreTask, toDayInput } from './tasks'
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

describe('task completion', () => {
  const task = { id: 't1', title: 'Finish', start: 1, end: 2, importance: 0 as const, urgency: 50, notes: '', projectId: null }

  it('marks a task complete without deleting or changing its planning data', () => {
    const completed = completeTask(task, 100)
    expect(completed).toEqual({ ...task, completedAt: 100 })
    expect(activeTasks([completed])).toEqual([])
    expect(restoreTask(completed)).toEqual(task)
  })

  it('is idempotent under rapid repeated completion', () => {
    const completed = completeTask(task, 100)
    expect(completeTask(completed, 200)).toBe(completed)
  })

  it('uses a minimal delay for reduced motion', () => {
    expect(completionDelay(true)).toBeLessThan(completionDelay(false))
  })
})

