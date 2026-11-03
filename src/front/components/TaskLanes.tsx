import { useEffect, useRef, useState } from 'react'
import { timeToX, ViewState } from '../../back/engine/coordinates'
import { DAY_MS, localNowMs, MAX_DATE_MS, MIN_DATE_MS } from '../../back/lib/calendar'
import { formatDayRange } from '../../back/lib/formatting'
import { Project } from '../../back/lib/projects'
import { completionDelay, IMPORTANCE, Task, taskColor } from '../../back/lib/tasks'
import { ReorderAnchor } from '../hooks/useTasks'
import { cancelDoneReveal, placeDoneAction, scheduleDoneReveal } from './taskActions'

type Props = {
  tasks: Task[] // visible tasks, top to bottom
  projects: Project[]
  view: ViewState
  width: number
  onSelect: (task: Task) => void
  onReschedule: (id: string, start: number, end: number) => void
  onReorder: (id: string, anchor: ReorderAnchor) => void
  onComplete: (id: string, completedAt?: number) => void
}

const ROW_HEIGHT = 30
const STRIDE = ROW_HEIGHT + 8
const PADDING = 18
const MIN_BAR = 8
const LABEL_GAP = 6
const DRAG_THRESHOLD = 4
const LAST_DAY_MS = MAX_DATE_MS + 1 - DAY_MS

// Rough label width, used to decide when a title no longer fits inside its bar.
const labelWidth = (title: string) => title.length * 7 + 34
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

type DragMode = 'move' | 'start' | 'end'
// The body drag locks to one axis on first movement: horizontal reschedules, vertical reorders.
type Drag = { id: string; mode: DragMode; x0: number; y0: number; axis: 'x' | 'y' | null; active: boolean; days: number; dy: number }

// Task dates after dragging by `days`: edges never cross each other and stay in the supported range.
function shifted(task: Task, mode: DragMode, days: number): [number, number] {
  const delta = days * DAY_MS
  if (mode === 'start') return [clamp(task.start + delta, MIN_DATE_MS, task.end), task.end]
  if (mode === 'end') return [task.start, clamp(task.end + delta, task.start, LAST_DAY_MS)]
  const d = clamp(delta, MIN_DATE_MS - task.start, LAST_DAY_MS - task.end)
  return [task.start + d, task.end + d]
}

export function TaskLanes({ tasks, projects, view, width, onSelect, onReschedule, onReorder, onComplete }: Props) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const [completing, setCompleting] = useState<Set<string>>(() => new Set())
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set())
  const pending = useRef<Drag | null>(null)
  const suppressClickUntil = useRef(0)
  const completingRef = useRef(new Set<string>())
  const completionTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const hoverTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => () => {
    completionTimers.current.forEach((timer) => clearTimeout(timer))
    hoverTimers.current.forEach(cancelDoneReveal)
  }, [])

  const revealDone = (id: string) => setRevealed((current) => current.has(id) ? current : new Set(current).add(id))
  const hideDone = (id: string) => {
    const timer = hoverTimers.current.get(id)
    if (timer) { cancelDoneReveal(timer); hoverTimers.current.delete(id) }
    setRevealed((current) => {
      if (!current.has(id)) return current
      const next = new Set(current); next.delete(id); return next
    })
  }
  const startHover = (event: React.PointerEvent, id: string) => {
    if (event.pointerType !== 'mouse' || drag || hoverTimers.current.has(id) || revealed.has(id)) return
    hoverTimers.current.set(id, scheduleDoneReveal(() => {
      hoverTimers.current.delete(id)
      revealDone(id)
    }))
  }

  const origin = drag ? tasks.findIndex((t) => t.id === drag.id) : -1
  const reordering = drag?.axis === 'y' && origin !== -1
  const target = reordering ? clamp(Math.round(origin + drag.dy / STRIDE), 0, tasks.length - 1) : origin

  // While a row is dragged vertically, the rows between its origin and target shift to make room.
  const slot = (i: number) => {
    if (!reordering || i === origin) return i
    if (origin < target && i > origin && i <= target) return i - 1
    if (target < origin && i >= target && i < origin) return i + 1
    return i
  }

  const onPointerDown = (e: React.PointerEvent, task: Task) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const edge = (e.target as HTMLElement).dataset.edge as 'start' | 'end' | undefined
    e.currentTarget.setPointerCapture(e.pointerId)
    pending.current = { id: task.id, mode: edge ?? 'move', x0: e.clientX, y0: e.clientY, axis: edge ? 'x' : null, active: false, days: 0, dy: 0 }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = pending.current
    if (!d) return
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0
    if (!d.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      d.active = true
      d.axis ??= Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
      hideDone(d.id)
    }
    d.days = d.axis === 'x' ? Math.round(dx / view.pxPerDay) : 0
    d.dy = d.axis === 'y' ? dy : 0
    setDrag({ ...d })
  }
  const onPointerUp = () => {
    const d = pending.current
    pending.current = null
    setDrag(null)
    if (!d?.active) return
    suppressClickUntil.current = performance.now() + 100
    const index = tasks.findIndex((t) => t.id === d.id)
    const task = tasks[index]
    if (!task) return
    if (d.axis === 'x') {
      const [start, end] = shifted(task, d.mode, d.days)
      if (start !== task.start || end !== task.end) onReschedule(task.id, start, end)
    } else {
      const to = clamp(Math.round(index + d.dy / STRIDE), 0, tasks.length - 1)
      const rest = tasks.filter((t) => t.id !== d.id)
      if (to !== index) onReorder(d.id, to < rest.length ? { before: rest[to].id } : { after: rest[rest.length - 1].id })
    }
  }
  const onPointerCancel = () => { pending.current = null; setDrag(null) }
  const select = (task: Task) => { if (performance.now() >= suppressClickUntil.current) onSelect(task) }
  const finish = (event: React.MouseEvent, task: Task) => {
    event.stopPropagation()
    if (completingRef.current.has(task.id)) return
    completingRef.current.add(task.id)
    setCompleting((current) => new Set(current).add(task.id))
    const completedAt = Date.now()
    const delay = completionDelay(matchMedia('(prefers-reduced-motion: reduce)').matches)
    completionTimers.current.set(task.id, setTimeout(() => {
      completionTimers.current.delete(task.id)
      onComplete(task.id, completedAt)
    }, delay))
  }

  const now = timeToX(localNowMs(), view, width)
  const dragClass = drag ? ` dragging ${drag.mode === 'move' ? 'drag-move' : 'drag-edge'}` : ''
  const projectById = new Map(projects.map((project) => [project.id, project]))

  return <div className={`task-lanes${dragClass}`} style={{ height: PADDING * 2 + tasks.length * STRIDE }}>
    {now >= 0 && now <= width && <div className="task-today" style={{ left: now }} />}
    {tasks.map((task, i) => {
      const active = drag?.id === task.id ? drag : null
      const [start, end] = active?.axis === 'x' ? shifted(task, active.mode, active.days) : [task.start, task.end]
      const x1 = Math.round(timeToX(start, view, width))
      const x2 = Math.max(Math.round(timeToX(end + DAY_MS, view, width)), x1 + MIN_BAR)
      const outside = x2 - x1 < labelWidth(task.title)
      if (!active && (x2 + (outside ? LABEL_GAP + labelWidth(task.title) : 0) < 0 || x1 > width)) return null
      const top = active?.axis === 'y'
        ? clamp(PADDING + i * STRIDE + active.dy, PADDING, PADDING + (tasks.length - 1) * STRIDE)
        : PADDING + slot(i) * STRIDE
      const handle = Math.min(8, (x2 - x1) / 3)
      const style = { top, '--task': taskColor(task.importance, task.urgency) } as React.CSSProperties
      const project = task.projectId ? projectById.get(task.projectId) : undefined
      const summary = `${task.title} · ${project?.name ?? 'No Project'} · ${formatDayRange(task.start, task.end)} · ${IMPORTANCE[task.importance].name} importance${task.notes ? `\n${task.notes}` : ''}`
      const isCompleting = completing.has(task.id)
      const done = placeDoneAction({ x1, x2, viewportWidth: width, estimatedLabelWidth: labelWidth(task.title), labelOutside: outside, outsideLabelGap: LABEL_GAP })
      const clippedRight = Math.max(0, x2 - width)
      const doneVisible = revealed.has(task.id)
      return <div key={task.id} className={`task-row${active ? ' active' : ''}${isCompleting ? ' completing' : ''}${doneVisible ? ' done-visible' : ''}`} style={style} title={drag ? undefined : summary}
        onPointerEnter={(event) => startHover(event, task.id)} onPointerLeave={(event) => { if (event.pointerType === 'mouse') hideDone(task.id) }}
        onPointerDownCapture={(event) => { if (event.pointerType === 'touch') revealDone(task.id) }}
        onFocusCapture={() => revealDone(task.id)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) hideDone(task.id) }}>
        <button className="task-bar" style={{ left: x1, width: x2 - x1 }} aria-label={`Edit ${task.title}`}
          onPointerDown={(e) => onPointerDown(e, task)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
          onClick={() => select(task)}>
          {!outside && <span className="task-label" style={{ left: Math.max(0, -x1), right: Math.max(clippedRight, done.inside ? done.labelInsetRight : 0) }}>
            <i className={`task-dot${project ? ` project-marker project-${project.color}` : ''}`} />{task.title}
          </span>}
          <span className="task-handle start" data-edge="start" style={{ width: handle }} />
          <span className="task-handle end" data-edge="end" style={{ width: handle }} />
        </button>
        {outside && <button className="task-label outside" style={{ left: x2 + LABEL_GAP, maxWidth: done.outsideLabelMaxWidth }} onClick={() => select(task)} tabIndex={-1}>
          <i className={`task-dot${project ? ` project-marker project-${project.color}` : ''}`} />{task.title}
        </button>}
        <button type="button" className={`task-done ${done.inside ? 'inside' : 'outside'}`} style={{ left: done.left }} aria-label={`Mark ${task.title} done`}
          title={`Mark ${task.title} done`} disabled={isCompleting || Boolean(drag)}
          onPointerDown={(event) => event.stopPropagation()} onClick={(event) => finish(event, task)}><span aria-hidden="true">✓</span></button>
        {active?.axis === 'x' && <span className="task-drag-date" style={{ left: clamp(x1, 4, Math.max(4, width - 200)) }}>{formatDayRange(start, end)}</span>}
      </div>
    })}
  </div>
}
