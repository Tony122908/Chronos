import { useEffect, useRef, useState } from 'react'

export function useHoverDwell(action: () => void, delay = 400) {
  const timer = useRef<number | null>(null)
  const fired = useRef(false)
  const [active, setActive] = useState(false)

  const cancel = () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    fired.current = false
    setActive(false)
  }

  const start = (pointerType: string) => {
    if (pointerType !== 'mouse' || !matchMedia('(hover: hover) and (pointer: fine)').matches || fired.current || timer.current !== null) return
    setActive(true)
    timer.current = window.setTimeout(() => {
      timer.current = null
      fired.current = true
      setActive(false)
      action()
    }, delay)
  }

  useEffect(() => cancel, [])

  return {
    active,
    cancel,
    bind: {
      onPointerEnter: (event: React.PointerEvent) => start(event.pointerType),
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          cancel()
        }
      },
    },
  }
}
