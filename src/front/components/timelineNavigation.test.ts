import { describe, expect, it } from 'vitest'
import { utcDate } from '../../back/lib/calendar'
import { resolveParentAnchor, resolveTimelineUnitNavigation } from './timelineNavigation'

describe('direct parent-period navigation', () => {
  const yearStart = utcDate(2026).getTime()
  const yearEnd = utcDate(2027).getTime()
  const octoberStart = utcDate(2026, 9).getTime()
  const novemberStart = utcDate(2026, 10).getTime()
  const focus = utcDate(2026, 9, 31).getTime()

  it('jumps immediately from days to years without a pan', () => {
    const result = resolveTimelineUnitNavigation({ row: 'parent', targetLevel: 0, start: yearStart, end: yearEnd }, 3, focus)
    expect(result).toEqual({ level: 0, anchorMs: focus })
  })

  it('supports every visible parent level and repeated direct jumps', () => {
    expect(resolveTimelineUnitNavigation({ row: 'parent', targetLevel: 2, start: utcDate(2026, 9, 26).getTime(), end: utcDate(2026, 10, 2).getTime() }, 3, focus)?.level).toBe(2)
    expect(resolveTimelineUnitNavigation({ row: 'parent', targetLevel: 1, start: octoberStart, end: novemberStart }, 3, focus)?.level).toBe(1)
    expect(resolveTimelineUnitNavigation({ row: 'parent', targetLevel: 0, start: yearStart, end: yearEnd }, 2, focus)?.level).toBe(0)
    expect(resolveTimelineUnitNavigation({ row: 'parent', targetLevel: 0, start: yearStart, end: yearEnd }, 1, focus)?.level).toBe(0)
  })

  it('uses the visible period midpoint when focus lies outside an edge period', () => {
    const previousYearStart = utcDate(2025).getTime()
    const midpoint = previousYearStart + (yearStart - previousYearStart) / 2
    expect(resolveParentAnchor(focus, previousYearStart, yearStart)).toBe(midpoint)
    expect(resolveParentAnchor(focus, yearStart, yearEnd)).toBe(focus)
  })

  it('keeps the complete years → months → weeks → days sequence discrete', () => {
    expect(resolveTimelineUnitNavigation({ row: 'main', start: yearStart }, 0, focus)?.level).toBe(1)
    expect(resolveTimelineUnitNavigation({ row: 'main', start: octoberStart }, 1, focus)?.level).toBe(2)
    expect(resolveTimelineUnitNavigation({ row: 'main', start: utcDate(2026, 9, 26).getTime() }, 2, focus)?.level).toBe(3)
  })
})

