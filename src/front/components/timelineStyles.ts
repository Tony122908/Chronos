export const TIMELINE_STYLES = [
  { id: 'precision', short: '1', name: 'Precision Minimal' },
  { id: 'hierarchical', short: '2', name: 'Hierarchical Context' },
  { id: 'spatial', short: '3', name: 'Spatial Layered' },
  { id: 'editorial', short: '4', name: 'Editorial Timeline' },
] as const

export type TimelineStyle = typeof TIMELINE_STYLES[number]['id']

export function readTimelineStyle(): TimelineStyle {
  const candidate = new URLSearchParams(window.location.search).get('timeline')
  return TIMELINE_STYLES.some(({ id }) => id === candidate) ? candidate as TimelineStyle : 'precision'
}

export function isTimelinePreviewEnabled(): boolean {
  return new URLSearchParams(window.location.search).get('timelinePreview') === '1'
}

