import { describe, expect, it } from 'vitest'
import { resolveZoomAnchor } from './zoomAnchor'

describe('zoom anchor priority', () => {
  const requested = { anchorMs: Date.UTC(2026, 0, 12), anchorX: 200 }
  const today = { anchorMs: Date.UTC(2026, 10, 3), anchorX: 640 }

  it('uses Today for non-explicit zoom-in whenever Today is visible', () => {
    for (const level of ['years-to-months', 'months-to-weeks', 'weeks-to-days']) {
      expect(resolveZoomAnchor({ requested, today, zoomingIn: true, preferToday: true, todayVisible: true }), level).toEqual(today)
    }
  })

  it('preserves the pointer or focus when Today is outside the viewport', () => {
    expect(resolveZoomAnchor({ requested, today, zoomingIn: true, preferToday: true, todayVisible: false })).toEqual(requested)
  })

  it('preserves an explicitly clicked period even while Today is visible', () => {
    expect(resolveZoomAnchor({ requested, today, zoomingIn: true, preferToday: false, todayVisible: true })).toEqual(requested)
  })

  it('never redirects zoom-out to Today', () => {
    expect(resolveZoomAnchor({ requested, today, zoomingIn: false, preferToday: true, todayVisible: true })).toEqual(requested)
  })
})
