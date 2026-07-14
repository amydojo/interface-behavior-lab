import { describe, expect, it } from 'vitest'
import { transitionContext } from '../../test/experiment'
import { breathingExperiment } from './model'

describe('breathingExperiment', () => {
  it('starts and resets to Ready from every documented state', () => {
    expect(breathingExperiment.initialState).toEqual({ id: 'Ready' })
    for (const descriptor of breathingExperiment.states) {
      const state = { id: descriptor.id }
      expect(breathingExperiment.transition(state, { type: 'advance' }, transitionContext()).state.id).toBeDefined()
      expect(breathingExperiment.reset()).toEqual({ id: 'Ready' })
    }
  })

  it('moves through all four literal states and cycles safely', () => {
    let state = breathingExperiment.reset()
    const visited = []
    for (let index = 0; index < 4; index += 1) {
      state = breathingExperiment.transition(state, { type: 'advance' }, transitionContext()).state
      visited.push(state.id)
    }
    expect(visited).toEqual(['Listening', 'Processing', 'Complete', 'Ready'])
  })

  it('keeps semantic order identical under reduced motion', () => {
    const ready = breathingExperiment.reset()
    const standard = breathingExperiment.transition(ready, { type: 'advance' }, transitionContext({ reducedMotion: false }))
    const reduced = breathingExperiment.transition(ready, { type: 'advance' }, transitionContext({ reducedMotion: true }))
    expect(reduced.state).toEqual(standard.state)
    expect(reduced.effects).toEqual(standard.effects)
  })
})
