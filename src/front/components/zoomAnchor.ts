export type ZoomAnchor = { anchorMs: number; anchorX: number }

export function resolveZoomAnchor(input: {
  requested: ZoomAnchor
  today: ZoomAnchor
  zoomingIn: boolean
  preferToday: boolean
  todayVisible: boolean
}): ZoomAnchor {
  return input.zoomingIn && input.preferToday && input.todayVisible ? input.today : input.requested
}
