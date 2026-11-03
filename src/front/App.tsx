import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { TaskDialog } from './components/TaskDialog'
import { TaskLanes } from './components/TaskLanes'
import { ProjectFilter } from './components/ProjectFilter'
import { Timeline } from './components/Timeline'
import { timeToX, visibleRange, xToTime } from '../back/engine/coordinates'
import { clampLevel, Level, LEVEL_PX_PER_DAY } from '../back/engine/levels'
import { clampTime, DAY_MS } from '../back/lib/calendar'
import { activeTasks, Importance, NewTask, Task } from '../back/lib/tasks'
import { filterTasksByProjects } from '../back/lib/projects'
import { usePanGestures } from './hooks/usePanGestures'
import { useTasks } from './hooks/useTasks'
import { useProjects } from './hooks/useProjects'
import { useTimeline } from './hooks/useTimeline'
import { resolveZoomAnchor } from './components/zoomAnchor'
import './styles/globals.css'

const FILTER_KEY = 'chronos-importance-filter'

function loadFilter(): boolean[] {
  try {
    const saved = JSON.parse(localStorage.getItem(FILTER_KEY) ?? 'null')
    if (Array.isArray(saved) && saved.length === 3) return saved.map(Boolean)
  } catch { /* show everything */ }
  return [true, true, true]
}

function initialCenter() {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

export default function App() {
  const [level, setLevel] = useState<Level>(0)
  const [epoch, setEpoch] = useState(0)
  const [taskOpen, setTaskOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const timeline = useTimeline({ centerMs: initialCenter(), pxPerDay: LEVEL_PX_PER_DAY[0] })
  const tasks = useTasks()
  const projects = useProjects()
  const [selectedProjects, setSelectedProjects] = useState<string[] | null>(null)
  const [shown, setShown] = useState(loadFilter)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('chronos-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('chronos-theme', theme)
  }, [theme])
  useEffect(() => {
    const resize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  useEffect(() => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(shown)) } catch { /* storage unavailable */ }
  }, [shown])

  const [start, end] = useMemo(() => visibleRange(timeline.view, width, 0), [timeline.view, width])
  const activeTaskList = activeTasks(tasks.tasks)
  const visibleTasks = filterTasksByProjects(activeTaskList.filter((task) => shown[task.importance]), selectedProjects)
  const toggleImportance = (importance: Importance) => setShown((current) => current.map((on, index) => index === importance ? !on : on))

  const changeLevel = (next: number, anchorMs: number, anchorX: number, preferToday = false) => {
    const target = clampLevel(next)
    if (target === level) return
    const todayMs = initialCenter()
    const todayX = timeToX(todayMs, timeline.view, width)
    const resolved = resolveZoomAnchor({
      requested: { anchorMs, anchorX },
      today: { anchorMs: todayMs, anchorX: todayX },
      zoomingIn: target > level,
      preferToday,
      todayVisible: todayX >= 0 && todayX <= width,
    })
    const pxPerDay = LEVEL_PX_PER_DAY[target]
    setLevel(target)
    timeline.jump({ centerMs: clampTime(resolved.anchorMs + ((width / 2 - resolved.anchorX) / pxPerDay) * DAY_MS), pxPerDay })
    setEpoch((value) => value + 1)
    return resolved
  }
  const stepLevel = (delta: number) => changeLevel(level + delta, timeline.view.centerMs, width / 2, true)
  const directLevel = (target: Level, anchorMs: number) => changeLevel(target, anchorMs, width / 2)
  const returnToday = () => timeline.animateTo(initialCenter())

  const detailPane = useRef<HTMLElement>(null)
  const taskScroll = useRef<HTMLDivElement>(null)
  const panningTasks = usePanGestures(detailPane, {
    onPan: timeline.pan,
    onStep: (direction, x) => changeLevel(level + direction, xToTime(x, timeline.view, width), x, true),
    ignore: (target) => target.closest('.task-bar, .task-label.outside, .task-done, .project-filter') !== null,
    wheelBlock: (target) => target.closest('.project-filter-popover') !== null,
    verticalScroll: true,
    verticalScrollRef: taskScroll,
  })

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const tag = target.tagName
      if (taskOpen || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || target.closest('.temporal-breadcrumb')) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); timeline.pan(80) }
      if (event.key === 'ArrowRight') { event.preventDefault(); timeline.pan(-80) }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); stepLevel(1) }
      if (event.key === '-') { event.preventDefault(); stepLevel(-1) }
      if (event.key.toLowerCase() === 't') { event.preventDefault(); returnToday() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const openTask = (task: Task | null) => { setEditing(task); setTaskOpen(true) }
  const closeTask = () => { setTaskOpen(false); setEditing(null) }
  const saveTask = (task: NewTask) => {
    if (editing) tasks.update(editing.id, task)
    else tasks.add(task)
    closeTask()
    if (!shown[task.importance]) toggleImportance(task.importance)
    if (task.end + DAY_MS < start || task.start > end) timeline.animateTo((task.start + task.end + DAY_MS) / 2)
  }
  const deleteTask = () => { if (editing) tasks.remove(editing.id); closeTask() }
  const deleteProject = (id: string) => {
    projects.remove(id)
    tasks.clearProject(id)
    setSelectedProjects((current) => current === null ? null : current.filter((value) => value !== id))
  }

  return <main className="app-shell">
    <Header theme={theme} shown={shown} onTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} onToggleImportance={toggleImportance}
      onToday={returnToday} onNewTask={() => openTask(null)} onZoom={stepLevel}
      focusMs={timeline.view.centerMs} level={level} onDirectLevel={directLevel} />
    <section className="timeline-pane" aria-label="Timeline">
      <Timeline view={timeline.view} level={level} epoch={epoch} onPan={timeline.pan} onLevel={changeLevel} onToday={returnToday} />
    </section>
    <section ref={detailPane} className="detail-pane" aria-label="Tasks">
      <ProjectFilter projects={projects.projects} tasks={activeTaskList} selected={selectedProjects} onSelected={setSelectedProjects}
        onCreate={projects.add} onUpdate={projects.update} onDelete={deleteProject} />
      <div ref={taskScroll} className={`task-scroll${panningTasks ? ' dragging' : ''}`}>
        <TaskLanes tasks={visibleTasks} projects={projects.projects} view={timeline.view} width={width} onSelect={openTask}
          onReschedule={tasks.reschedule} onReorder={tasks.reorder} onComplete={tasks.complete} />
      </div>
    </section>
    {taskOpen && <TaskDialog key={editing?.id ?? 'new'} task={editing ?? undefined} defaultDay={initialCenter()}
      projects={projects.projects} onCreateProject={projects.add} onClose={closeTask} onSave={saveTask} onDelete={editing ? deleteTask : undefined} />}
  </main>
}

