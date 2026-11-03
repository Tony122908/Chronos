import { useCallback, useEffect, useState } from 'react'
import { completeTask, NewTask, restoreTask, Task } from '../../back/lib/tasks'
import { normalizeTasks, removeProjectFromTasks } from '../../back/lib/projects'

const STORAGE_KEY = 'chronos-tasks'

export type ReorderAnchor = { before: string } | { after: string }

function load(): Task[] {
  try {
    return normalizeTasks(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return []
  }
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch { /* storage unavailable; keep in memory */ }
  }, [tasks])

  const add = useCallback((task: NewTask) => setTasks((current) => [...current, { ...task, id: newId() }]), [])
  const update = useCallback((id: string, task: NewTask) => setTasks((current) => current.map((item) => item.id === id ? { ...task, id } : item)), [])
  const remove = useCallback((id: string) => setTasks((current) => current.filter((item) => item.id !== id)), [])
  const reschedule = useCallback((id: string, start: number, end: number) =>
    setTasks((current) => current.map((item) => item.id === id ? { ...item, start, end } : item)), [])
  const clearProject = useCallback((projectId: string) =>
    setTasks((current) => removeProjectFromTasks(current, projectId)), [])
  const complete = useCallback((id: string, completedAt = Date.now()) =>
    setTasks((current) => current.map((item) => item.id === id ? completeTask(item, completedAt) : item)), [])
  const restore = useCallback((id: string) =>
    setTasks((current) => current.map((item) => item.id === id ? restoreTask(item) : item)), [])

  const reorder = useCallback((id: string, anchor: ReorderAnchor) => setTasks((current) => {
    const task = current.find((item) => item.id === id)
    const rest = current.filter((item) => item.id !== id)
    const index = rest.findIndex((item) => item.id === ('before' in anchor ? anchor.before : anchor.after))
    if (!task || index === -1) return current
    rest.splice('before' in anchor ? index : index + 1, 0, task)
    return rest
  }), [])

  return { tasks, add, update, remove, reschedule, reorder, clearProject, complete, restore }
}

