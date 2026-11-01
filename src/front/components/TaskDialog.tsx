import { useState } from 'react'
import { Project, ProjectColor } from '../../back/lib/projects'
import { fromDayInput, Importance, IMPORTANCE, NewTask, Task, taskColor, toDayInput, urgencyLabel } from '../../back/lib/tasks'
import { ProjectColorPicker } from './ProjectColorPicker'

// With `task` the dialog edits it and offers Delete; without, it creates a new task.
type Props = { task?: Task; defaultDay: number; projects: Project[]; onCreateProject: (name: string, color?: ProjectColor) => string | null; onClose: () => void; onSave: (task: NewTask) => void; onDelete?: () => void }

export function TaskDialog({ task, defaultDay, projects, onCreateProject, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [projectId, setProjectId] = useState(task?.projectId ?? '')
  const [creatingProject, setCreatingProject] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectColor, setProjectColor] = useState<ProjectColor>('blue')
  const [start, setStart] = useState(() => toDayInput(task?.start ?? defaultDay))
  const [end, setEnd] = useState(() => toDayInput(task?.end ?? defaultDay))
  const [importance, setImportance] = useState<Importance>(task?.importance ?? 0)
  const [urgency, setUrgency] = useState(task?.urgency ?? 50)
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Keep the range valid: moving the start past the end drags the end along.
  const changeStart = (value: string) => {
    setStart(value)
    const s = fromDayInput(value), e = fromDayInput(end)
    if (s !== null && e !== null && e < s) setEnd(value)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const s = fromDayInput(start), e = fromDayInput(end)
    if (!title.trim()) { setError('Give the task a title.'); return }
    if (s === null || e === null) { setError('Enter valid start and end dates.'); return }
    if (e < s) { setError('The end date must be on or after the start date.'); return }
    onSave({ title: title.trim(), start: s, end: e, importance, urgency, notes: notes.trim(), projectId: projectId || null })
  }

  const createProject = () => {
    const id = onCreateProject(projectName, projectColor)
    if (!id) { setError(projectName.trim() ? 'That project name is already in use.' : 'Enter a project name.'); return }
    setProjectId(id); setProjectName(''); setCreatingProject(false); setError('')
  }

  const { hue, saturation, lightness } = IMPORTANCE[importance]
  const sliderStyle = {
    '--from': taskColor(importance, 0),
    '--to': taskColor(importance, 100),
    '--thumb': `hsl(${hue} ${saturation}% ${lightness}%)`,
  } as React.CSSProperties

  return <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
    <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-title">
      <button className="dialog-close" aria-label="Close" onClick={onClose}>×</button>
      <h2 id="task-title">{task ? 'Edit task' : 'New task'}</h2>
      <form onSubmit={submit} noValidate>
        <label className="field">
          <span>Title</span>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you planning?" />
        </label>
        <label className="field project-field">
          <span>Project</span>
          <select value={creatingProject ? '__create__' : projectId} onChange={(e) => {
            if (e.target.value === '__create__') setCreatingProject(true)
            else { setProjectId(e.target.value); setCreatingProject(false) }
          }}>
            <option value="">No Project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            <option value="__create__">Create Project…</option>
          </select>
        </label>
        {creatingProject && <div className="inline-project-create">
          <input autoFocus aria-label="New project name" value={projectName} onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createProject() } if (e.key === 'Escape') setCreatingProject(false) }} placeholder="Project name" />
          <ProjectColorPicker value={projectColor} onChange={setProjectColor} />
          <button type="button" onClick={createProject}>Create</button>
          <button type="button" onClick={() => setCreatingProject(false)}>Cancel</button>
        </div>}
        <div className="field-row">
          <label className="field">
            <span>Start date</span>
            <input type="date" value={start} min="0001-01-01" max="9999-12-31" onChange={(e) => changeStart(e.target.value)} />
          </label>
          <label className="field">
            <span>End date</span>
            <input type="date" value={end} min={start} max="9999-12-31" onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span id="importance-label">Importance</span>
          <div className="importance" role="radiogroup" aria-labelledby="importance-label">
            {IMPORTANCE.map((level, i) => (
              <button key={level.name} type="button" role="radio" aria-checked={importance === i}
                onClick={() => setImportance(i as Importance)}>
                <i className="swatch" style={{ background: taskColor(i as Importance, urgency) }} />
                {level.name}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span className="urgency-head">Urgency <strong>{urgencyLabel(urgency)}</strong></span>
          <input type="range" className="urgency" min="0" max="100" value={urgency} style={sliderStyle}
            onChange={(e) => setUrgency(Number(e.target.value))} aria-valuetext={urgencyLabel(urgency)} />
        </label>
        <label className="field">
          <span>Notes</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a little context" />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          {onDelete && (confirmDelete
            ? <button type="button" className="danger confirm" onClick={onDelete} onBlur={() => setConfirmDelete(false)} autoFocus>Confirm delete</button>
            : <button type="button" className="danger" onClick={() => setConfirmDelete(true)}>Delete</button>)}
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">{task ? 'Save' : 'Add Task'}</button>
        </div>
      </form>
    </section>
  </div>
}
