import type { TransitionContext } from '../experiments/types'

export function transitionContext(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    now: 0,
    inputContext: 'pointer',
    reducedMotion: false,
    assistance: 62,
    ...overrides,
  }
}
