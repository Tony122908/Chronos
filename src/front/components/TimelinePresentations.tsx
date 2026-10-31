import type { CSSProperties, ElementType, MouseEvent, ReactNode } from 'react'
import { Level, Span, spans } from '../../back/engine/levels'
import { startOfUTCYear } from '../../back/lib/calendar'
import { ContextualTimeLabel } from './ContextualTimeLabel'

export type TimelinePresentationProps = {
  level: Level
  start: number
  end: number
  width: number
  now: number
  focusMs: number
  todayX: number
  x: (ms: number) => number
  onToday?: () => void
  onParentNavigate?: (level: Level, start: number, end: number) => void
  decorative?: boolean
}

function isCurrent(span: Span, now: number) {
  return now >= span.start && now < span.end
}

function segmentStyle(span: Span, x: (ms: number) => number): CSSProperties {
  const x1 = x(span.start), x2 = x(span.end)
  return { left: x1, width: x2 - x1 }
}

function unitLabel(span: Span): ReactNode {
  if (span.weekday) return <><span className="unit-meta">{span.weekday}</span><span className="unit-number">{span.label}</span></>
  if (span.sublabel) return <><span className="unit-number">{span.label}</span><span className="unit-meta">{span.sublabel}</span></>
  return <span className="unit-number">{span.label}</span>
}

export function OrganizedTimeline(props: TimelinePresentationProps) {
  const contextLevels = [...Array(props.level)].map((_, index) => index as Level)
  const UnitTag: ElementType = props.decorative ? 'div' : 'button'
  const focusYear = spans(0, props.focusMs, props.focusMs + 1)[0]
  const focusYearX = props.x(startOfUTCYear(props.focusMs))
  const focusYearWidth = focusYear ? props.x(focusYear.end) - focusYearX : 160
  const contextualLeft = props.level === 0
    ? Math.max(8, Math.min(props.width - 150, focusYearX + 14))
    : Math.max(88, Math.min(props.width - 252, focusYearX + 92))
  const contextualWidth = props.level === 0 ? Math.max(90, Math.min(190, focusYearWidth - 28)) : undefined

  return <div className="timeline-scene organized-scene" aria-hidden={props.decorative || undefined}>
    <div className={`temporal-stack temporal-level-${props.level}`}>
      <div className="timeline-rows">
        {contextLevels.map((contextLevel) => {
          const immediateParent = contextLevel === props.level - 1
          const Tag: ElementType = !props.decorative ? 'button' : 'div'
          return <div key={contextLevel} className={`organized-context-row context-level-${contextLevel}${immediateParent ? ' immediate-parent' : ''}`}>
            {spans(contextLevel, props.start, props.end).map((span) => {
              const x1 = props.x(span.start), x2 = props.x(span.end)
              return <Tag key={span.start}
                {...(!props.decorative ? { type: 'button', 'data-timeline-unit': true, 'data-row': 'parent', 'data-target-level': contextLevel,
                  'data-start': span.start, 'data-end': span.end,
                  onClick: (event: MouseEvent) => { event.stopPropagation(); props.onParentNavigate?.(contextLevel, span.start, span.end) },
                  'aria-label': `View ${span.long} at ${contextLevel === 0 ? 'years' : contextLevel === 1 ? 'months' : 'weeks'} level` } : {})}
                className={`organized-context-segment${isCurrent(span, props.now) ? ' current' : ''}`}
                style={{ left: x1, width: x2 - x1 }}>
                <span style={{ left: Math.max(0, -x1), right: Math.max(0, x2 - props.width) }}>{span.long}</span>
              </Tag>
            })}
          </div>
        })}
        <div className={`organized-primary-row${props.level === 3 ? ' leaf' : ''}`}>
          {spans(props.level, props.start, props.end).map((span) => <UnitTag key={span.start}
            {...(!props.decorative ? { type: 'button', 'data-timeline-unit': true, 'data-row': 'main', 'data-start': span.start } : {})}
            className={`organized-primary-unit${span.weekend ? ' weekend' : ''}${isCurrent(span, props.now) ? ' current' : ''}`}
            style={segmentStyle(span, props.x)}>{unitLabel(span)}</UnitTag>)}
        </div>
      </div>
      <ContextualTimeLabel focusMs={props.focusMs} level={props.level}
        onToday={props.onToday} style={{ left: contextualLeft, width: contextualWidth }} />
      {props.todayX >= 0 && props.todayX <= props.width && <div className="organized-today" style={{ left: props.todayX }} aria-hidden="true"><i /><span>Today</span></div>}
    </div>
  </div>
}

