export const TASK_DONE_SIZE = 24
export const TASK_DONE_GAP = 7
export const TASK_DONE_HOVER_MS = 2200
const HANDLE_CLEARANCE = 8

export type DonePlacement = {
  left: number
  inside: boolean
  labelInsetRight: number
  outsideLabelMaxWidth?: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export function placeDoneAction(input: {
  x1: number
  x2: number
  viewportWidth: number
  estimatedLabelWidth: number
  labelOutside: boolean
  outsideLabelGap: number
}): DonePlacement {
  const { x1, x2, viewportWidth, estimatedLabelWidth, labelOutside, outsideLabelGap } = input
  const barWidth = x2 - x1
  const insideRequired = estimatedLabelWidth + TASK_DONE_SIZE + TASK_DONE_GAP * 2 + HANDLE_CLEARANCE
  if (barWidth >= insideRequired) {
    const left = clamp(x2 - HANDLE_CLEARANCE - TASK_DONE_GAP - TASK_DONE_SIZE,
      Math.max(4, x1 + HANDLE_CLEARANCE + TASK_DONE_GAP), Math.max(4, viewportWidth - TASK_DONE_SIZE - 4))
    return { left, inside: true, labelInsetRight: Math.max(0, x2 - left + TASK_DONE_GAP) }
  }

  const labelStart = x2 + outsideLabelGap
  const visualEnd = labelOutside ? labelStart + estimatedLabelWidth : x2
  const right = visualEnd + TASK_DONE_GAP
  if (right + TASK_DONE_SIZE <= viewportWidth) return { left: right, inside: false, labelInsetRight: 0 }

  const left = x1 - TASK_DONE_GAP - TASK_DONE_SIZE
  if (left >= 0) return { left, inside: false, labelInsetRight: 0 }

  const edge = Math.max(0, viewportWidth - TASK_DONE_SIZE - 4)
  return {
    left: edge,
    inside: false,
    labelInsetRight: 0,
    outsideLabelMaxWidth: labelOutside ? Math.max(0, edge - TASK_DONE_GAP - labelStart) : undefined,
  }
}

export const revealDoneImmediately = (input: 'keyboard' | 'touch' | 'mouse') => input !== 'mouse'
export const scheduleDoneReveal = (callback: () => void) => setTimeout(callback, TASK_DONE_HOVER_MS)
export const cancelDoneReveal = (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer)
