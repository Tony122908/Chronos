import { Level } from '../../back/engine/levels'

export type TimelineUnitNavigation = {
  row: 'main' | 'parent'
  start: number
  end?: number
  targetLevel?: Level
}

export type ResolvedTimelineNavigation = { level: Level; anchorMs: number } | null

export function resolveParentAnchor(focusMs: number, start: number, end: number): number {
  return focusMs >= start && focusMs < end ? focusMs : start + (end - start) / 2
}

export function resolveTimelineUnitNavigation(
  unit: TimelineUnitNavigation,
  currentLevel: Level,
  focusMs: number,
): ResolvedTimelineNavigation {
  if (unit.row === 'main') {
    if (currentLevel >= 3) return null
    return { level: (currentLevel + 1) as Level, anchorMs: unit.start }
  }
  if (unit.targetLevel === undefined || unit.end === undefined || unit.targetLevel >= currentLevel) return null
  return { level: unit.targetLevel, anchorMs: resolveParentAnchor(focusMs, unit.start, unit.end) }
}

