import { DAY_MS, clampTime } from '../lib/calendar'

export type ViewState = { centerMs: number; pxPerDay: number }
export const MIN_PX_PER_DAY = 0.08
export const MAX_PX_PER_DAY = 160

export function timeToX(timeMs: number, view: ViewState, width: number): number {
  return width / 2 + ((timeMs - view.centerMs) / DAY_MS) * view.pxPerDay
}

export function xToTime(x: number, view: ViewState, width: number): number {
  return view.centerMs + ((x - width / 2) / view.pxPerDay) * DAY_MS
}

export function panByPixels(view: ViewState, deltaX: number): ViewState {
  return { ...view, centerMs: clampTime(view.centerMs - (deltaX / view.pxPerDay) * DAY_MS) }
}

export function zoomAt(view: ViewState, factor: number, anchorX: number, width: number): ViewState {
  const anchorTime = xToTime(anchorX, view, width)
  const pxPerDay = Math.min(MAX_PX_PER_DAY, Math.max(MIN_PX_PER_DAY, view.pxPerDay * factor))
  const centerMs = clampTime(anchorTime - ((anchorX - width / 2) / pxPerDay) * DAY_MS)
  return { centerMs, pxPerDay }
}

export function visibleRange(view: ViewState, width: number, bufferPx = 160): [number, number] {
  return [clampTime(xToTime(-bufferPx, view, width)), clampTime(xToTime(width + bufferPx, view, width))]
}
