import { describe, expect, it } from 'vitest'
import { archiveRecoveryScenario } from '../../scenarios/archive-recovery'
import { reversibleComparisonTrial } from './reversible'

describe('reversibleComparisonTrial', () => {
  it('preserves the same archive consequence, window copy, and target minimum', () => {
    expect(reversibleComparisonTrial.comparisonFacts).toEqual({
      consequence: archiveRecoveryScenario.consequence,
      reversible: true,
      recoveryLocation: 'All Mail',
    })
    expect(reversibleComparisonTrial.conditionDesign.conventional.targetMinCssPx).toBe(44)
    expect(reversibleComparisonTrial.conditionDesign.adaptive.targetMinCssPx).toBe(44)
    expect(reversibleComparisonTrial.conditionDesign.conventional.sharedCopy).toEqual(
      reversibleComparisonTrial.conditionDesign.adaptive.sharedCopy,
    )
  })

  it('keeps recovery available and represents expiry honestly', () => {
    expect(reversibleComparisonTrial.successSignals.join(' ')).toMatch(/complete documented recovery window/i)
    expect(reversibleComparisonTrial.successSignals.join(' ')).toMatch(/originating target/i)
    expect(reversibleComparisonTrial.successSignals.join(' ')).toMatch(/All Mail/i)
    expect(reversibleComparisonTrial.failureSignals.join(' ')).toMatch(/stale timer/i)
    expect(reversibleComparisonTrial.failureSignals.join(' ')).toMatch(/fabricated as zero/i)
  })

  it('records the minimum Reversible measures', () => {
    expect(reversibleComparisonTrial.primaryMeasures).toEqual([
      'undo-discovery-time-ms',
      'recovery-success',
      'missed-recovery-window',
      'post-expiry-location-understanding',
    ])
    expect(reversibleComparisonTrial.completionRule.acceptedOutcomes).toEqual([
      'reversed',
      'expired',
      'abandoned',
    ])
  })
})
