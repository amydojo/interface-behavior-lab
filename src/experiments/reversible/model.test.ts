import { describe, expect, it } from 'vitest'
import { transitionContext } from '../../test/experiment'
import { RECOVERY_WINDOW_SECONDS, reversibleExperiment, type ReversibleState } from './model'

const states: ReversibleState[] = [
  { id: 'Idle', remaining: 8, endAt: null },
  { id: 'Window', remaining: 8, endAt: 8000 },
  { id: 'Expiring', remaining: 2, endAt: 8000 },
  { id: 'Expired', remaining: 0, endAt: null },
]

describe('reversibleExperiment', () => {
  it('starts and resets to Idle from every state', () => {
    expect(reversibleExperiment.initialState).toEqual(states[0])
    for (const state of states) {
      expect(reversibleExperiment.getPresentation(state).stateName).toBe(state.id)
      expect(reversibleExperiment.reset()).toEqual(states[0])
    }
  })

  it('opens one documented recovery window and makes Undo immediate', () => {
    const archived = reversibleExperiment.transition(states[0], { type: 'activate' }, transitionContext({ now: 1000 }))
    expect(archived.state).toEqual({ id: 'Window', remaining: RECOVERY_WINDOW_SECONDS, endAt: 9000 })
    expect(archived.effects.filter(effect => effect.type === 'repeat')).toHaveLength(1)

    const undone = reversibleExperiment.transition(archived.state, { type: 'activate' }, transitionContext({ now: 1200 }))
    expect(undone.state).toEqual(states[0])
    expect(undone.effects.some(effect => effect.type === 'emit' && effect.action === 'action reversed')).toBe(true)
  })

  it('uses exact expiring and expiry boundaries', () => {
    const windowState: ReversibleState = { id: 'Window', remaining: 8, endAt: 8000 }
    const beforeExpiring = reversibleExperiment.transition(windowState, { type: 'tick' }, transitionContext({ now: 4999 }))
    expect(beforeExpiring.state.id).toBe('Window')

    const expiring = reversibleExperiment.transition(windowState, { type: 'tick' }, transitionContext({ now: 5000 }))
    expect(expiring.state.id).toBe('Expiring')
    expect(expiring.state.remaining).toBe(3)

    const expired = reversibleExperiment.transition(windowState, { type: 'tick' }, transitionContext({ now: 8000 }))
    expect(expired.state).toEqual(states[3])
    expect(expired.effects.some(effect => effect.type === 'cancel')).toBe(true)
  })

  it('cannot be reopened or reversed by a stale tick after expiry', () => {
    const stale = reversibleExperiment.transition(states[3], { type: 'tick' }, transitionContext({ now: 9000 }))
    expect(stale.state).toEqual(states[3])
    expect(stale.effects).toEqual([])

    const nextArchive = reversibleExperiment.transition(states[3], { type: 'activate' }, transitionContext({ now: 9000 }))
    expect(nextArchive.state).toEqual({ id: 'Window', remaining: 8, endAt: 17000 })
  })
})
