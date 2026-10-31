import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { utcDate } from '../../back/lib/calendar'
import { ContextualTimeLabel } from './ContextualTimeLabel'
import { OrganizedTimeline } from './TimelinePresentations'

describe('organized timeline presentation', () => {
  it('renders the contextual control without a time of day', () => {
    const markup = renderToStaticMarkup(<ContextualTimeLabel
      focusMs={utcDate(2026, 9, 30).getTime()} level={0} onToday={() => undefined} style={{ left: 0 }} />)
    expect(markup).toContain('OCT 30')
    expect(markup).not.toMatch(/\d{1,2}:\d{2}|AM|PM/)
  })

  it('omits the old month overview grid at the years level', () => {
    const start = utcDate(2025).getTime()
    const end = utcDate(2028).getTime()
    const markup = renderToStaticMarkup(<OrganizedTimeline level={0} start={start} end={end} width={1200}
      now={utcDate(2026, 9, 30).getTime()} focusMs={utcDate(2026, 9, 30).getTime()} todayX={600}
      x={(ms) => (ms - start) / (end - start) * 1200} />)
    expect(markup).not.toContain('organized-overview-axis')
    expect(markup).not.toContain('organized-overview-month')
  })
})

