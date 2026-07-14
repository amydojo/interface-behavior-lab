import { describe, expect, it } from 'vitest'
import { transitionContext } from '../../test/experiment'
import { intentExperiment, type IntentState } from './model'

describe('intentExperiment', () => {
  it('starts and resets to Rest from every documented state', () => {
    expect(intentExperiment.initialState).toEqual({ id: 'Rest' })
    for (const descriptor of intentExperiment.states) {
      const _state: IntentState = { id: descriptor.id }
      expect(intentExperiment.reset()).toEqual({ id: 'Rest' })
    }
  })

  it('reveals before commitment and schedules one controlled reset', () => {
    const firstActivation = intentExperiment.transition(
      intentExperiment.reset(),
      { type: 'activate' },
      transitionContext(),
    )
    expect(firstActivation.state.id).toBe('Revealed')
    expect(firstActivation.effects.some(effect => effect.type === 'emit' && effect.action === 'action committed')).toBe(false)

    const commitment = intentExperiment.transition(
      firstActivation.state,
      { type: 'activate' },
      transitionContext(),
    )
    expect(commitment.state.id).toBe('Confirmed')
    expect(commitment.effects.filter(effect => effect.type === 'schedule')).toHaveLength(1)
    expect(commitment.effects.some(effect => effect.type === 'emit' && effect.action === 'action committed')).toBe(true)
  })

  it('handles hide, repeated reveal, and confirmation expiry deterministically', () => {
    const revealed = intentExperiment.transition(intentExperiment.reset(), { type: 'reveal' }, transitionContext()).state
    expect(intentExperiment.transition(revealed, { type: 'reveal' }, transitionContext()).state).toEqual(revealed)
    expect(intentExperiment.transition(revealed, { type: 'hide' }, transitionContext()).state.id).toBe('Rest')

    const confirmed = intentExperiment.transition(revealed, { type: 'activate' }, transitionContext()).state
    expect(intentExperiment.transition(confirmed, { type: 'confirmationElapsed' }, transitionContext()).state.id).toBe('Rest')
  })
})
