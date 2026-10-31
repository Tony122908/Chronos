import { useCallback, useEffect, useRef, useState } from 'react'
import { panByPixels, ViewState } from '../../back/engine/coordinates'

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useTimeline(initial: ViewState) {
  const [view, setView] = useState(initial)
  const viewRef = useRef(initial)
  const frame = useRef<number | null>(null)
  const pending = useRef<ViewState | null>(null)
  const animation = useRef<number | null>(null)

  const apply = useCallback((value: ViewState) => { viewRef.current = value; setView(value) }, [])
  const stopAnimation = useCallback(() => {
    if (animation.current !== null) { cancelAnimationFrame(animation.current); animation.current = null }
  }, [])

  const commit = useCallback((next: ViewState | ((current: ViewState) => ViewState)) => {
    const base = pending.current ?? viewRef.current
    pending.current = typeof next === 'function' ? next(base) : next
    if (frame.current === null) {
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        const value = pending.current
        pending.current = null
        if (value) apply(value)
      })
    }
  }, [apply])

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    if (animation.current !== null) cancelAnimationFrame(animation.current)
  }, [])

  const pan = useCallback((deltaX: number) => { stopAnimation(); commit((current) => panByPixels(current, deltaX)) }, [commit, stopAnimation])

  // Replace the view immediately, dropping any queued pan or running animation.
  const jump = useCallback((value: ViewState) => { stopAnimation(); pending.current = null; apply(value) }, [apply, stopAnimation])

  const animateTo = useCallback((targetMs: number) => {
    stopAnimation()
    const from = viewRef.current
    if (prefersReducedMotion()) { apply({ ...from, centerMs: targetMs }); return }
    const start = performance.now()
    const duration = 520
    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - raw, 3)
      apply({ ...from, centerMs: from.centerMs + (targetMs - from.centerMs) * eased })
      animation.current = raw < 1 ? requestAnimationFrame(tick) : null
    }
    animation.current = requestAnimationFrame(tick)
  }, [apply, stopAnimation])

  return { view, pan, jump, animateTo }
}
