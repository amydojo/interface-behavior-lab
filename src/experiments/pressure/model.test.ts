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
    for (const state of states) {
      expect(pressureExperiment.getPresentation(state).stateName).toBeDefined()
      expect(pressureExperiment.reset()).toEqual(states[0])
    }
  })

  it('supports explicit stage selection independently of simulated hold', () => {
    const selected = pressureExperiment.transition(
      states[0],
      { type: 'selectStage', stage: 'Commit' },
      transitionContext(),
    )
    expect(selected.state).toEqual(states[2])
    expect(selected.effects).toContainEqual({
      type: 'emit',
      action: 'threshold selected',
      detail: 'Commit via explicit stage control',
    })
  })

  it('keeps deterministic hold thresholds and declares replacement effects on repeated starts', () => {
    const started = pressureExperiment.transition(states[0], { type: 'holdStarted' }, transitionContext())
    const repeated = pressureExperiment.transition(started.state, { type: 'holdStarted' }, transitionContext())
    for (const result of [started, repeated]) {
      const scheduled = result.effects.filter(effect => effect.type === 'schedule')
      expect(scheduled).toEqual(expect.arrayContaining([
        expect.objectContaining({ timerId: 'pressure-act-threshold', delayMs: 450, action: { type: 'actThresholdReached' } }),
        expect.objectContaining({ timerId: 'pressure-commit-threshold', delayMs: 1200, action: { type: 'commitThresholdReached' } }),
      ]))
      expect(result.effects.filter(effect => effect.type === 'cancel')).toHaveLength(2)
    }

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

  it('clears transient results without changing the selected stage and ignores stale result expiry', () => {
    const result = pressureExperiment.transition(states[1], { type: 'activate' }, transitionContext()).state
    expect(pressureExperiment.transition(result, { type: 'resultElapsed' }, transitionContext()).state).toEqual(states[1])
    expect(pressureExperiment.transition(states[0], { type: 'resultElapsed' }, transitionContext())).toEqual({ state: states[0], effects: [] })
  })
})
