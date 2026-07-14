import { describe, expect, it } from 'vitest'
import { publicPublishScenario } from '../../scenarios/public-publish'
import { ethicalComparisonTrial } from './ethical'

describe('ethicalComparisonTrial', () => {
  it('preserves the same public consequence and target contract', () => {
    expect(ethicalComparisonTrial.taskPrompt).toContain('384 people')
    expect(ethicalComparisonTrial.comparisonFacts).toEqual({
      consequence: publicPublishScenario.consequence,
      audienceSize: 384,
      reversible: false,
    })
    expect(ethicalComparisonTrial.conditionDesign.conventional.targetMinCssPx).toBe(44)
    expect(ethicalComparisonTrial.conditionDesign.adaptive.targetMinCssPx).toBe(44)
    expect(ethicalComparisonTrial.conditionDesign.conventional.sharedCopy).toEqual(
      ethicalComparisonTrial.conditionDesign.adaptive.sharedCopy,
    )
  })

  it('requires disclosure, cancellation, and an accessible non-hold path', () => {
    expect(ethicalComparisonTrial.successSignals.join(' ')).toMatch(/recalls the audience/i)
    expect(ethicalComparisonTrial.successSignals.join(' ')).toMatch(/Cancel remains immediately available/i)
    expect(ethicalComparisonTrial.successSignals.join(' ')).toMatch(/non-hold confirmation path/i)
    expect(ethicalComparisonTrial.failureSignals.join(' ')).toMatch(/before consequence disclosure/i)
    expect(ethicalComparisonTrial.failureSignals.join(' ')).toMatch(/only accessible confirmation path/i)
  })

  it('records only the minimum Ethical measures', () => {
    expect(ethicalComparisonTrial.primaryMeasures).toEqual([
      'consequence-recall',
      'cancellation-after-disclosure',
      'accidental-publish',
      'perceived-coercion',
      'outcome-confidence',
    ])
    expect(ethicalComparisonTrial.debriefQuestions.map(question => question.id)).toEqual([
      'prediction',
      'confidence',
      'coercion',
    ])
  })
})
