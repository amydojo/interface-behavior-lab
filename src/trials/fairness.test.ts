import { describe, expect, it } from 'vitest'
import { intentComparisonTrial } from './definitions/intent'
import { validateTrialFairness } from './fairness'
import { trialById, trialRegistry, trialsByExperiment } from './registry'
import type { TrialDefinition } from './types'

describe('trial comparison fairness', () => {
  it('accepts the registered Intent comparison', () => {
    expect(validateTrialFairness(intentComparisonTrial)).toEqual([])
    expect(trialRegistry).toContain(intentComparisonTrial)
    expect(trialById[intentComparisonTrial.id]).toBe(intentComparisonTrial)
    expect(trialsByExperiment.intent).toEqual([intentComparisonTrial])
  })

  it('detects target-size, copy, color, and degradation advantages', () => {
    const broken = {
      ...intentComparisonTrial,
      conditionDesign: {
        conventional: {
          ...intentComparisonTrial.conditionDesign.conventional,
          targetMinCssPx: 40,
          communicatesWithoutColor: false,
          intentionallyDegraded: true,
          sharedCopy: ['Hidden conventional explanation'],
        },
        adaptive: {
          ...intentComparisonTrial.conditionDesign.adaptive,
          targetMinCssPx: 52,
          sharedCopy: ['Adaptive explanation'],
        },
      },
    } satisfies TrialDefinition

    expect(validateTrialFairness(broken).map(issue => issue.code)).toEqual(expect.arrayContaining([
      'target-size-minimum',
      'target-size-parity',
      'shared-copy-parity',
      'color-only-communication',
      'intentional-degradation',
    ]))
  })

  it('requires both conditions exactly once', () => {
    const broken = {
      ...intentComparisonTrial,
      conditions: ['adaptive', 'adaptive'],
    } satisfies TrialDefinition

    expect(validateTrialFairness(broken)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'condition-set' }),
    ]))
  })
})
