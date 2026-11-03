import { describe, expect, it } from 'vitest'
import { createProject, deleteProject, filterTasksByProjects, NO_PROJECT, normalizeProjects, normalizeTasks, renameProject, updateProject } from './projects'
import { Task } from './tasks'

const task = (id: string, projectId?: string | null): Task => ({ id, title: id, start: 1, end: 2, importance: 0, urgency: 50, notes: '', projectId: projectId ?? null })

describe('projects', () => {
  it('creates, renames, validates, and round-trips projects', () => {
    const created = createProject([], ' Research ', 'p1', 10, 'purple')
    expect(created[0]).toMatchObject({ id: 'p1', name: 'Research', color: 'purple' })
    expect(createProject(created, 'research', 'p2', 20)).toBe(created)
    const renamed = renameProject(created, 'p1', 'Atlas')
    expect(normalizeProjects(JSON.parse(JSON.stringify(renamed)))).toEqual(renamed)
  })

  it('edits color without changing identity and migrates legacy colors safely', () => {
    const created = createProject([], 'Research', 'p1', 10, 'blue')
    expect(updateProject(created, 'p1', 'Research', 'teal')[0]).toEqual({ ...created[0], color: 'teal' })
    expect(normalizeProjects([{ ...created[0], color: 'amber' }])[0].color).toBe('orange')
    expect(normalizeProjects([{ ...created[0], color: 'rose' }])[0].color).toBe('red')
    expect(normalizeProjects([{ ...created[0], color: 'unknown' }])[0].color).toBe('blue')
  })

  it('migrates legacy tasks to No Project without changing their data', () => {
    const legacy = { id: 't1', title: 'Legacy', start: 1, end: 2, importance: 1, urgency: 40, notes: 'kept' }
    expect(normalizeTasks([legacy])).toEqual([{ ...legacy, projectId: null }])
  })

  it('preserves valid completion timestamps and removes invalid legacy values', () => {
    const base = { id: 't1', title: 'Task', start: 1, end: 2, importance: 1, urgency: 40, notes: '', projectId: null }
    expect(normalizeTasks([{ ...base, completedAt: 100 }])[0].completedAt).toBe(100)
    expect(normalizeTasks([{ ...base, completedAt: 'invalid' }])[0]).not.toHaveProperty('completedAt')
  })

  it('preserves tasks when their project is deleted', () => {
    const result = deleteProject(createProject([], 'Atlas', 'p1', 10), [task('a', 'p1'), task('b')], 'p1')
    expect(result.projects).toEqual([])
    expect(result.tasks).toEqual([task('a'), task('b')])
  })

  it('filters by one or multiple projects without mutating dates', () => {
    const tasks = [task('none'), task('one', 'p1'), task('two', 'p2')]
    expect(filterTasksByProjects(tasks, null)).toBe(tasks)
    expect(filterTasksByProjects(tasks, ['p1', NO_PROJECT]).map(({ id }) => id)).toEqual(['none', 'one'])
    expect(filterTasksByProjects(tasks, [])).toEqual([])
    expect(tasks[1].start).toBe(1)
  })
})
