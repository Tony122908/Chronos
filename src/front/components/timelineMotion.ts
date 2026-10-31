type ZoomMotion = 'folio-flip' | 'none'

type FolioElements = {
  outgoing: HTMLElement
  incoming: HTMLElement
  edgeOne: HTMLElement
  edgeTwo: HTMLElement
}

type FolioOptions = {
  motion: ZoomMotion
  zoomingIn: boolean
  originX: number
  distance: number
  reducedMotion: boolean
}

export function animateFolioTransition(elements: FolioElements, options: FolioOptions): Animation[] {
  const { outgoing, incoming, edgeOne, edgeTwo } = elements
  const origin = `${Math.max(0, Math.min(1, options.originX)) * 100}% 50%`
  outgoing.style.transformOrigin = origin
  incoming.style.transformOrigin = origin

  if (options.reducedMotion || options.motion === 'none') {
    return [outgoing.animate(
      [{ opacity: .55 }, { opacity: 0 }],
      { duration: options.reducedMotion ? 70 : 90, easing: 'ease-out', fill: 'forwards' },
    )]
  }

  const direction = options.zoomingIn ? -1 : 1
  const intensity = 1 + Math.min(2, Math.max(0, options.distance - 1)) * .12
  const duration = 245 + Math.min(2, Math.max(0, options.distance - 1)) * 15
  const turn = direction * 11 * intensity
  const travel = direction * 42 * intensity
  const animations = [
    outgoing.animate([
      { offset: 0, opacity: 1, transform: 'perspective(1200px) translateX(0) rotateY(0deg) scaleX(1)', filter: 'brightness(1)' },
      { offset: .46, opacity: .88, transform: `perspective(1200px) translateX(${travel * .34}px) rotateY(${turn * .42}deg) scaleX(.994)`, filter: 'brightness(.99)' },
      { offset: 1, opacity: 0, transform: `perspective(1200px) translateX(${travel}px) rotateY(${turn}deg) scaleX(.978)`, filter: 'brightness(.96)' },
    ], { duration, easing: 'cubic-bezier(.22,.68,.18,1)', fill: 'forwards' }),
    incoming.animate([
      { opacity: .58 },
      { offset: .58, opacity: .82 },
      { opacity: 1 },
    ], { duration, easing: 'cubic-bezier(.16,.72,.2,1)', fill: 'none' }),
  ]

  const edgeFrames: Keyframe[] = options.zoomingIn ? [
    { opacity: 0, transform: 'translateX(46px) scaleX(.18) skewX(-4deg)' },
    { offset: .28, opacity: .72 },
    { opacity: 0, transform: 'translateX(-54px) scaleX(1) skewX(-1deg)' },
  ] : [
    { opacity: 0, transform: 'translateX(-46px) scaleX(.18) skewX(4deg)' },
    { offset: .28, opacity: .72 },
    { opacity: 0, transform: 'translateX(54px) scaleX(1) skewX(1deg)' },
  ]

  edgeOne.style.transformOrigin = origin
  edgeTwo.style.transformOrigin = origin
  animations.push(
    edgeOne.animate(edgeFrames, { duration: 190 * intensity, delay: 12, easing: 'cubic-bezier(.25,.7,.2,1)', fill: 'both' }),
    edgeTwo.animate(edgeFrames, { duration: 190 * intensity, delay: 42, easing: 'cubic-bezier(.25,.7,.2,1)', fill: 'both' }),
  )
  return animations
}

