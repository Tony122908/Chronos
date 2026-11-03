import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TaskLanes } from './TaskLanes'

describe('task completion control', () => {
  it('renders a native, named Done action without changing task coordinates', () => {
    const task = { id: 't1', title: 'Finish report', start: Date.UTC(2026, 10, 3), end: Date.UTC(2026, 10, 3), importance: 0 as const, urgency: 50, notes: '', projectId: null }
    const markup = renderToStaticMarkup(<TaskLanes tasks={[task]} projects={[]} view={{ centerMs: task.start, pxPerDay: 8 }} width={800}
      onSelect={() => undefined} onReschedule={() => undefined} onReorder={() => undefined} onComplete={() => undefined} />)
    expect(markup).toContain('aria-label="Mark Finish report done"')
    expect(markup).toContain('class="task-done ')
    expect(task.start).toBe(Date.UTC(2026, 10, 3))
  })
})
