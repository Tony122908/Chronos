import { Task } from './tasks'

export type ProjectColor = 'blue' | 'teal' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'graphite'
export type Project = { id: string; name: string; color: ProjectColor; createdAt: number }

export const NO_PROJECT = '__no-project__'
export const PROJECT_COLORS: readonly ProjectColor[] = ['blue', 'teal', 'green', 'yellow', 'orange', 'red', 'purple', 'graphite']

function normalizeProjectColor(value: unknown, fallback: ProjectColor): ProjectColor {
  if (value === 'amber') return 'orange'
  if (value === 'rose') return 'red'
  return PROJECT_COLORS.includes(value as ProjectColor) ? value as ProjectColor : fallback
}

export function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) return []
  const ids = new Set<string>()
  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const candidate = entry as Partial<Project>
    const id = typeof candidate.id === 'string' ? candidate.id : ''
    const name = typeof candidate.name === 'string' ? candidate.name.trim().slice(0, 60) : ''
    if (!id || !name || ids.has(id)) return []
    ids.add(id)
    return [{ id, name, color: normalizeProjectColor(candidate.color, PROJECT_COLORS[index % PROJECT_COLORS.length]), createdAt: Number.isFinite(candidate.createdAt) ? candidate.createdAt! : 0 }]
  })
}

export function normalizeTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const task = entry as Partial<Task>
    if (typeof task.id !== 'string' || typeof task.title !== 'string' || !Number.isFinite(task.start) || !Number.isFinite(task.end)) return []
    const normalized = { ...task, projectId: typeof task.projectId === 'string' ? task.projectId : null } as Task
    if (!Number.isFinite(task.completedAt)) delete normalized.completedAt
    return [normalized]
  })
}

export function createProject(projects: Project[], name: string, id: string, now: number, color?: ProjectColor): Project[] {
  const cleanName = name.trim().slice(0, 60)
  if (!cleanName || projects.some((project) => project.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) return projects
  return [...projects, { id, name: cleanName, color: color ?? PROJECT_COLORS[projects.length % PROJECT_COLORS.length], createdAt: now }]
}

export function renameProject(projects: Project[], id: string, name: string): Project[] {
  const cleanName = name.trim().slice(0, 60)
  if (!cleanName || projects.some((project) => project.id !== id && project.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) return projects
  return projects.map((project) => project.id === id ? { ...project, name: cleanName } : project)
}

export function updateProject(projects: Project[], id: string, name: string, color: ProjectColor): Project[] {
  const renamed = renameProject(projects, id, name)
  if (renamed === projects && projects.find((project) => project.id === id)?.name !== name.trim()) return projects
  return renamed.map((project) => project.id === id ? { ...project, color } : project)
}

export function deleteProject(projects: Project[], tasks: Task[], id: string): { projects: Project[]; tasks: Task[] } {
  return {
    projects: projects.filter((project) => project.id !== id),
    tasks: removeProjectFromTasks(tasks, id),
  }
}

export function removeProjectFromTasks(tasks: Task[], id: string): Task[] {
  return tasks.map((task) => task.projectId === id ? { ...task, projectId: null } : task)
}

export function filterTasksByProjects(tasks: Task[], selected: readonly string[] | null): Task[] {
  if (selected === null) return tasks
  const ids = new Set(selected)
  return tasks.filter((task) => task.projectId ? ids.has(task.projectId) : ids.has(NO_PROJECT))
}

