import { describe, expect, it } from 'vitest'
import { transitionContext } from '../../test/experiment'
import { pressureExperiment, type PressureState } from './model'

const states: PressureState[] = [
  { id: 'Preview', stage: 'Preview', result: null },
  { id: 'Act', stage: 'Act', result: null },
  { id: 'Commit', stage: 'Commit', result: null },
  { id: 'PreviewResult', stage: 'Preview', result: 'previewed' },
  { id: 'Recover', stage: 'Act', result: 'trashed' },
  { id: 'PermanentResult', stage: 'Commit', result: 'deleted' },
]

describe('pressureExperiment', () => {
  it('starts and resets to Preview from every state', () => {
    expect(pressureExperiment.initialState).toEqual(states[0])
    for (const _state of states) expect(pressureExperiment.reset()).toEqual(states[0])
  })

  it('keeps explicit stage transitions and deterministic hold thresholds', () => {
    const started = pressureExperiment.transition(states[0], { type: 'holdStarted' }, transitionContext())
    const scheduled = started.effects.filter(effect => effect.type === 'schedule')
    expect(scheduled).toEqual(expect.arrayContaining([
      expect.objectContaining({ delayMs: 450, action: { type: 'actThresholdReached' } }),
      expect.objectContaining({ delayMs: 1200, action: { type: 'commitThresholdReached' } }),
    ]))

    expect(pressureExperiment.transition(states[0], { type: 'actThresholdReached' }, transitionContext()).state.stage).toBe('Act')
    expect(pressureExperiment.transition(states[0], { type: 'commitThresholdReached' }, transitionContext()).state.stage).toBe('Commit')
    expect(pressureExperiment.transition(states[0], { type: 'holdStopped' }, transitionContext()).effects.filter(effect => effect.type === 'cancel')).toHaveLength(2)
  })

  it('distinguishes preview, reversible Trash, and permanent deletion', () => {
    const preview = pressureExperiment.transition(states[0], { type: 'activate' }, transitionContext())
    expect(preview.state).toMatchObject({ id: 'PreviewResult', result: 'previewed' })
    expect(preview.effects.some(effect => effect.type === 'emit' && effect.action === 'action committed')).toBe(false)

    const trash = pressureExperiment.transition(states[1], { type: 'activate' }, transitionContext())
    expect(trash.state).toMatchObject({ id: 'Recover', result: 'trashed' })

    const permanent = pressureExperiment.transition(states[2], { type: 'activate' }, transitionContext())
    expect(permanent.state).toMatchObject({ id: 'PermanentResult', result: 'deleted' })
    expect(permanent.effects.some(effect => effect.type === 'emit' && effect.detail === 'Deleted permanently')).toBe(true)
  })

  it('clears transient results without changing the selected stage', () => {
    const result = pressureExperiment.transition(states[1], { type: 'activate' }, transitionContext()).state
    expect(pressureExperiment.transition(result, { type: 'resultElapsed' }, transitionContext()).state).toEqual(states[1])
    expect(pressureExperiment.transition(states[0], { type: 'resultElapsed' }, transitionContext()).state).toEqual(states[0])
  })
})
