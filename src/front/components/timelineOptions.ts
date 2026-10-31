export const TIMELINE_DESIGNS = [
  { id: 'organized', name: 'Organized Timeline' },
] as const

export const ZOOM_MOTIONS = [
  { id: 'folio-flip', name: 'Rapid Folio Flip' },
  { id: 'none', name: 'No Motion (QA)' },
] as const

export type TimelineDesign = typeof TIMELINE_DESIGNS[number]['id']
export type ZoomMotion = typeof ZOOM_MOTIONS[number]['id']

export function readTimelineDesign(): TimelineDesign {
  return 'organized'
}

export function readZoomMotion(): ZoomMotion {
  const candidate = new URLSearchParams(window.location.search).get('zoomMotion')
  return ZOOM_MOTIONS.some(({ id }) => id === candidate) ? candidate as ZoomMotion : 'folio-flip'
}

export function isTimelinePreviewEnabled(): boolean {
  return new URLSearchParams(window.location.search).get('timelinePreview') === '1'
}

