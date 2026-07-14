import { describe, expect, it } from 'vitest'
import { validateTrialFairness } from '../fairness'
import { breathingComparisonTrial, breathingStateSequence } from './breathing'

describe('breathingComparisonTrial', () => {
  it('passes the shared comparison fairness contract', () => {
    expect(validateTrialFairness(breathingComparisonTrial)).toEqual([])
  })

  it('holds literal state copy, target size, and observation count constant', () => {
    const { conventional, adaptive } = breathingComparisonTrial.conditionDesign

    expect(conventional.sharedCopy).toEqual(adaptive.sharedCopy)
    expect(conventional.targetMinCssPx).toBe(adaptive.targetMinCssPx)
    expect(conventional.targetMinCssPx).toBeGreaterThanOrEqual(44)
    expect(breathingComparisonTrial.comparisonFacts.objectCount).toBe(breathingStateSequence.length)
    expect(breathingStateSequence).toEqual(['Processing', 'Ready', 'Complete', 'Listening'])
  })

  it('names the research measures without claiming a preferred condition', () => {
    expect(breathingComparisonTrial.primaryMeasures).toEqual([
      'state-identification-accuracy',
      'mean-identification-time-ms',
      'motion-preference',
      'distraction-rating',
    ])
    expect(JSON.stringify(breathingComparisonTrial)).not.toMatch(/proved|validated|superior|winner/i)
  })
})
