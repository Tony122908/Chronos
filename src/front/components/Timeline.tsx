import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { timeToX, ViewState, visibleRange, xToTime } from '../../back/engine/coordinates'
import { Level, LEVEL_NAMES } from '../../back/engine/levels'
import { localNowMs as localNow } from '../../back/lib/calendar'
import { formatDayAccessible } from '../../back/lib/formatting'
import { usePanGestures } from '../hooks/usePanGestures'
import { OrganizedTimeline, TimelinePresentationProps } from './TimelinePresentations'
import { animateFolioTransition } from './timelineMotion'
import { resolveTimelineUnitNavigation } from './timelineNavigation'

type Props = {
  view: ViewState
  level: Level
  epoch: number
  onPan: (dx: number) => void
  onLevel: (level: number, anchorMs: number, anchorX: number) => void
  onToday: () => void
}

type TimelineFrame = { view: ViewState; level: Level; now: number }
type Transition = { id: number; frame: TimelineFrame; zoomingIn: boolean; originX: number; distance: number }

export function Timeline({ view, level, epoch, onPan, onLevel, onToday }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const incomingLayer = useRef<HTMLDivElement>(null)
  const outgoingLayer = useRef<HTMLDivElement>(null)
  const edgeOne = useRef<HTMLDivElement>(null)
  const edgeTwo = useRef<HTMLDivElement>(null)
  const previousFrame = useRef<TimelineFrame>({ view, level, now: localNow() })
  const transitionId = useRef(0)
  const motionOrigin = useRef(.5)
  const anchorPending = useRef(false)
  const activeAnimations = useRef<Animation[]>([])
  const [width, setWidth] = useState(1200)
  const [now, setNow] = useState(localNow)
  const [transition, setTransition] = useState<Transition | null>(null)
  const [forceReducedMotion] = useState(() => new URLSearchParams(window.location.search).get('reducedMotion') === '1')

  const requestLevel = (next: number, anchorMs: number, anchorX: number) => {
    motionOrigin.current = width > 0 ? anchorX / width : .5
    anchorPending.current = true
    onLevel(next, anchorMs, anchorX)
  }

  const dragging = usePanGestures(wrap, {
    onPan,
    onStep: (direction, anchorX) => requestLevel(level + direction, xToTime(anchorX, view, width), anchorX),
    // Parent-period labels are controls first. A small pointer wobble must never turn their click into a pan.
    ignore: (target) => target.closest('[data-row="parent"], .contextual-time-label') !== null,
  })

  useEffect(() => {
    const node = wrap.current
    if (!node) return
    const update = () => setWidth(node.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(localNow()), 60_000)
    return () => clearInterval(id)
  }, [])

  useLayoutEffect(() => {
    const previous = previousFrame.current
    if (previous.level !== level) {
      setTransition({
        id: ++transitionId.current,
        frame: previous,
        zoomingIn: level > previous.level,
        originX: anchorPending.current ? motionOrigin.current : .5,
        distance: Math.abs(level - previous.level),
      })
      anchorPending.current = false
    }
    previousFrame.current = { view, level, now }
  }, [epoch, level, now, view])

  useEffect(() => {
    if (!transition || !outgoingLayer.current || !incomingLayer.current || !edgeOne.current || !edgeTwo.current) return
    activeAnimations.current.forEach((animation) => animation.cancel())
    const outgoing = outgoingLayer.current.querySelector<HTMLElement>('.timeline-scene')
    const incoming = incomingLayer.current.querySelector<HTMLElement>('.timeline-scene')
    if (!outgoing || !incoming) return
    const animations = animateFolioTransition({
      outgoing,
      incoming,
      edgeOne: edgeOne.current,
      edgeTwo: edgeTwo.current,
    }, {
      motion: 'folio-flip',
      zoomingIn: transition.zoomingIn,
      originX: transition.originX,
      distance: transition.distance,
      reducedMotion: forceReducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
    activeAnimations.current = animations
    let cancelled = false
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setTransition((current) => current?.id === transition.id ? null : current)
    })
    return () => {
      cancelled = true
      animations.forEach((animation) => animation.cancel())
    }
  }, [forceReducedMotion, transition])

  const onClick = (event: React.MouseEvent) => {
    const unit = (event.target as HTMLElement).closest<HTMLElement>('[data-timeline-unit]')
    if (!unit || unit.dataset.row !== 'main') return
    const navigation = resolveTimelineUnitNavigation({ row: 'main', start: Number(unit.dataset.start) }, level, view.centerMs)
    if (!navigation) return
    const rect = wrap.current?.getBoundingClientRect()
    const anchorX = rect ? event.clientX - rect.left : width / 2
    requestLevel(navigation.level, navigation.anchorMs, anchorX)
  }

  const navigateParent = (targetLevel: Level, start: number, end: number) => {
    const navigation = resolveTimelineUnitNavigation({ row: 'parent', targetLevel, start, end }, level, view.centerMs)
    if (navigation) requestLevel(navigation.level, navigation.anchorMs, width / 2)
  }

  const makePresentationProps = (frame: TimelineFrame): TimelinePresentationProps => {
    const [start, end] = visibleRange(frame.view, width, 0)
    const x = (ms: number) => Math.round(timeToX(ms, frame.view, width))
    return { level: frame.level, start, end, width, now: frame.now, focusMs: frame.view.centerMs,
      todayX: timeToX(frame.now, frame.view, width), x }
  }
  const currentFrame = { view, level, now }
  const currentProps = { ...makePresentationProps(currentFrame), onToday, onParentNavigate: navigateParent }
  const outgoingProps = transition ? makePresentationProps(transition.frame) : null
  const focus = xToTime(width / 2, view, width)

  const reducedMotion = forceReducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches
  return <div ref={wrap}
    className={`timeline-wrap design-organized motion-folio-flip level-${level}${dragging ? ' dragging' : ''}${transition ? ` flipping ${transition.zoomingIn ? 'flip-in' : 'flip-out'}` : ''}`}
    data-testid="timeline" data-level={LEVEL_NAMES[level]} data-timeline-design="organized" data-zoom-motion="folio-flip"
    data-reduced-motion={reducedMotion} data-transition-direction={transition ? transition.zoomingIn ? 'in' : 'out' : 'idle'}
    tabIndex={0} onClick={onClick} role="application"
    aria-label={`Organized ${LEVEL_NAMES[level]} timeline centered on ${formatDayAccessible(focus)}. Drag or use arrow keys to move; use plus and minus to zoom.`}>
    <div className="timeline-stage">
      <div ref={incomingLayer} className="incoming-timeline-layer"><OrganizedTimeline {...currentProps} /></div>
      {outgoingProps && <div ref={outgoingLayer} className="outgoing-timeline-layer"><OrganizedTimeline {...outgoingProps} decorative /></div>}
      {transition && <><div ref={edgeOne} className="folio-edge edge-one" aria-hidden="true" /><div ref={edgeTwo} className="folio-edge edge-two" aria-hidden="true" /></>}
    </div>
  </div>
}

