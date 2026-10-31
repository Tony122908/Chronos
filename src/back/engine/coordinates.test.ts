import { describe, expect, it } from 'vitest'
import { timeToX, xToTime, zoomAt } from './coordinates'
import { utcDate } from '../lib/calendar'

describe('timeline coordinate preservation', () => {
  it('keeps the time below the pointer fixed while zooming', () => {
    const width = 1440
    const anchorX = 1038
    const view = { centerMs: utcDate(2026, 9, 30).getTime(), pxPerDay: 1 }
    const anchorTime = xToTime(anchorX, view, width)
    const zoomed = zoomAt(view, 32, anchorX, width)
    expect(timeToX(anchorTime, zoomed, width)).toBeCloseTo(anchorX, 8)
  })
})

