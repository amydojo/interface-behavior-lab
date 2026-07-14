import { describe, expect, it } from 'vitest'
import { assertTrialFairness } from '../fairness'
import { magneticComparisonTrial } from './magnetic'

describe('magneticComparisonTrial', () => {
  it('preserves task copy, target geometry, and non-color communication', () => {
    expect(() => assertTrialFairness(magneticComparisonTrial)).not.toThrow()
    expect(magneticComparisonTrial.conditionDesign.conventional.controlLabel).toBe('Send to Maya')
    expect(magneticComparisonTrial.conditionDesign.adaptive.controlLabel).toBe('Send to Maya')
    expect(magneticComparisonTrial.conditionDesign.conventional.targetMinCssPx).toBe(44)
    expect(magneticComparisonTrial.conditionDesign.adaptive.targetMinCssPx).toBe(44)
    expect(magneticComparisonTrial.conditionDesign.conventional.sharedCopy)
      .toEqual(magneticComparisonTrial.conditionDesign.adaptive.sharedCopy)
    expect(magneticComparisonTrial.conditionDesign.conventional.communicatesWithoutColor).toBe(true)
    expect(magneticComparisonTrial.conditionDesign.adaptive.communicatesWithoutColor).toBe(true)
  })

  it('records only semantic targeting outcomes rather than pointer trajectories', () => {
    expect(magneticComparisonTrial.primaryMeasures).toContain('final-pointer-offset-px')
    expect(magneticComparisonTrial.primaryMeasures).toContain('keyboard-completion')
    expect(magneticComparisonTrial.primaryMeasures).not.toContain('pointer-path')
    expect(magneticComparisonTrial.primaryMeasures).not.toContain('gaze-path')
  })
})
