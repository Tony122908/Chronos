import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProjectColorPicker } from './ProjectColorPicker'

describe('ProjectColorPicker', () => {
  it('renders eight named colors with a non-color selected state', () => {
    const markup = renderToStaticMarkup(<ProjectColorPicker value="orange" onChange={() => undefined} />)
    expect((markup.match(/role="radio"/g) ?? [])).toHaveLength(8)
    expect(markup).toContain('aria-label="Orange"')
    expect(markup).toContain('aria-checked="true"')
    expect(markup).toContain('>✓</span>')
  })
})
