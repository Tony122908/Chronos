import { afterEach, describe, expect, it, vi } from 'vitest'
import { cancelDoneReveal, placeDoneAction, revealDoneImmediately, scheduleDoneReveal, TASK_DONE_HOVER_MS, TASK_DONE_SIZE } from './taskActions'

describe('Done action placement', () => {
  it('reserves a trailing action area only for wide task bars', () => {
    const placement = placeDoneAction({ x1: 100, x2: 420, viewportWidth: 900, estimatedLabelWidth: 120, labelOutside: false, outsideLabelGap: 6 })
    expect(placement.inside).toBe(true)
    expect(placement.labelInsetRight).toBeGreaterThan(TASK_DONE_SIZE)
    expect(placement.left).toBeLessThan(420)
  })

  it('places short-task actions after their external title without covering the bar', () => {
    const placement = placeDoneAction({ x1: 200, x2: 208, viewportWidth: 900, estimatedLabelWidth: 110, labelOutside: true, outsideLabelGap: 6 })
    expect(placement.inside).toBe(false)
    expect(placement.left).toBeGreaterThan(208 + 110)
  })

  it('flips to the left near the right viewport edge', () => {
    const placement = placeDoneAction({ x1: 820, x2: 850, viewportWidth: 900, estimatedLabelWidth: 100, labelOutside: true, outsideLabelGap: 6 })
    expect(placement.left + TASK_DONE_SIZE).toBeLessThan(820)
  })

  it('clamps to the viewport and truncates an outside label when neither side fits', () => {
    const placement = placeDoneAction({ x1: 5, x2: 18, viewportWidth: 150, estimatedLabelWidth: 180, labelOutside: true, outsideLabelGap: 6 })
    expect(placement.left).toBeGreaterThanOrEqual(0)
    expect(placement.left + TASK_DONE_SIZE).toBeLessThanOrEqual(150)
    expect(placement.outsideLabelMaxWidth).toBeDefined()
  })
})

describe('Done action disclosure', () => {
  afterEach(() => vi.useRealTimers())

  it('reveals after 2.2 seconds of continuous mouse hover', () => {
    vi.useFakeTimers()
    const reveal = vi.fn()
    scheduleDoneReveal(reveal)
    vi.advanceTimersByTime(TASK_DONE_HOVER_MS - 1)
    expect(reveal).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(reveal).toHaveBeenCalledOnce()
  })

  it('cancels disclosure when the pointer leaves', () => {
    vi.useFakeTimers()
    const reveal = vi.fn()
    const timer = scheduleDoneReveal(reveal)
    cancelDoneReveal(timer)
    vi.runAllTimers()
    expect(reveal).not.toHaveBeenCalled()
  })

  it('reveals immediately for keyboard and touch, but not mouse', () => {
    expect(revealDoneImmediately('keyboard')).toBe(true)
    expect(revealDoneImmediately('touch')).toBe(true)
    expect(revealDoneImmediately('mouse')).toBe(false)
  })
})
