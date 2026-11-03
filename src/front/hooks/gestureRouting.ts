export type WheelRoute = 'local' | 'zoom' | 'vertical-scroll' | 'pan'

export type WheelRouteInput = {
  modifier: boolean
  blockedSurface: boolean
  verticalDominant: boolean
  verticalScrollEnabled: boolean
  insideScrollArea: boolean
  scrollAreaOverflowing: boolean
}

export function resolveWheelRoute(input: WheelRouteInput): WheelRoute {
  if (input.blockedSurface) return 'local'
  if (input.modifier) return 'zoom'
  if (input.verticalDominant && input.verticalScrollEnabled && input.insideScrollArea && input.scrollAreaOverflowing) return 'vertical-scroll'
  return 'pan'
}
