import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProjectFilter } from './ProjectFilter'

describe('ProjectFilter', () => {
  it('renders a compact accessible all-projects control with a task count', () => {
    const markup = renderToStaticMarkup(<ProjectFilter projects={[]} tasks={[{ id: 't', title: 'Task', start: 1, end: 2, importance: 0, urgency: 0, notes: '', projectId: null }]}
      selected={null} onSelected={() => undefined} onCreate={() => null} onUpdate={() => undefined} onDelete={() => undefined} />)
    expect(markup).toContain('All Projects')
    expect(markup).toContain('aria-haspopup="dialog"')
    expect(markup).toContain('<small>1</small>')
  })
})
