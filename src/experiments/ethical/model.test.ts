import { describe, expect, it } from 'vitest'
import { transitionContext } from '../../test/experiment'
import { ETHICAL_HOLD_MS, ethicalExperiment, type EthicalState } from './model'

const states: EthicalState[] = [
  { id: 'Notice', progress: 0, holdStartedAt: null },
  { id: 'Resist', progress: 0, holdStartedAt: null },
  { id: 'Hold', progress: 50, holdStartedAt: 0 },
  { id: 'Confirmed', progress: 100, holdStartedAt: null },
]

describe('ethicalExperiment', () => {
  it('starts and resets to Notice from every state', () => {
    expect(ethicalExperiment.initialState).toEqual(states[0])
    for (const state of states) {
      expect(ethicalExperiment.getPresentation(state).stateName).toBe(state.id)
      expect(ethicalExperiment.reset()).toEqual(states[0])
    }
  })

  it('requires consequence disclosure before commitment', () => {
    const invalidConfirm = ethicalExperiment.transition(states[0], { type: 'confirm', method: 'direct' }, transitionContext())
    expect(invalidConfirm.state).toEqual(states[0])
    expect(invalidConfirm.effects).toEqual([])

    const disclosed = ethicalExperiment.transition(states[0], { type: 'activate' }, transitionContext())
    expect(disclosed.state.id).toBe('Resist')
    expect(disclosed.effects.some(effect => effect.type === 'emit' && effect.action === 'consequence revealed')).toBe(true)

    const committed = ethicalExperiment.transition(disclosed.state, { type: 'confirm', method: 'accessible confirm action' }, transitionContext())
    expect(committed.state.id).toBe('Confirmed')
  })

  it('supports cancellation without producing a committed outcome', () => {
    const cancelled = ethicalExperiment.transition(states[1], { type: 'cancel' }, transitionContext())
    expect(cancelled.state).toEqual(states[0])
    expect(cancelled.effects.some(effect => effect.type === 'emit' && effect.action === 'action committed')).toBe(false)
    expect(cancelled.effects.some(effect => effect.type === 'emit' && effect.action === 'action cancelled')).toBe(true)
  })

  it('uses deterministic hold boundaries and an explicit cancellation path', () => {
    const started = ethicalExperiment.transition(states[1], { type: 'beginHold' }, transitionContext({ now: 100 }))
    expect(started.state).toEqual({ id: 'Hold', progress: 0, holdStartedAt: 100 })

    const before = ethicalExperiment.transition(started.state, { type: 'holdTick' }, transitionContext({ now: 100 + ETHICAL_HOLD_MS - 1 }))
    expect(before.state.id).toBe('Hold')
    expect(before.state.progress).toBeLessThan(100)

    const complete = ethicalExperiment.transition(started.state, { type: 'holdTick' }, transitionContext({ now: 100 + ETHICAL_HOLD_MS }))
    expect(complete.state.id).toBe('Confirmed')

    const cancelled = ethicalExperiment.transition(started.state, { type: 'cancelHold' }, transitionContext())
    expect(cancelled.state.id).toBe('Resist')
  })
})
