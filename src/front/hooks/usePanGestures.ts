import { RefObject, useEffect, useRef, useState } from 'react'

type Options = {
  onPan: (dx: number) => void
  // One level step (+1 in, −1 out) anchored at x, relative to the element's left edge.
  onStep: (direction: 1 | -1, x: number) => void
  // Pointer-downs on matching targets are left to the element's own children (e.g. draggable bars).
  ignore?: (target: HTMLElement) => boolean
  // When the element overflows vertically, plain vertical wheel scrolls it instead of panning.
  verticalScroll?: boolean
}

// Wheel and drag slide through time; pinch / modifier-wheel steps one level per gesture.
// Listeners are native because React's wheel listener is passive and cannot preventDefault.
export function usePanGestures(ref: RefObject<HTMLElement | null>, options: Options): boolean {
  const latest = useRef(options)
  latest.current = options
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    let pinch = 0, locked = false, idle = 0
    let drag: { x: number; moved: boolean } | null = null
    let suppressClickUntil = 0

    const onWheel = (e: WheelEvent) => {
      const { onPan, onStep, verticalScroll } = latest.current
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        clearTimeout(idle)
        idle = window.setTimeout(() => { pinch = 0; locked = false }, 200)
        if (locked) return
        pinch += e.deltaY
        if (Math.abs(pinch) < 60) return
        onStep(pinch < 0 ? 1 : -1, e.clientX - node.getBoundingClientRect().left)
        locked = true
        return
      }
      const vertical = Math.abs(e.deltaY) > Math.abs(e.deltaX)
      if (vertical && verticalScroll && node.scrollHeight > node.clientHeight) return
      e.preventDefault()
      onPan(-(vertical ? e.deltaY : e.deltaX) * (e.deltaMode === 1 ? 16 : 1))
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      if (latest.current.ignore?.(e.target as HTMLElement)) return
      drag = { x: e.clientX, moved: false }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return
      if (e.buttons === 0) { drag = null; return }
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x) <= 5) return
        drag.moved = true
        node.setPointerCapture(e.pointerId)
        setDragging(true)
      }
      latest.current.onPan(e.clientX - drag.x)
      drag.x = e.clientX
    }
    const onPointerUp = () => {
      if (drag?.moved) suppressClickUntil = performance.now() + 50
      drag = null
      setDragging(false)
    }
    // A drag never also counts as a click on whatever is under the pointer.
    const onClick = (e: MouseEvent) => {
      if (performance.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault() }
    }

    node.addEventListener('wheel', onWheel, { passive: false })
    node.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('pointermove', onPointerMove)
    node.addEventListener('pointerup', onPointerUp)
    node.addEventListener('pointercancel', onPointerUp)
    node.addEventListener('click', onClick, true)
    return () => {
      node.removeEventListener('wheel', onWheel)
      node.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('pointermove', onPointerMove)
      node.removeEventListener('pointerup', onPointerUp)
      node.removeEventListener('pointercancel', onPointerUp)
      node.removeEventListener('click', onClick, true)
      clearTimeout(idle)
    }
  }, [ref])

  return dragging
}
