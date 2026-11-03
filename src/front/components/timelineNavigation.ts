import { Level } from '../../back/engine/levels'

export type TimelineUnitNavigation = {
  row: 'main' | 'parent'
  start: number
  end?: number
  anchorMs?: number
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
    const candidate = unit.anchorMs ?? focusMs
    const anchorMs = unit.end === undefined
      ? unit.start
      : Math.min(unit.end - 1, Math.max(unit.start, candidate))
    return { level: (currentLevel + 1) as Level, anchorMs }
  }
  if (unit.targetLevel === undefined || unit.end === undefined || unit.targetLevel >= currentLevel) return null
  return { level: unit.targetLevel, anchorMs: resolveParentAnchor(focusMs, unit.start, unit.end) }
}

