import { useCallback, useEffect, useState } from 'react'
import { createProject, normalizeProjects, Project, ProjectColor, renameProject, updateProject } from '../../back/lib/projects'

const STORAGE_KEY = 'chronos-projects-v1'
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function load(): Project[] {
  try { return normalizeProjects(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) }
  catch { return [] }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(load)
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)) } catch { /* retain in memory */ } }, [projects])

  const add = useCallback((name: string, color?: ProjectColor) => {
    const id = newId()
    const next = createProject(projects, name, id, Date.now(), color)
    if (next === projects) return null
    setProjects(next)
    return id
  }, [projects])
  const rename = useCallback((id: string, name: string) => setProjects((current) => renameProject(current, id, name)), [])
  const update = useCallback((id: string, name: string, color: ProjectColor) => setProjects((current) => updateProject(current, id, name, color)), [])
  const remove = useCallback((id: string) => setProjects((current) => current.filter((project) => project.id !== id)), [])

  return { projects, add, rename, update, remove }
}

