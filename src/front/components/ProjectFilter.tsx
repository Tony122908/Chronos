import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NO_PROJECT, Project, ProjectColor } from '../../back/lib/projects'
import { Task } from '../../back/lib/tasks'
import { ProjectColorPicker } from './ProjectColorPicker'

type Props = {
  projects: Project[]; tasks: Task[]; selected: string[] | null
  onSelected: (selected: string[] | null) => void
  onCreate: (name: string, color?: ProjectColor) => string | null
  onUpdate: (id: string, name: string, color: ProjectColor) => void
  onDelete: (id: string) => void
}

const LIMIT = 6
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function ProjectFilter({ projects, tasks, selected, onSelected, onCreate, onUpdate, onDelete }: Props) {
  const [rendered, setRendered] = useState(false)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState<ProjectColor>('blue')
  const [editing, setEditing] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const openFrame = useRef<number | null>(null)
  const counts = useMemo(() => {
    const result = new Map<string, number>([[NO_PROJECT, 0]])
    for (const project of projects) result.set(project.id, 0)
    for (const task of tasks) {
      const key = task.projectId && result.has(task.projectId) ? task.projectId : NO_PROJECT
      result.set(key, (result.get(key) ?? 0) + 1)
    }
    return result
  }, [projects, tasks])

  const show = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setRendered(true)
    openFrame.current = requestAnimationFrame(() => setOpen(true))
  }, [])
  const hide = useCallback((restoreFocus = false) => {
    if (openFrame.current !== null) cancelAnimationFrame(openFrame.current)
    setOpen(false)
    if (restoreFocus) trigger.current?.focus()
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setRendered(false), reducedMotion() ? 0 : 160)
  }, [])

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    if (openFrame.current !== null) cancelAnimationFrame(openFrame.current)
  }, [])
  useEffect(() => {
    if (!rendered) return
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) hide() }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(true) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [rendered, hide])

  const toggle = (id: string) => {
    if (selected === null) { onSelected([id]); return }
    onSelected(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }
  const label = selected === null ? 'All Projects' : selected.length === 0 ? 'No projects' : selected.length === 1
    ? (selected[0] === NO_PROJECT ? 'No Project' : projects.find((project) => project.id === selected[0])?.name ?? 'Project')
    : `${selected.length} Projects`
  const visible = expanded ? projects : projects.slice(0, LIMIT)
  const create = () => {
    const id = onCreate(name, color)
    if (id) { setName(''); setColor('blue'); setCreating(false); onSelected(selected === null ? null : [...selected, id]) }
  }
  const toggleExpanded = () => {
    const from = popover.current?.getBoundingClientRect().height
    setExpanded((value) => !value)
    requestAnimationFrame(() => {
      const element = popover.current
      const to = element?.getBoundingClientRect().height
      if (!reducedMotion() && element && from && to && from !== to) element.animate(
        [{ height: `${from}px` }, { height: `${to}px` }], { duration: 220, easing: 'cubic-bezier(.2,.75,.25,1)' })
    })
  }

  return <div className="project-filter" ref={root}>
    <button ref={trigger} className="project-filter-trigger" type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => open ? hide() : show()}>
      <span className="filter-glyph" aria-hidden="true">≡</span><span>{label}</span><small>{selected === null ? tasks.length : tasks.filter((task) => selected.includes(task.projectId ?? NO_PROJECT)).length}</small>
    </button>
    {rendered && <section ref={popover} className={`project-filter-popover ${open ? 'is-open' : 'is-closing'}`} role="dialog" aria-label="Filter and manage projects">
      <header><strong>Projects</strong><div><button type="button" onClick={() => onSelected([])}>Clear</button><button type="button" onClick={() => onSelected(null)}>Show All</button></div></header>
      <button className="project-option" type="button" aria-pressed={selected === null || selected.includes(NO_PROJECT)} onClick={() => toggle(NO_PROJECT)}>
        <i className="project-marker project-graphite" /><span>No Project</span><small>{counts.get(NO_PROJECT)}</small><b aria-hidden="true">✓</b>
      </button>
      {visible.map((project) => <div className="project-item" key={project.id}>
        {editing === project.id ? <form className="project-edit" onSubmit={(event) => { event.preventDefault(); onUpdate(project.id, name, color); setEditing(null); setName('') }}>
          <input autoFocus aria-label={`Rename ${project.name}`} value={name} onChange={(event) => setName(event.target.value)} />
          <ProjectColorPicker value={color} onChange={setColor} label={`Color for ${project.name}`} />
          <div className="project-edit-actions"><button type="submit">Save</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>
        </form> : <>
          <button className="project-option" type="button" aria-pressed={selected === null || selected.includes(project.id)} onClick={() => toggle(project.id)}>
            <i className={`project-marker project-${project.color}`} /><span>{project.name}</span><small>{counts.get(project.id)}</small><b aria-hidden="true">✓</b>
          </button>
          <div className="project-actions">
            <button type="button" aria-label={`Edit ${project.name}`} onClick={() => { setEditing(project.id); setName(project.name); setColor(project.color) }}>Edit</button>
            {confirming === project.id ? <button type="button" className="confirm-project-delete" onClick={() => { onDelete(project.id); setConfirming(null) }}>Confirm</button>
              : <button type="button" aria-label={`Delete ${project.name}`} onClick={() => setConfirming(project.id)}>Delete</button>}
          </div>
        </>}
      </div>)}
      {projects.length > LIMIT && <button type="button" className="show-more" onClick={toggleExpanded}>{expanded ? 'Show Less' : `Show More (${projects.length - LIMIT})`}</button>}
      {creating ? <form className="project-create" onSubmit={(event) => { event.preventDefault(); create() }}>
        <input autoFocus aria-label="Project name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" />
        <ProjectColorPicker value={color} onChange={setColor} />
        <div className="project-edit-actions"><button type="submit">Add</button><button type="button" onClick={() => setCreating(false)}>Cancel</button></div>
      </form> : <button type="button" className="create-project-button" onClick={() => { setCreating(true); setName(''); setColor('blue') }}>+ Create Project</button>}
    </section>}
  </div>
}
