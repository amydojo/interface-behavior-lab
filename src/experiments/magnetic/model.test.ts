import { describe, expect, it } from 'vitest'
import { transitionContext } from '../../test/experiment'
import { magneticExperiment, magneticThresholds, type MagneticState } from './model'

const states: MagneticState[] = [
  { id: 'Far', distance: 240 },
  { id: 'Near', distance: 120 },
  { id: 'Aligned', distance: 20 },
  { id: 'Released', distance: 20 },
]

describe('magneticExperiment', () => {
  it('starts and resets to the documented Far state', () => {
    expect(magneticExperiment.initialState).toEqual(states[0])
    for (const state of states) {
      expect(magneticExperiment.getPresentation(state).stateName).toBe(state.id)
      expect(magneticExperiment.reset()).toEqual(states[0])
    }
  })

  it('bounds assistance calculations and pointer distance', () => {
    expect(magneticThresholds(-100)).toEqual(magneticThresholds(0))
    expect(magneticThresholds(1000)).toEqual(magneticThresholds(100))

    const aligned = magneticExperiment.transition(states[0], { type: 'pointerDistance', distance: -20 }, transitionContext({ assistance: 100 }))
    expect(aligned.state).toEqual({ id: 'Aligned', distance: 0 })

    const far = magneticExperiment.transition(states[0], { type: 'pointerDistance', distance: 99_999 }, transitionContext({ assistance: 0 }))
    expect(far.state).toEqual({ id: 'Far', distance: 10_000 })
  })

  it('makes keyboard focus equivalent to aligned pointer state', () => {
    expect(magneticExperiment.transition(states[0], { type: 'focus' }, transitionContext()).state.id).toBe('Aligned')
    expect(magneticExperiment.transition(states[2], { type: 'leave' }, transitionContext()).state).toEqual(states[0])
  })

  it('releases once, schedules one reset, and ignores invalid released-state actions', () => {
    const released = magneticExperiment.transition(states[2], { type: 'activate' }, transitionContext())
    expect(released.state.id).toBe('Released')
    expect(released.effects.filter(effect => effect.type === 'schedule')).toHaveLength(1)

    for (const action of [
      { type: 'pointerDistance', distance: 500 } as const,
      { type: 'focus' } as const,
      { type: 'leave' } as const,
    ]) {
      expect(magneticExperiment.transition(released.state, action, transitionContext())).toEqual({
        state: released.state,
        effects: [],
      })
    }

    expect(magneticExperiment.transition(released.state, { type: 'releaseElapsed' }, transitionContext()).state).toEqual(states[0])
    expect(magneticExperiment.transition(states[0], { type: 'releaseElapsed' }, transitionContext())).toEqual({ state: states[0], effects: [] })
  })
})
