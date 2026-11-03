import { describe, expect, it } from 'vitest'
import { resolveWheelRoute } from './gestureRouting'

describe('wheel gesture routing', () => {
  it('pans over the collapsed filter trigger and empty filter row', () => {
    const base = { modifier: false, blockedSurface: false, verticalDominant: true, verticalScrollEnabled: true, insideScrollArea: false, scrollAreaOverflowing: true }
    expect(resolveWheelRoute(base)).toBe('pan')
    expect(resolveWheelRoute({ ...base, verticalDominant: false })).toBe('pan')
  })

  it('keeps wheel input local inside the open project popover and its controls', () => {
    const input = { modifier: false, blockedSurface: true, verticalDominant: true, verticalScrollEnabled: true, insideScrollArea: false, scrollAreaOverflowing: false }
    expect(resolveWheelRoute(input)).toBe('local')
    expect(resolveWheelRoute({ ...input, modifier: true })).toBe('local')
  })

  it('preserves task-list vertical scrolling, horizontal panning, and modifier zoom', () => {
    const base = { modifier: false, blockedSurface: false, verticalDominant: true, verticalScrollEnabled: true, insideScrollArea: true, scrollAreaOverflowing: true }
    expect(resolveWheelRoute(base)).toBe('vertical-scroll')
    expect(resolveWheelRoute({ ...base, verticalDominant: false })).toBe('pan')
    expect(resolveWheelRoute({ ...base, modifier: true })).toBe('zoom')
  })
})
